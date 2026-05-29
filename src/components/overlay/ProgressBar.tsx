interface ProgressBarProps {
  progressMs: number;
  durationMs: number;
  isPlaying: boolean;
  compact?: boolean;
}

export function ProgressBar({ progressMs, durationMs, isPlaying, compact = false }: ProgressBarProps) {
  const progress = durationMs > 0 ? (progressMs / durationMs) * 100 : 0;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (compact) {
    // Compact mode - just the bar, no time labels
    return (
      <div className="px-3 py-1">
        <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500/50 rounded-full transition-all duration-200 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1.5">
      {/* Current time */}
      <span className="text-[10px] text-slate-500 font-mono w-8 text-right shrink-0">
        {formatTime(progressMs)}
      </span>

      {/* Progress bar */}
      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden relative group cursor-pointer">
        {/* Progress fill */}
        <div
          className="h-full rounded-full transition-all duration-200 ease-linear relative"
          style={{
            width: `${progress}%`,
            backgroundColor: isPlaying ? "#22c55e" : "rgba(255,255,255,0.15)",
          }}
        >
          {/* Dot at end */}
          <div
            className={`absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full transition-all duration-200 ${
              isPlaying
                ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                : "bg-slate-400"
            }`}
          />
        </div>
      </div>

      {/* Duration */}
      <span className="text-[10px] text-slate-500 font-mono w-8 shrink-0">
        {formatTime(durationMs)}
      </span>
    </div>
  );
}
