import { RefObject } from "react";
import { SyncedLyric } from "../../services/lyrics";

interface LyricsDisplayProps {
  lyrics: SyncedLyric[];
  activeLine: number;
  isLoading: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  setLineRef: (index: number) => (el: HTMLDivElement | null) => void;
}

export function LyricsDisplay({
  lyrics,
  activeLine,
  isLoading,
  containerRef,
  setLineRef,
}: LyricsDisplayProps) {
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center pointer-events-none">
        <div className="text-white/30 text-xs animate-pulse">
          Loading lyrics...
        </div>
      </div>
    );
  }

  if (!lyrics.length) {
    return (
      <div className="h-full flex items-center justify-center pointer-events-none">
        <div className="text-white/20 text-xs">
          No lyrics available
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-6 py-4 flex flex-col items-center gap-2 scrollbar-none"
      style={{
        WebkitAppRegion: "no-drag",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      } as React.CSSProperties}
    >
      {lyrics.map((line, i) => (
        <div
          key={i}
          ref={setLineRef(i)}
          className={`transition-all duration-500 ease-out text-center cursor-default py-1 w-full ${
            i === activeLine
              ? "text-white text-lg font-semibold scale-105 drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]"
              : i < activeLine
              ? "text-white/15 text-sm"
              : "text-white/35 text-sm"
          }`}
        >
          {line.text}
        </div>
      ))}
    </div>
  );
}
