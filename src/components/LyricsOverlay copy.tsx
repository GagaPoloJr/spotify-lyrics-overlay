import { useEffect, useRef, useState } from "react";
import { getCurrentTrack } from "../api/spotify";
import { getLyrics } from "../api/lyrics";

type Track = {
  name: string;
  artist: string;
  album: string;
};

export default function LyricsOverlay() {
  const [track, setTrack] = useState<Track | null>(null);
  const [lyrics, setLyrics] = useState<string>("");
  const [_, setScrollIndex] = useState(0);
  const lyricsRef = useRef<HTMLPreElement>(null);

  // localStorage.setItem(
  //   "spotify_token",
  //   "BQAbvGHvGUJ69xq2OTgeRvYlgMULSl9XycDG78_cvA5HuqgGAnBl_mHXqtGdlI9EX2N3ETUNovPrUGPovZdcpVKBN6KOYOnN6PvsRXFUG5JMJCT6BQjpr7eV3m9Wtt1mPgrEGyVb4hlGOGNecFCHG9MIr22rEZLKeIgJcV4VmZ-hJPui9mm1DdT9q9LUoMnM2LCXb_bfXHoiz6h9CN4qdoYzxO4s3BN-DAHjJbutOSOCZ-1WW3vYEjruUzA"
  // );
  const lyricsCache = new Map<string, string>();
  async function refreshTrack() {
    const token = localStorage.getItem("spotify_token");
    if (!token) return;

    const current = await getCurrentTrack(token);
    if (current && (!track || current.name !== track.name)) {
      setTrack(current);

      const key = `${current.artist}-${current.name}`;
      if (lyricsCache.has(key)) {
        setLyrics(lyricsCache.get(key)!);
      } else {
        const lyricsText = await getLyrics(current.artist, current.name);
        lyricsCache.set(key, lyricsText);
        setLyrics(lyricsText);
      }

      setScrollIndex(0);
    }
  }

  useEffect(() => {
    let intervalMs = 15000; // default 15 detik
    const smartRefresh = async () => {
      const start = Date.now();
      await refreshTrack();
      const elapsed = Date.now() - start;

      // kalau lagu baru atau ada error, perpendek polling sementara
      intervalMs = track ? 15000 : 5000;

      setTimeout(smartRefresh, intervalMs - elapsed);
    };

    smartRefresh();

    return () => {}; // no clearInterval karena pakai recursive timeout
  }, []);

  // Auto-scroll every 1.5s (per baris)
  useEffect(() => {
    if (!lyricsRef.current) return;

    const lines = lyrics.split("\n");
    if (lines.length === 0) return;

    const scrollTimer = setInterval(() => {
      setScrollIndex((prev) => {
        const next = prev + 1;
        const element = lyricsRef.current;
        if (element) {
          const scrollPerLine = element.scrollHeight / lines.length;
          element.scrollTo({
            top: scrollPerLine * next,
            behavior: "smooth",
          });
        }
        return next >= lines.length ? 0 : next;
      });
    }, 1500);

    return () => clearInterval(scrollTimer);
  }, [lyrics]);

  return (
    <div className="bg-black/70 text-white rounded-xl shadow-lg backdrop-blur-md overflow-hidden select-none">
      {/* 👇 area draggable */}
      <div
        data-tauri-drag-region
        className="cursor-move bg-gray-800/40 px-3 py-1 text-sm font-medium"
      >
        🎵 Spotify Lyrics Overlay
      </div>
      {track ? (
        <>
          <div className="mb-2">
            <div className="font-bold text-lg leading-tight">{track.name}</div>
            <div className="text-sm opacity-80">{track.artist}</div>
          </div>

          <div className="border-t border-white/20 my-2"></div>

          <pre
            ref={lyricsRef}
            className="whitespace-pre-wrap text-sm font-light leading-snug opacity-90 overflow-y-auto transition-all duration-700"
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
  );
}
