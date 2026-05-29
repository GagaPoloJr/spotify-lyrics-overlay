import { invoke } from "@tauri-apps/api/core";

export type SpotifyTrack = {
  id: string;
  name: string;
  artist: string;
  album: string;
  album_art: string | null;
  progress_ms: number;
  duration_ms: number;
  is_playing: boolean;
};

export async function getCurrentTrack(): Promise<SpotifyTrack | null> {
  try {
    const result = await invoke("get_current_track");
    if (!result) return null;
    return result as SpotifyTrack;
  } catch (error) {
    console.error("[Spotify] Failed to get current track:", error);
    throw error;
  }
}

export async function getUserProduct(): Promise<string> {
  try {
    return await invoke("get_user_product");
  } catch (error) {
    console.error("[Spotify] Failed to get user product:", error);
    return "free";
  }
}

export async function playPause(): Promise<void> {
  try {
    await invoke("spotify_play_pause");
  } catch (error) {
    console.error("[Spotify] Play/pause failed:", error);
    throw error;
  }
}

export async function nextTrack(): Promise<void> {
  try {
    await invoke("spotify_next");
  } catch (error) {
    console.error("[Spotify] Next failed:", error);
    throw error;
  }
}

export async function prevTrack(): Promise<void> {
  try {
    await invoke("spotify_prev");
  } catch (error) {
    console.error("[Spotify] Prev failed:", error);
    throw error;
  }
}
