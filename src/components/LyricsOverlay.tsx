import { useEffect, useRef, useState } from "react";
import { getCurrentTrack } from "../api/spotify";
import { getLyrics } from "../api/lyrics";
import { load } from "@tauri-apps/plugin-store";

type Track = {
  name: string;
  artist: string;
  album: string;
};

export default function LyricsOverlay() {
  const [track, setTrack] = useState<Track | null>(null);
  const [lyrics, setLyrics] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const lyricsRef = useRef<HTMLPreElement>(null);
  const lyricsCache = useRef<Map<string, string>>(new Map());

  // ✅ ambil token dari store (pakai `load` v2)
  async function getSavedToken(): Promise<string | null> {
    try {
      const store = await load("spotify_tokens.json");
      const token = await store.get<string>("access_token");
      console.log("🟢 Loaded token:", token);
      return token ?? null;
    } catch (err) {
      console.error("❌ Gagal ambil token:", err);
      return null;
    }
  }

  // ✅ refresh lagu aktif + lirik
  async function refreshTrack(manual = false) {
    const token = await getSavedToken();
    if (!token) {
      console.warn("⚠️ Token belum tersedia");
      return;
    }

    try {
      setIsLoading(true);
      console.log(manual ? "🔁 Manual refresh..." : "🎧 Auto refresh...");
      const current = await getCurrentTrack();

      if (!current) {
        console.log("🎵 Tidak ada lagu yang sedang diputar");
        setTrack(null);
        setLyrics("");
        return;
      }

      console.log("🎶 Lagu aktif:", current.name, "-", current.artist);

      if (!track || current.name !== track.name) {
        setTrack(current);
        const key = `${current.artist}-${current.name}`;
        if (lyricsCache.current.has(key)) {
          setLyrics(lyricsCache.current.get(key)!);
        } else {
          const lyricsText = await getLyrics(current.artist, current.name);
          lyricsCache.current.set(key, lyricsText);
          setLyrics(lyricsText);
        }
      }
    } catch (e) {
      console.error("❌ Error saat refresh:", e);
    } finally {
      setIsLoading(false);
    }
  }

  // 🕒 auto refresh tiap 15 detik
  useEffect(() => {
    let isActive = true;

    const loop = async () => {
      await refreshTrack();
      if (isActive) setTimeout(loop, 15000);
    };
    loop();

    return () => {
      isActive = false;
    };
  }, []);

  // 🎵 auto-scroll lirik

  return (
    <div className="bg-black/70 text-white rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden select-none border border-white/10 w-[500px]">
      {/* Draggable region */}
      <div
        data-tauri-drag-region
        className="cursor-move bg-gray-800/50 px-3 py-1 text-sm font-medium flex justify-between items-center"
      >
        <span>🎵 Spotify Lyrics Overlay</span>
        <button
          onClick={() => refreshTrack(true)}
          className="px-2 py-0.5 rounded-md text-xs bg-white/10 hover:bg-white/20 transition-all"
        >
          {isLoading ? "..." : "⟳"}
        </button>
      </div>

      <div className="p-3 max-h-[400px] overflow-hidden">
        {track ? (
          <>
            <div className="mb-2">
              <div className="font-bold text-lg leading-tight truncate">
                {track.name}
              </div>
              <div className="text-sm opacity-80 truncate">{track.artist}</div>
            </div>

            <div className="border-t border-white/10 my-2"></div>

            <pre
              ref={lyricsRef}
              className="whitespace-pre-wrap text-sm font-light leading-snug opacity-90 overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
            >
              {lyrics || "Memuat lirik... 🎶"}
            </pre>
          </>
        ) : (
          <div className="text-sm opacity-70">
            🎧 Tidak ada lagu yang diputar...
          </div>
        )}
      </div>
    </div>
  );
}
