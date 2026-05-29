import { ReactNode } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface OverlayContainerProps {
  children: ReactNode;
  isLoggedIn?: boolean;
  header?: ReactNode;
}

export function OverlayContainer({ children, isLoggedIn, header }: OverlayContainerProps) {
  const appWindow = getCurrentWindow();

  return (
    <div className="w-full h-full bg-[#0a0a0a] select-none flex flex-col overflow-hidden">
      {/* App Bar - Draggable & Always Visible */}
      <div
        data-tauri-drag-region
        className="flex items-center justify-between h-10 px-4 bg-[#111111] backdrop-blur-xl border-b border-white/5 cursor-move shrink-0 z-30"
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-white/60 text-[11px] font-medium">
            Spotify Lyrics
          </span>
        </div>

        {isLoggedIn && (
          <button
            onClick={() => appWindow.hide()}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/80 text-white/30 hover:text-white transition-all group"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <line x1="1" y1="1" x2="7" y2="7" />
              <line x1="7" y1="1" x2="1" y2="7" />
            </svg>
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative min-h-0">
        {/* Fixed Header (Track Info) with blur */}
        {header && (
          <div className="shrink-0 relative z-20">
            {/* Blur background behind header */}
            <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-md" />

            {/* Track info content */}
            <div className="relative z-10">
              {header}
            </div>

            {/* Gradient fade below header */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-b from-transparent via-[#0a0a0a]/60 to-[#0a0a0a] pointer-events-none" />
          </div>
        )}

        {/* Lyrics Area */}
        <div className="flex-1 overflow-hidden relative min-h-0">
          {children}

          {/* Top fade (for lyrics scrolling up) */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#0a0a0a] to-transparent pointer-events-none z-10" />

          {/* Bottom fade effect */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent pointer-events-none z-10" />
        </div>
      </div>
    </div>
  );
}
