# Project Analysis

## Overview

A desktop application that displays **time-synced lyrics** as an overlay on top of Spotify, built with **Tauri v2 + React + TypeScript**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Tauri Desktop App                     │
├─────────────────────────────────────────────────────────┤
│  Frontend (React + TypeScript)                          │
│  ├── LyricsSyncOverlay.tsx (Main Component)             │
│  ├── Hooks (useAuth, useSpotifyPolling, useLyricsSync)  │
│  ├── Services (lyrics.ts - dual source)                 │
│  └── Components (overlay/*)                             │
├─────────────────────────────────────────────────────────┤
│  Backend (Rust)                                         │
│  ├── OAuth2 PKCE Flow                                   │
│  ├── Local HTTP Server (port 1421)                      │
│  ├── Spotify API Integration                            │
│  └── Token Management (store plugin)                    │
├─────────────────────────────────────────────────────────┤
│  External Services                                      │
│  ├── Spotify Web API (Track Info)                       │
│  ├── Spotify Internal API (Lyrics)                      │
│  └── lrclib.net (Lyrics Fallback)                       │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Desktop Framework** | Tauri | v2.4.1 |
| **Frontend** | React | v19.1.0 |
| **Language** | TypeScript | ~5.8.3 |
| **Build Tool** | Vite | v7.0.4 |
| **CSS Framework** | Tailwind CSS | v4.1.14 |
| **Backend** | Rust | 2021 Edition |
| **HTTP Client** | reqwest | v0.12 |
| **Local Server** | tiny_http | v0.12 |

---

## Project Structure

```
spotify-lyrics-overlay/
├── src/                          # Frontend Source
│   ├── api/
│   │   └── spotify.ts            # Current track via Rust invoke
│   ├── components/
│   │   ├── LyricsSyncOverlay.tsx # Main orchestrator
│   │   └── overlay/
│   │       ├── LoginScreen.tsx   # Login UI
│   │       ├── OverlayContainer.tsx # Window container
│   │       ├── TrackInfo.tsx     # Track metadata
│   │       ├── LyricsDisplay.tsx # Lyrics renderer
│   │       └── SyncToggle.tsx    # Sync toggle button
│   ├── hooks/
│   │   ├── useAuth.ts            # Authentication logic
│   │   ├── useSpotifyPolling.ts  # Track polling & lyrics
│   │   ├── useLyricsSync.ts      # Active line sync
│   │   └── useScrollTop.ts       # Scroll tracking
│   ├── services/
│   │   └── lyrics.ts             # Dual lyrics source
│   └── utils/
│       └── pkce.ts               # PKCE challenge generation
│
├── src-tauri/                    # Rust Backend
│   ├── src/
│   │   ├── main.rs               # App entry + OAuth server
│   │   └── spotify.rs            # Spotify API integration
│   ├── .env                      # Environment variables
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri configuration
│
└── package.json                  # Node dependencies
```

---

## Data Flow

### Authentication Flow

```
1. User clicks "Login with Spotify"
2. App generates PKCE verifier + challenge
3. Local HTTP server starts on port 1421
4. Browser opens Spotify authorize URL
5. User authorizes
6. Spotify redirects to http://127.0.0.1:1421/callback?code=XXX
7. Local server captures code, emits event to frontend
8. Frontend exchanges code + verifier for tokens
9. Tokens stored in Tauri Store
```

### Lyrics Fetching Flow

```
Every 5 seconds:
1. Fetch current track from Spotify API
2. If track changed:
   a. Try Spotify Internal API (spclient.wg.spotify.com)
   b. If failed, fallback to lrclib.net
3. Parse lyrics (LRC format or Spotify JSON)
4. Display with active line highlighting
5. Auto-scroll to active line
```

---

## Components

| Component | Responsibility |
|-----------|---------------|
| `LyricsSyncOverlay` | Main orchestrator, combines hooks + components |
| `OverlayContainer` | Window wrapper with app bar and gradients |
| `LoginScreen` | Login button + manual code input |
| `TrackInfo` | Song name, artist, lyrics source |
| `LyricsDisplay` | Lyrics rendering with active line |
| `SyncToggle` | Toggle auto-sync button |

---

## Hooks

| Hook | Responsibility |
|------|---------------|
| `useAuth` | Login status, PKCE flow, deep link callback |
| `useSpotifyPolling` | Poll track every 5s, fetch lyrics on change |
| `useLyricsSync` | Calculate active line, handle scrolling |
| `useScrollTop` | Track scroll position |

---

## Issues Found & Fixed

| Issue | Status |
|-------|--------|
| Hardcoded credentials | ✅ Fixed - Using .env |
| No token refresh | ✅ Fixed - Auto-refresh |
| Blocking HTTP | ✅ Fixed - Async |
| Dead code | ✅ Removed |
| CSP disabled | ✅ Fixed |
| Deep link not working (dev) | ✅ Fixed - Local HTTP server |
| White background on resize | ✅ Fixed - w-full h-full |
| Auto-scroll not working | ✅ Fixed - Manual scroll calc |

---

*Analysis updated: 2026-05-29*
