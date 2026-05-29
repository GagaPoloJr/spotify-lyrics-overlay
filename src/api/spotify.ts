import { invoke } from "@tauri-apps/api/core";

export type SpotifyTrack = {
  id: string;
  name: string;
  artist: string;
  album: string;
  progress_ms: number;
  duration_ms: number;
};

export async function getCurrentTrack(): Promise<SpotifyTrack | null> {
  try {
    const result = await invoke("get_current_track");
    if (!result) return null;
    return result as SpotifyTrack;
  } catch (error) {
    console.error("[Spotify] Failed to get current track:", error);
    return null;
  }
}
