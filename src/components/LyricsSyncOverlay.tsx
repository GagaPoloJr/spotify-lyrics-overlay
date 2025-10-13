import { useEffect, useState, useRef } from "react";
import { getCurrentTrack, SpotifyTrack } from "../api/spotify";
import { getSpotifySyncedLyrics } from "../api/spotify-sync";
import { load } from "@tauri-apps/plugin-store";

export default function LyricsSync() {
  const [lyrics, setLyrics] = useState<{ time: number; text: string }[]>([]);
  const [track, setTrack] = useState<SpotifyTrack | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeLine, setActiveLine] = useState(0);
  const lastTrackRef = useRef<string>("");
  const lastProgressRef = useRef<number>(0);
  const startTimestampRef = useRef<number>(0);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<HTMLDivElement[] | any>([]);

  async function getSavedToken() {
    const store = await load("spotify_tokens.json");
    return (await store.get<string>("access_token")) ?? null;
  }

  async function fetchLyrics() {
    const token = await getSavedToken();
    if (!token) return;

    const current = await getCurrentTrack(token);
    if (!current) return;

    const currentKey = `${current.artist}-${current.name}`;
    if (
      lastTrackRef.current === currentKey &&
      Math.abs(current.progress_ms - lastProgressRef.current) > 2000
    ) {
      startTimestampRef.current = Date.now() - current.progress_ms;
      lastProgressRef.current = current.progress_ms;
      return;
    }

    setTrack(current);

    if (lastTrackRef.current === currentKey) return;

    lastTrackRef.current = currentKey;
    lastProgressRef.current = current.progress_ms;
    setIsLoading(true);

    try {
      const synced = await getSpotifySyncedLyrics(current.artist, current.name);
      setLyrics(synced);
      startTimestampRef.current = Date.now() - (current.progress_ms || 0);
    } catch (e) {
      console.error("❌ Gagal ambil lirik:", e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const loop = async () => {
      await fetchLyrics();
      if (active) setTimeout(loop, 5000);
    };
    loop();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!track || !lyrics.length) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimestampRef.current;
      const currentTime = Math.min(elapsed, track.duration_ms);

      const index = lyrics.findIndex(
        (line, i) =>
          currentTime >= line.time &&
          (i === lyrics.length - 1 || currentTime < lyrics[i + 1].time)
      );

      if (index !== -1 && index !== activeLine) {
        setActiveLine(index);

        const el = lineRefs.current[index];
        if (el && lyricsContainerRef.current) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }, 400);

    return () => clearInterval(interval);
  }, [track, lyrics]);

  return (
    <div
      className="relative w-[520px] h-[300px] border border-white/10 
                 bg-black/50 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden select-none"
    >
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

      {/* 🟢 area drag */}
      <div
        data-tauri-drag-region
        className="fixed top-0 left-0 right-0 h-20 cursor-move bg-transparent"
      />

      {/* ✨ header info */}
      {track && (
        <div className="pt-4 mb-4 text-center no-drag">
          <div className="text-lg font-semibold text-white truncate drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]">
            {track.name}
          </div>
          <div className="text-sm text-gray-300/70 truncate">
            {track.artist}
          </div>
        </div>
      )}

      {/* 🎶 lyrics */}
      {isLoading ? (
        <div className="text-gray-400 text-sm animate-pulse text-center no-drag">
          Memuat lirik sinkronisasi...
        </div>
      ) : lyrics.length ? (
        <div
          ref={lyricsContainerRef}
          className="no-drag relative overflow-y-auto max-h-[200px] px-3 
                     flex flex-col items-center space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        >
          {lyrics.map((l, i) => (
            <div
              key={i}
              ref={(el) => {
                if (el) {
                  lineRefs.current[i] = el;
                } else {
                  // remove the reference when the element is unmounted
                  delete lineRefs.current[i];
                }
              }}
              className={`transition-all duration-500 ease-out text-center ${
                i === activeLine
                  ? "text-lime-400  font-semibold scale-110 drop-shadow-[0_0_12px_rgba(29,185,84,0.7)]"
                  : "text-gray-300/60 text-sm"
              }`}
            >
              {l.text}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-400 text-sm text-center no-drag">
          🎧 Tidak ada lagu yang diputar...
        </div>
      )}

      {/* 🪞 subtle reflection */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
    </div>
  );
}
