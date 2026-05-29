# Spotify Lyrics Overlay

A desktop application that displays time-synced lyrics as a transparent overlay on top of Spotify. Built with **Tauri v2 + React + TypeScript**.

![Platform](https://img.shields.io/badge/platform-macOS-lightgrey)
![Tauri](https://img.shields.io/badge/Tauri-v2-blue)
![React](https://img.shields.io/badge/React-v19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-v5-blue)

## Features

- 🎵 **Real-time synced lyrics** - Karaoke-style highlighting
- 🔄 **Dual lyrics source** - Spotify API + lrclib.net fallback
- 🔐 **PKCE OAuth2** - Secure authentication (no client secret needed)
- 🪟 **Always on top** - Transparent overlay window
- 🎨 **Dark theme** - Minimalist, clean UI
- 🖱️ **Draggable** - Move window by dragging the title bar
- ⏸️ **Pause detection** - Automatically pauses sync when playback stops

## Screenshots

```
┌──────────────────────────────────────────────────┐
│ ● Spotify Lyrics                             [x] │
├──────────────────────────────────────────────────┤
│                                                  │
│             Bohemian Rhapsody                    │
│                Queen                             │
│              ● SPOTIFY                           │
│──────────────────────────────────────────────────│
│                                                  │
│              Is this the real life?               │
│              Is this just fantasy?                │
│                                                  │
│           ● Caught in a landslide                 │
│                                                  │
│              No escape from reality               │
│                                ┌────┐            │
│                                │ 🟢 │            │
│                                └────┘            │
└──────────────────────────────────────────────────┘
```

## Prerequisites

- **Node.js** (v18 or higher)
- **Rust** (latest stable)
- **Yarn** or **npm**
- **Spotify Developer Account**

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/spotify-lyrics-overlay.git
cd spotify-lyrics-overlay
```

### 2. Install dependencies

```bash
yarn install
```

### 3. Set up Spotify Developer App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click **Create App**
3. Fill in:
   - **App Name**: Spotify Lyrics Overlay
   - **Redirect URIs**: `http://127.0.0.1:1421/callback`
   - **Which API/SDKs**: Web API
4. Click **Save**
5. Copy your **Client ID**

### 4. Configure environment variables

Create a `.env` file in the `src-tauri` directory:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_REDIRECT_URI=http://127.0.0.1:1421/callback
```

### 5. Run the application

```bash
yarn tauri dev
```

## How to Use

### First Time Setup

1. **Launch the app** - Run `yarn tauri dev`
2. **Click "Login with Spotify"** - A browser window will open
3. **Authorize the app** - Click "Agree" on Spotify's authorization page
4. **Done!** - The code will be sent automatically to the app

### Using the App

| Action | How |
|--------|-----|
| **Move window** | Drag the title bar |
| **Toggle sync** | Click the green dot (top-right) |
| **Hide window** | Click the close button (x) |
| **Show window** | Click the tray icon → "Show Overlay" |

### Lyrics Source Indicator

| Indicator | Source | Description |
|-----------|--------|-------------|
| 🟢 **SPOTIFY** | Spotify Internal API | High quality, synced lyrics |
| 🔵 **LRCLIB** | lrclib.net | Community-driven, fallback |

## Project Structure

```
spotify-lyrics-overlay/
├── src/                          # Frontend (React + TypeScript)
│   ├── api/
│   │   └── spotify.ts            # Spotify API calls
│   ├── components/
│   │   ├── LyricsSyncOverlay.tsx # Main component
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
│   │   └── lyrics.ts             # Lyrics fetching (dual source)
│   ├── utils/
│   │   └── pkce.ts               # PKCE challenge generation
│   └── App.tsx                   # Root component
│
├── src-tauri/                    # Backend (Rust + Tauri v2)
│   ├── src/
│   │   ├── main.rs               # App entry point + OAuth server
│   │   └── spotify.rs            # Spotify API integration
│   ├── .env                      # Environment variables (git-ignored)
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri configuration
│
└── package.json                  # Node dependencies
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Framework | Tauri v2 |
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Build Tool | Vite |
| Backend | Rust |
| HTTP Client | reqwest |
| Lyrics Sources | Spotify Internal API, lrclib.net |

## How It Works

### Authentication (PKCE)

```
1. App generates code_verifier (random) + code_challenge (SHA256)
2. User authorizes in browser
3. Spotify redirects to local server (http://127.0.0.1:1421/callback)
4. Local server captures authorization code
5. App exchanges code + verifier for tokens
6. Tokens stored locally for future use
```

### Lyrics Fetching

```
Every 5 seconds:
1. Fetch current track from Spotify API
2. If track changed:
   a. Try Spotify Internal API for lyrics
   b. If failed, fallback to lrclib.net
3. Parse lyrics and display
4. Sync active line with playback position
```

### Token Refresh

```
When token expires (after 1 hour):
1. App automatically uses refresh_token
2. Gets new access_token
3. No user interaction needed
```

## Development

### Build for Production

```bash
yarn tauri build
```

The built app will be in `src-tauri/target/release/bundle/`.

### Run in Development Mode

```bash
yarn tauri dev
```

### Type Checking

```bash
npx tsc --noEmit
```

### Check Rust Compilation

```bash
cd src-tauri && cargo check
```

## Troubleshooting

### Login not working

1. Make sure `SPOTIFY_CLIENT_ID` is correct in `.env`
2. Make sure redirect URI in Spotify Dashboard matches `.env`
3. Check terminal logs for error messages

### Lyrics not showing

1. Check if you have an active Spotify playback
2. Look at terminal logs for API errors
3. Try logging out and logging in again

### Window not draggable

1. Make sure you're dragging the title bar area
2. The lyrics area is not draggable (for scrolling)

### Token expired

The app automatically refreshes tokens. If you see "Login with Spotify" again:
1. Click the button
2. Re-authorize
3. You're good to go!

## API Rate Limits

| API | Rate Limit | Status |
|-----|------------|--------|
| Spotify Internal Lyrics | No documented limit | Unofficial |
| Spotify Web API | 30 req/second | Official |
| lrclib.net | No documented limit | Free |

For personal use, the current implementation is safe.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is for personal/educational use. Please respect Spotify's Terms of Service.

## Acknowledgments

- [Tauri](https://tauri.app/) - Desktop framework
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/) - Track information
- [lrclib.net](https://lrclib.net/) - Synced lyrics
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

**Note**: This app uses Spotify's internal API for lyrics, which is unofficial and may change without notice. For production use, consider using official lyrics providers.
