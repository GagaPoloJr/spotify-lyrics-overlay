import { invoke } from "@tauri-apps/api/core";

export interface SyncedLyric {
  time: number;
  text: string;
}

export interface LyricsResult {
  lyrics: SyncedLyric[];
  source: "spotify" | "lrclib";
}

// Parse LRC format [mm:ss.xx]text
function parseLrc(lrc: string): SyncedLyric[] {
  const lines = lrc.split("\n");
  const result: SyncedLyric[] = [];

  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const ms = parseInt(match[3].padEnd(3, "0"));
      const time = minutes * 60000 + seconds * 1000 + ms;
      const text = match[4].trim();

      if (text) {
        result.push({ time, text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

// Parse Spotify internal lyrics format
function parseSpotifyLyrics(raw: string): SyncedLyric[] {
  try {
    const data = JSON.parse(raw);
    const lines = data?.lyrics?.lines || [];

    return lines
      .map((line: any) => ({
        time: parseInt(line.startTimeMs),
        text: line.words,
      }))
      .filter((l: SyncedLyric) => l.text);
  } catch (e) {
    console.error("[Lyrics] Failed to parse Spotify lyrics:", e);
    return [];
  }
}

// Attempt 1: Spotify Internal API
async function fetchSpotifyLyrics(
  trackId: string
): Promise<SyncedLyric[] | null> {
  try {
    console.log(`[Lyrics] Attempting Spotify API for track: ${trackId}`);

    // Get stored access token
    const { load } = await import("@tauri-apps/plugin-store");
    const store = await load("spotify_tokens.json");
    const accessToken = await store.get<string>("access_token");

    if (!accessToken) {
      console.warn("[Lyrics] No access token available for Spotify lyrics");
      return null;
    }

    // Exchange for web player token
    const lyricsToken = await invoke<string>("get_spotify_lyrics_token", {
      token: accessToken,
    });

    const rawLyrics = await invoke<string>("get_synced_lyrics", {
      trackId,
      token: lyricsToken,
    });

    const parsed = parseSpotifyLyrics(rawLyrics);

    if (parsed.length > 0) {
      console.log(`[Lyrics] Spotify API success: ${parsed.length} lines`);
      return parsed;
    }

    console.warn("[Lyrics] Spotify API returned no lyrics lines");
    return null;
  } catch (error) {
    console.warn("[Lyrics] Spotify API failed:", error);
    return null;
  }
}

// Attempt 2: lrclib.net
async function fetchLrclibLyrics(
  artist: string,
  title: string
): Promise<SyncedLyric[] | null> {
  try {
    console.log(`[Lyrics] Attempting lrclib.net: ${artist} - ${title}`);

    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(
      artist
    )}&track_name=${encodeURIComponent(title)}`;

    const resp = await fetch(url);

    if (!resp.ok) {
      console.warn(`[Lyrics] lrclib.net returned ${resp.status}`);
      return null;
    }

    const data = await resp.json();

    if (data.syncedLyrics) {
      const parsed = parseLrc(data.syncedLyrics);
      console.log(`[Lyrics] lrclib.net success: ${parsed.length} lines`);
      return parsed;
    }

    console.warn("[Lyrics] lrclib.net: no synced lyrics available");
    return null;
  } catch (error) {
    console.warn("[Lyrics] lrclib.net failed:", error);
    return null;
  }
}

// Main function with fallback
export async function fetchLyrics(
  trackId: string,
  artist: string,
  title: string
): Promise<LyricsResult | null> {
  console.log(`[Lyrics] Fetching lyrics for: ${artist} - ${title}`);

  // Try Spotify first
  const spotifyLyrics = await fetchSpotifyLyrics(trackId);
  if (spotifyLyrics && spotifyLyrics.length > 0) {
    return { lyrics: spotifyLyrics, source: "spotify" };
  }

  // Fallback to lrclib.net
  console.log("[Lyrics] Spotify failed, trying lrclib.net...");
  const lrclibLyrics = await fetchLrclibLyrics(artist, title);
  if (lrclibLyrics && lrclibLyrics.length > 0) {
    return { lyrics: lrclibLyrics, source: "lrclib" };
  }

  console.warn("[Lyrics] No lyrics found from any source");
  return null;
}
