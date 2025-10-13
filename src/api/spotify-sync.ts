// import { invoke } from "@tauri-apps/api/core";
//
export type SpotifySyncedLine = { time: number; text: string };

// Cari track ID berdasarkan nama & artis
export async function getSpotifyTrackId(
  name: string,
  artist: string,
  token: string
): Promise<string | null> {
  try {
    const query = encodeURIComponent(`track:${name} artist:${artist}`);
    const url = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error(`Spotify search failed (${res.status})`);

    const data = await res.json();
    const trackId = data.tracks?.items?.[0]?.id ?? null;

    if (!trackId) console.warn("⚠️ Track ID not found for:", name, "-", artist);
    else console.log("🎵 Found track ID:", trackId);

    return trackId;
  } catch (err) {
    console.error("❌ Error getSpotifyTrackId:", err);
    return null;
  }
}

// Ambil lirik bersinkronisasi (LINE_SYNCED)

// export async function getSpotifySyncedLyrics(
//   trackId: string,
//   mainToken: string
// ): Promise<Line[]> {
//   try {
//     // 🎫 Tukar token biasa ke token web player
//     const webToken = await invoke<string>("get_spotify_lyrics_token", {
//       token: mainToken,
//     });

//     // 🎵 Ambil lyrics dengan token baru
//     const raw = await invoke<string>("get_synced_lyrics", {
//       trackId,
//       token: webToken,
//     });
//     const data = JSON.parse(raw);

//     if (!data?.lyrics?.lines) return [];

//     // 🕒 Jika LINE_SYNCED, ambil waktu & teks
//     const lines = data.lyrics.lines.map((l: any) => ({
//       time: parseInt(l.startTimeMs, 10),
//       text: l.words,
//     }));

//     return lines;
//   } catch (err) {
//     console.error("getSpotifySyncedLyrics error", err);
//     return [];
//   }
// }

// src/api/spotify-sync.ts
export async function getSpotifySyncedLyrics(artist: string, title: string) {
  try {
    const res = await fetch(
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(
        artist
      )}&track_name=${encodeURIComponent(title)}`
    );

    if (!res.ok) throw new Error("Lyrics not found");

    const data = await res.json();
    if (!data?.syncedLyrics) return [];

    // convert format [mm:ss.xx] ke time (ms) dan text
    const parsed = data.syncedLyrics
      .split("\n")
      .map((line: string) => {
        const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
        if (!match) return null;
        const min = parseInt(match[1]);
        const sec = parseFloat(match[2]);
        const text = match[3].trim();
        return { time: (min * 60 + sec) * 1000, text };
      })
      .filter(Boolean) as { time: number; text: string }[];

    return parsed;
  } catch (e) {
    console.error("❌ getSpotifySyncedLyrics error:", e);
    return [];
  }
}
