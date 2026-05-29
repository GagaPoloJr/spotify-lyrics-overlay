export type ViewMode = "full" | "mini";

interface ViewModeToggleProps {
  mode: ViewMode;
  onToggle: () => void;
}

export function ViewModeToggle({ mode, onToggle }: ViewModeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="w-5 h-5 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-all"
      title={mode === "full" ? "Switch to Mini" : "Switch to Full"}
    >
      {mode === "full" ? (
        // Mini icon (smaller square)
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="1" width="8" height="8" rx="1" />
        </svg>
      ) : (
        // Full icon (larger square)
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="0.5" y="0.5" width="11" height="11" rx="1" />
        </svg>
      )}
    </button>
  );
}
