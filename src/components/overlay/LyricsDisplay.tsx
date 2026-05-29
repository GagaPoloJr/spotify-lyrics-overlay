import { RefObject } from "react";
import { SyncedLyric } from "../../services/lyrics";
import { Theme } from "../../config/themes";

interface LyricsDisplayProps {
  lyrics: SyncedLyric[];
  activeLine: number;
  isLoading: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  setLineRef: (index: number) => (el: HTMLDivElement | null) => void;
  theme?: Theme;
}

export function LyricsDisplay({
  lyrics,
  activeLine,
  isLoading,
  containerRef,
  setLineRef,
  theme,
}: LyricsDisplayProps) {
  const activeColor = theme?.activeLineColor || "#ffffff";
  const activeGlow = theme?.activeLineGlow || "rgba(255, 255, 255, 0.2)";

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center pointer-events-none">
        <div className="text-slate-500 text-xs animate-pulse">
          Loading lyrics...
        </div>
      </div>
    );
  }

  if (!lyrics.length) {
    return (
      <div className="h-full flex items-center justify-center pointer-events-none">
        <div className="text-slate-600 text-xs">No lyrics available</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-6 py-4 flex flex-col items-center gap-2"
      style={{
        WebkitAppRegion: "no-drag",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      } as React.CSSProperties}
    >
      {lyrics.map((line, i) => {
        const isActive = i === activeLine;
        const isPast = i < activeLine;

        return (
          <div
            key={i}
            ref={setLineRef(i)}
            className={`text-center cursor-default py-1 w-full transition-all duration-500 ease-out ${
              isActive ? "text-lg font-semibold" : "text-sm"
            }`}
            style={{
              color: isActive
                ? activeColor
                : isPast
                ? "rgb(71, 85, 105)" // slate-500 (past - dimmed)
                : "rgb(148, 163, 184)", // slate-400 (future - visible)
              textShadow: isActive ? `0 0 12px ${activeGlow}` : "none",
              opacity: isActive ? 1 : isPast ? 0.5 : 0.7,
              transform: isActive ? "scale(1.05)" : "scale(1)",
            }}
          >
            {line.text}
          </div>
        );
      })}
    </div>
  );
}
