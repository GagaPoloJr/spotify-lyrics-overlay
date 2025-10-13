use reqwest::blocking::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreBuilder;
use urlencoding;

use serde_json::Value;
use std::time::Duration;

const CLIENT_ID: &str = "your_client_id";
const CLIENT_SECRET: &str = "your_client_secret";
const REDIRECT_URI: &str = "your_callback";
#[derive(Serialize, Deserialize, Debug)]
pub struct SpotifyTrack {
    pub name: String,
    pub artist: String,
    pub album: String,
}

pub fn load_token(app: &AppHandle) -> Result<Option<String>, String> {
    // ambil path file json
    let store_path = app
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?
        .join("spotify_tokens.json");

    // kalau file belum ada → return None
    if !store_path.exists() {
        println!("⚠️ Token file belum ada.");
        return Ok(None);
    }

    // buka store dan reload data dari disk
    let store = StoreBuilder::new(app, store_path)
        .build()
        .map_err(|e| format!("Gagal membuka store: {}", e))?;

    store
        .reload()
        .map_err(|e| format!("Gagal membaca token: {}", e))?;

    // ambil value access_token
    let token = store
        .get("access_token")
        .and_then(|v| v.as_str().map(|s| s.to_string()));

    match token {
        Some(ref t) => println!("🔑 Loaded saved token: {}", t),
        None => println!("⚠️ Tidak menemukan access_token di file."),
    }

    Ok(token)
}

#[tauri::command]
pub fn spotify_login() -> String {
    let auth_url = format!(
        "https://accounts.spotify.com/authorize?client_id={}&response_type=code&redirect_uri={}&scope=user-read-currently-playing",
        CLIENT_ID,
        urlencoding::encode(REDIRECT_URI)
    );
    auth_url
}

#[tauri::command]
pub fn exchange_token(code: String) -> Result<String, String> {
    let client = Client::new();
    let mut params: HashMap<&str, String> = HashMap::new();
    params.insert("grant_type", "authorization_code".to_string());
    params.insert("code", code);
    params.insert("redirect_uri", REDIRECT_URI.to_string());
    params.insert("client_id", CLIENT_ID.to_string());
    params.insert("client_secret", CLIENT_SECRET.to_string());

    match client
        .post("https://accounts.spotify.com/api/token")
        .form(&params)
        .send()
    {
        Ok(resp) => {
            if resp.status().is_success() {
                let json: serde_json::Value = resp.json().unwrap_or_default();
                let token = json["access_token"].as_str().unwrap_or("").to_string();
                if token.is_empty() {
                    Err("Empty access token".to_string())
                } else {
                    println!("✅ Token response: {:?}", json);
                    Ok(token)
                }
            } else {
                Err(format!("Token exchange failed: {}", resp.status()))
            }
        }
        Err(err) => Err(err.to_string()),
    }
}

/// 💾 Simpan token ke local store (persistent)
pub fn save_token(app: &AppHandle, token: &str) -> Result<(), String> {
    // Ambil path Application Support
    let store_path = app
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?
        .join("spotify_tokens.json");

    // ✅ Kirim referensi &AppHandle, bukan clone
    let store = StoreBuilder::new(app, store_path)
        .build()
        .map_err(|e| format!("Gagal membuat store: {}", e))?;

    store.set("access_token", token.to_string());
    store
        .save()
        .map_err(|e| format!("Gagal menyimpan token: {}", e))?;

    println!("💾 Token saved successfully!");
    Ok(())
}

// #[tauri::command]
// pub fn get_current_track(token: String) -> Result<SpotifyTrack, String> {
//     let client = Client::new();

//     let response = client
//         .get("https://api.spotify.com/v1/me/player/currently-playing")
//         .header("Authorization", format!("Bearer {}", token))
//         .send()
//         .map_err(|e| e.to_string())?;

//     if response.status() == 204 {
//         return Err("Tidak ada lagu yang sedang diputar.".to_string());
//     }

//     if !response.status().is_success() {
//         return Err(format!("Gagal mendapatkan track: {}", response.status()));
//     }

//     let json: serde_json::Value = response.json().map_err(|e| e.to_string())?;

//     let track_info = &json["item"];
//     let name = track_info["name"].as_str().unwrap_or("Unknown").to_string();
//     let artist = track_info["artists"][0]["name"]
//         .as_str()
//         .unwrap_or("Unknown Artist")
//         .to_string();
//     let album = track_info["album"]["name"]
//         .as_str()
//         .unwrap_or("Unknown Album")
//         .to_string();

//     println!("🎵 Now Playing: {} – {}", artist, name);

//     Ok(SpotifyTrack {
//         name,
//         artist,
//         album,
//     })
// }
#[tauri::command]
pub fn get_current_track(token: String) -> Result<serde_json::Value, String> {
    let client = Client::new();

    let response = client
        .get("https://api.spotify.com/v1/me/player/currently-playing")
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .map_err(|e| e.to_string())?;

    if response.status() == 204 {
        println!("⚠️ Tidak ada lagu yang sedang diputar.");
        return Ok(serde_json::json!(null));
    }

    if !response.status().is_success() {
        return Err(format!("Gagal mendapatkan track: {}", response.status()));
    }

    let json: serde_json::Value = response.json().map_err(|e| e.to_string())?;

    let track_info = &json["item"];
    if track_info.is_null() {
        println!("⚠️ Tidak ada track info di response.");
        return Ok(serde_json::json!(null));
    }

    let id = track_info["id"].as_str().unwrap_or("").to_string();
    let name = track_info["name"].as_str().unwrap_or("Unknown").to_string();
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
        "🎵 Now Playing: {} – {} (Progress: {} / {})",
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

#[tauri::command]
pub fn get_spotify_lyrics_token(token: String) -> Result<String, String> {
    let client = Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let res = client
        .get("https://open.spotify.com/get_access_token")
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .map_err(|e| format!("Request failed: {e}"))?;

    if !res.status().is_success() {
        return Err(format!("Spotify token exchange failed: {}", res.status()));
    }

    let json: Value = res.json().map_err(|e| format!("Parse error: {e}"))?;
    let access = json["accessToken"]
        .as_str()
        .ok_or("No accessToken in response")?
        .to_string();

    Ok(access)
}

/// Ambil lyrics sinkron dari Spotify color-lyrics API
#[tauri::command]
pub fn get_synced_lyrics(track_id: String, token: String) -> Result<String, String> {
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
        .map_err(|e| format!("Request failed: {e}"))?;

    if !res.status().is_success() {
        return Err(format!("Spotify error: {}", res.status()));
    }

    let body = res
        .text()
        .map_err(|e| format!("Failed to read body: {e}"))?;
    Ok(body)
}
