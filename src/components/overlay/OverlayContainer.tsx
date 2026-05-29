import { ReactNode } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { AlbumArtBackground } from "./AlbumArtBackground";
import { Theme } from "../../config/themes";

interface OverlayContainerProps {
  children: ReactNode;
  isLoggedIn?: boolean;
  header?: ReactNode;
  albumArt?: string | null;
  theme?: Theme;
  rightButtons?: ReactNode;
}

export function OverlayContainer({
  children,
  isLoggedIn,
  header,
  albumArt,
  theme,
  rightButtons,
}: OverlayContainerProps) {
  const appWindow = getCurrentWindow();
  const bgColor = theme?.backgroundColor || "#0a0a0a";

  return (
    <div
      className="w-full h-full select-none flex flex-col overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* Album Art Background */}
      {albumArt && <AlbumArtBackground imageUrl={albumArt} opacity={0.25} />}

      {/* App Bar */}
      <div
        data-tauri-drag-region
        className="flex items-center justify-between h-10 px-4 backdrop-blur-xl border-b border-white/5 cursor-move shrink-0 z-30"
        style={{ backgroundColor: `${bgColor}cc` }}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: theme?.accentColor || "#22c55e" }}
          />
          <span className="text-white/60 text-[11px] font-medium">
            Spotify Lyrics
          </span>
        </div>

        {isLoggedIn && (
          <div className="flex items-center gap-1">
            {rightButtons}
            <button
              onClick={() => appWindow.close()}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/80 text-white/30 hover:text-white transition-all group"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <line x1="1" y1="1" x2="7" y2="7" />
                <line x1="7" y1="1" x2="1" y2="7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative min-h-0 z-10">
        {header && (
          <div className="shrink-0 relative z-20">
            <div className="relative z-10">{header}</div>
            <div
              className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
              style={{
                background: `linear-gradient(to bottom, transparent, ${bgColor})`,
              }}
            />
          </div>
        )}

        <div className="flex-1 overflow-hidden relative min-h-0">
          {children}

          {/* Top fade */}
          <div
            className="absolute top-0 left-0 right-0 h-8 pointer-events-none z-10"
            style={{
              background: `linear-gradient(to bottom, ${bgColor}, transparent)`,
            }}
          />

          {/* Bottom fade */}
          <div
            className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none z-10"
            style={{
              background: `linear-gradient(to top, ${bgColor}, ${bgColor}cc 50%, transparent)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
