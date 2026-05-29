use chrono::Utc;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use std::time::Duration;
use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreBuilder;

use serde_json::Value;

// --- Environment helpers ---

fn get_client_id() -> String {
    env::var("SPOTIFY_CLIENT_ID").expect("SPOTIFY_CLIENT_ID must be set in .env")
}

fn get_redirect_uri() -> String {
    env::var("SPOTIFY_REDIRECT_URI")
        .unwrap_or_else(|_| "haikal-spotify://callback".to_string())
}

// --- Token storage types ---

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct StoredTokens {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: i64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SpotifyTrack {
    pub name: String,
    pub artist: String,
    pub album: String,
}

const STORE_FILENAME: &str = "spotify_tokens.json";

// --- Token persistence ---

pub fn save_tokens(app: &AppHandle, tokens: &StoredTokens) -> Result<(), String> {
    let store_path = app
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?
        .join(STORE_FILENAME);

    let store = StoreBuilder::new(app, store_path)
        .build()
        .map_err(|e| format!("Failed to create store: {}", e))?;

    store.set("access_token", tokens.access_token.clone());
    store.set("refresh_token", tokens.refresh_token.clone());
    store.set("expires_at", tokens.expires_at);
    store
        .save()
        .map_err(|e| format!("Failed to save tokens: {}", e))?;

    println!("[Auth] Tokens saved successfully");
    Ok(())
}

pub fn load_tokens(app: &AppHandle) -> Result<Option<StoredTokens>, String> {
    let store_path = app
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?
        .join(STORE_FILENAME);

    if !store_path.exists() {
        println!("[Auth] No token file found");
        return Ok(None);
    }

    let store = StoreBuilder::new(app, store_path)
        .build()
        .map_err(|e| format!("Failed to open store: {}", e))?;

    store
        .reload()
        .map_err(|e| format!("Failed to read tokens: {}", e))?;

    let access_token = store
        .get("access_token")
        .and_then(|v| v.as_str().map(|s| s.to_string()));
    let refresh_token = store
        .get("refresh_token")
        .and_then(|v| v.as_str().map(|s| s.to_string()));
    let expires_at = store.get("expires_at").and_then(|v| v.as_i64());

    match (access_token, refresh_token, expires_at) {
        (Some(at), Some(rt), Some(ea)) => {
            println!("[Auth] Loaded tokens, expires at: {}", ea);
            Ok(Some(StoredTokens {
                access_token: at,
                refresh_token: rt,
                expires_at: ea,
            }))
        }
        // Backward compat: if only access_token exists (old format)
        (Some(at), _, _) => {
            println!("[Auth] Found legacy token format (no refresh_token)");
            Ok(Some(StoredTokens {
                access_token: at,
                refresh_token: String::new(),
                expires_at: 0,
            }))
        }
        _ => {
            println!("[Auth] No valid tokens found in store");
            Ok(None)
        }
    }
}

// --- Token refresh ---

async fn refresh_access_token(client_id: &str, refresh_token: &str) -> Result<StoredTokens, String> {
    let client = Client::new();

    let mut params: HashMap<&str, String> = HashMap::new();
    params.insert("grant_type", "refresh_token".to_string());
    params.insert("refresh_token", refresh_token.to_string());
    params.insert("client_id", client_id.to_string());

    let resp = client
        .post("https://accounts.spotify.com/api/token")
        .form(&params)
        .send()
        .await
        .map_err(|e| format!("Refresh request failed: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("Refresh failed with status: {}", resp.status()));
    }

    let json: Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse refresh response: {}", e))?;

    let new_access_token = json["access_token"]
        .as_str()
        .ok_or("No access_token in refresh response")?
        .to_string();

    let new_refresh_token = json["refresh_token"]
        .as_str()
        .unwrap_or(refresh_token) // Sometimes not returned
        .to_string();

    let expires_in = json["expires_in"].as_i64().unwrap_or(3600);

    Ok(StoredTokens {
        access_token: new_access_token,
        refresh_token: new_refresh_token,
        expires_at: Utc::now().timestamp() + expires_in,
    })
}

#[tauri::command]
pub async fn refresh_token(app: AppHandle) -> Result<StoredTokens, String> {
    let tokens = load_tokens(&app)?.ok_or("No tokens found - please login first")?;

    if tokens.refresh_token.is_empty() {
        return Err("No refresh token available - please login again".to_string());
    }

    let client_id = get_client_id();
    let new_tokens = refresh_access_token(&client_id, &tokens.refresh_token).await?;

    save_tokens(&app, &new_tokens)?;
    println!("[Auth] Token refreshed successfully");
    Ok(new_tokens)
}

/// Get a valid access token, refreshing if needed
async fn get_valid_token(app: &AppHandle) -> Result<String, String> {
    let tokens = load_tokens(app)?.ok_or("Not logged in")?;

    let now = Utc::now().timestamp();
    let buffer_seconds = 300; // Refresh 5 minutes before expiry

    if tokens.expires_at > 0 && tokens.expires_at - buffer_seconds > now {
        // Token still valid
        return Ok(tokens.access_token);
    }

    // Token expired or about to expire
    if tokens.refresh_token.is_empty() {
        println!("[Auth] Token expired and no refresh token - using existing token");
        return Ok(tokens.access_token);
    }

    println!("[Auth] Token expired/expiring, refreshing...");
    let client_id = get_client_id();
    let new_tokens = refresh_access_token(&client_id, &tokens.refresh_token).await?;
    save_tokens(app, &new_tokens)?;

    Ok(new_tokens.access_token)
}

// --- OAuth2 PKCE Flow ---

#[tauri::command]
pub fn spotify_login(code_challenge: String) -> String {
    let client_id = get_client_id();
    let redirect_uri = get_redirect_uri();

    println!("[Auth] Client ID: {}", &client_id[..8.min(client_id.len())]);
    println!("[Auth] Redirect URI: {}", redirect_uri);
    println!("[Auth] Code Challenge: {}", &code_challenge[..8.min(code_challenge.len())]);

    let auth_url = format!(
        "https://accounts.spotify.com/authorize?\
         client_id={}&\
         response_type=code&\
         redirect_uri={}&\
         code_challenge_method=S256&\
         code_challenge={}&\
         scope=user-read-currently-playing",
        client_id,
        urlencoding::encode(&redirect_uri),
        code_challenge
    );

    println!("[Auth] Generated login URL with PKCE challenge");
    auth_url
}

#[tauri::command]
pub async fn exchange_token(code: String, code_verifier: String) -> Result<StoredTokens, String> {
    let client_id = get_client_id();
    let redirect_uri = get_redirect_uri();
    let client = Client::new();

    let mut params: HashMap<&str, String> = HashMap::new();
    params.insert("grant_type", "authorization_code".to_string());
    params.insert("code", code);
    params.insert("redirect_uri", redirect_uri);
    params.insert("client_id", client_id);
    params.insert("code_verifier", code_verifier);

    let resp = client
        .post("https://accounts.spotify.com/api/token")
        .form(&params)
        .send()
        .await
        .map_err(|e| format!("Token exchange request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Token exchange failed ({}): {}", status, body));
    }

    let json: Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse token response: {}", e))?;

    let access_token = json["access_token"]
        .as_str()
        .ok_or("No access_token in response")?
        .to_string();

    let refresh_token = json["refresh_token"]
        .as_str()
        .unwrap_or("")
        .to_string();

    let expires_in = json["expires_in"].as_i64().unwrap_or(3600);

    println!(
        "[Auth] Token exchange successful, expires in {} seconds",
        expires_in
    );

    Ok(StoredTokens {
        access_token,
        refresh_token,
        expires_at: Utc::now().timestamp() + expires_in,
    })
}

// --- Spotify API calls ---

#[tauri::command]
pub async fn get_current_track(app: AppHandle) -> Result<serde_json::Value, String> {
    let token = get_valid_token(&app).await?;
    let client = Client::new();

    let response = client
        .get("https://api.spotify.com/v1/me/player/currently-playing")
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if response.status() == reqwest::StatusCode::NO_CONTENT {
        println!("[Spotify] No active playback");
        return Ok(serde_json::json!(null));
    }

    if response.status() == reqwest::StatusCode::UNAUTHORIZED {
        println!("[Spotify] Unauthorized - token may be invalid");
        return Err("Unauthorized - please login again".to_string());
    }

    if !response.status().is_success() {
        return Err(format!(
            "Failed to get track: {}",
            response.status()
        ));
    }

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| e.to_string())?;

    let track_info = &json["item"];
    if track_info.is_null() {
        println!("[Spotify] No track info in response");
        return Ok(serde_json::json!(null));
    }

    let id = track_info["id"].as_str().unwrap_or("").to_string();
    let name = track_info["name"]
        .as_str()
        .unwrap_or("Unknown")
        .to_string();
    let artist = track_info["artists"][0]["name"]
        .as_str()
        .unwrap_or("Unknown Artist")
        .to_string();
    let album = track_info["album"]["name"]
        .as_str()
        .unwrap_or("Unknown Album")
        .to_string();
    let progress_ms = json["progress_ms"].as_i64().unwrap_or(0);
    let duration_ms = track_info["duration_ms"].as_i64().unwrap_or(0);

    println!(
        "[Spotify] Now Playing: {} - {} ({} / {})",
        artist, name, progress_ms, duration_ms
    );

    Ok(serde_json::json!({
        "id": id,
        "name": name,
        "artist": artist,
        "album": album,
        "progress_ms": progress_ms,
        "duration_ms": duration_ms
    }))
}

// --- Spotify Internal Lyrics API (for fallback) ---

#[tauri::command]
pub async fn get_spotify_lyrics_token(token: String) -> Result<String, String> {
    let client = Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let res = client
        .get("https://open.spotify.com/get_access_token")
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| format!("Request failed: {e}"))?;

    if !res.status().is_success() {
        return Err(format!("Spotify lyrics token exchange failed: {}", res.status()));
    }

    let json: Value = res
        .json()
        .await
        .map_err(|e| format!("Parse error: {e}"))?;

    let access = json["accessToken"]
        .as_str()
        .ok_or("No accessToken in response")?
        .to_string();

    println!("[Spotify Lyrics] Got lyrics token");
    Ok(access)
}

#[tauri::command]
pub async fn get_synced_lyrics(track_id: String, token: String) -> Result<String, String> {
    let url = format!(
        "https://spclient.wg.spotify.com/color-lyrics/v2/track/{}?format=json&market=from_token",
        track_id
    );

    let client = Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let res = client
        .get(&url)
        .bearer_auth(&token)
        .header("App-Platform", "WebPlayer")
        .send()
        .await
        .map_err(|e| format!("Request failed: {e}"))?;

    if !res.status().is_success() {
        return Err(format!("Spotify lyrics API error: {}", res.status()));
    }

    let body = res
        .text()
        .await
        .map_err(|e| format!("Failed to read body: {e}"))?;

    println!("[Spotify Lyrics] Got synced lyrics for track {}", track_id);
    Ok(body)
}
