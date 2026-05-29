# Implementation Plan

## Overview

This plan covers the refactoring and improvement of the Spotify Lyrics Overlay app.

---

## Phase 1: Environment & Configuration Setup ✅

### 1.1 Add dotenvy for .env support

**File:** `src-tauri/Cargo.toml`
```toml
[dependencies]
dotenvy = "0.15"
```

**File:** `src-tauri/.env` (create new, git-ignored)
```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_REDIRECT_URI=http://127.0.0.1:1421/callback
```

**File:** `.gitignore` (add)
```
.env
src-tauri/.env
```

### 1.2 Update spotify.rs to load from .env

```rust
fn get_client_id() -> String {
    env::var("SPOTIFY_CLIENT_ID").expect("SPOTIFY_CLIENT_ID must be set in .env")
}

fn get_redirect_uri() -> String {
    env::var("SPOTIFY_REDIRECT_URI")
        .unwrap_or_else(|_| "http://127.0.0.1:1421/callback".to_string())
}
```

---

## Phase 2: PKCE OAuth2 Flow ✅

### 2.1 Frontend: Generate PKCE Challenge

**File:** `src/utils/pkce.ts`
```typescript
export async function generateCodeVerifier(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}
```

### 2.2 Update Rust Auth Commands

```rust
#[tauri::command]
pub fn spotify_login(code_challenge: String) -> String {
    // Generate auth URL with PKCE challenge
    format!(
        "https://accounts.spotify.com/authorize?\
         client_id={}&\
         response_type=code&\
         redirect_uri={}&\
         code_challenge_method=S256&\
         code_challenge={}&\
         scope=user-read-currently-playing",
        client_id, redirect_uri, code_challenge
    )
}
```

---

## Phase 3: Token Refresh Mechanism ✅

### 3.1 Store Complete Token Data

```rust
#[derive(Serialize, Deserialize, Clone)]
pub struct StoredTokens {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: i64, // Unix timestamp
}
```

### 3.2 Auto-Refresh Before API Calls

```rust
async fn get_valid_token(app: &AppHandle) -> Result<String, String> {
    let tokens = load_tokens(app)?;
    let now = Utc::now().timestamp();
    let buffer = 300; // 5 minutes before expiry
    
    if tokens.expires_at - buffer > now {
        return Ok(tokens.access_token);
    }
    
    // Refresh token
    let new_tokens = refresh_access_token(&tokens.refresh_token).await?;
    save_tokens(app, &new_tokens)?;
    Ok(new_tokens.access_token)
}
```

---

## Phase 4: Dual Lyrics Source with Fallback ✅

### 4.1 Lyrics Service

**File:** `src/services/lyrics.ts`

```typescript
export async function fetchLyrics(
  trackId: string,
  artist: string,
  title: string
): Promise<LyricsResult | null> {
  // Try Spotify first
  const spotifyLyrics = await fetchSpotifyLyrics(trackId);
  if (spotifyLyrics && spotifyLyrics.length > 0) {
    return { lyrics: spotifyLyrics, source: 'spotify' };
  }
  
  // Fallback to lrclib.net
  const lrclibLyrics = await fetchLrclibLyrics(artist, title);
  if (lrclibLyrics && lrclibLyrics.length > 0) {
    return { lyrics: lrclibLyrics, source: 'lrclib' };
  }
  
  return null;
}
```

---

## Phase 5: Code Cleanup ✅

| Action | Status |
|--------|--------|
| Remove dead code | ✅ Done |
| Async HTTP (remove blocking) | ✅ Done |
| Enable CSP | ✅ Done |
| Delete `LyricsOverlay copy.tsx` | ✅ Done |
| Clean up `lib.rs` | ✅ Done |

---

## Phase 6: Error Handling ✅

### 6.1 Handle No Playback

```typescript
if (!current) {
  setTrack(null);
  setLyrics([]);
  setActiveLine(-1);
  return;
}
```

### 6.2 Handle Pause State

```typescript
if (progressDiff < 100 && !pauseDetectedRef.current) {
  pauseDetectedRef.current = true;
  console.log('[Playback] Pause detected');
}
```

---

## Phase 7: Auto-Login with Local Server ✅

### 7.1 Local HTTP Server

**File:** `src-tauri/src/main.rs`

```rust
thread::spawn(move || {
    let server = tiny_http::Server::http("127.0.0.1:1421").unwrap();
    
    for request in server.incoming_requests() {
        if request.url().starts_with("/callback") {
            if let Some(code) = extract_code(request.url()) {
                handle.emit("oauth-callback", code);
            }
        }
    }
});
```

---

## Phase 8: UI Improvements ✅

| Feature | Status |
|---------|--------|
| Dark theme | ✅ Done |
| App bar with drag region | ✅ Done |
| Fixed header with blur | ✅ Done |
| Bottom fade effect | ✅ Done |
| Sync toggle button | ✅ Done |
| Lyrics source indicator | ✅ Done |

---

## Summary

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ | Environment & .env setup |
| 2 | ✅ | PKCE OAuth2 flow |
| 3 | ✅ | Token refresh mechanism |
| 4 | ✅ | Dual lyrics source |
| 5 | ✅ | Code cleanup |
| 6 | ✅ | Error handling |
| 7 | ✅ | Auto-login with local server |
| 8 | ✅ | UI improvements |

---

*Plan completed: 2026-05-29*
