// import { invoke } from "@tauri-apps/api/core";

// export async function getCurrentTrack(token: string) {
//   try {
//     const result = await invoke("get_current_track", { token });
//     console.log(result, "results current");
//     return result as {
//       name: string;
//       artist: string;
//       album: string;
//       duration_ms?: number;
//       progress_ms?: number;
//     };
//   } catch (error) {
//     console.error("❌ Gagal ambil track:", error);
//     return null;
//   }
// }

import { invoke } from "@tauri-apps/api/core";

export type SpotifyTrack = {
  id: string;
  name: string;
  artist: string;
  album: string;
  progress_ms: number;
  duration_ms: number;
};

export async function getCurrentTrack(
  token: string
): Promise<SpotifyTrack | null> {
  try {
    const result = await invoke("get_current_track", { token });
    if (!result) return null;

    // biar aman kalau Rust return null
    return result as SpotifyTrack;
  } catch (error) {
    console.error("❌ Gagal ambil track:", error);
    return null;
  }
}
