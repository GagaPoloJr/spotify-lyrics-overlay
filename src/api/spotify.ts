import { invoke } from "@tauri-apps/api/core";

export async function getCurrentTrack(token: string) {
  try {
    const result = await invoke("get_current_track", { token });
    console.log(result,'results current')
    return result as { name: string; artist: string; album: string };
  } catch (error) {
    console.error("❌ Gagal ambil track:", error);
    return null;
  }
}
