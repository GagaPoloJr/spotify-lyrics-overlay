import { useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useSpotifyPolling } from "../hooks/useSpotifyPolling";
import { useLyricsSync } from "../hooks/useLyricsSync";
import { useTheme } from "../hooks/useTheme";
import { LoginScreen } from "./overlay/LoginScreen";
import { OverlayContainer } from "./overlay/OverlayContainer";
import { TrackInfo } from "./overlay/TrackInfo";
import { LyricsDisplay } from "./overlay/LyricsDisplay";
import { SyncToggle } from "./overlay/SyncToggle";
import { ViewModeToggle, ViewMode } from "./overlay/ViewModeToggle";
import { ThemeSwitcher } from "./overlay/ThemeSwitcher";
import { MiniOverlay } from "./overlay/MiniOverlay";
import { ProgressBar } from "./overlay/ProgressBar";
import { playPause, nextTrack, prevTrack } from "../api/spotify";
import { handleError } from "../utils/errors";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";

export default function LyricsSync() {
  const { isLoggedIn, login, logout, submitManualCode } = useAuth();
  const { track, lyrics, lyricsSource, isLoading, isPaused, currentProgressMs } =
    useSpotifyPolling(isLoggedIn);
  const {
    activeLine,
    isSyncEnabled,
    toggleSync,
    lyricsContainerRef,
    setLineRef,
    currentLyric,
  } = useLyricsSync(track, lyrics, isPaused);
  const { currentTheme, themeName, setTheme } = useTheme();

  const [viewMode, setViewMode] = useState<ViewMode>("full");

  // Toggle view mode and resize window
  const toggleViewMode = useCallback(async () => {
    const newMode = viewMode === "full" ? "mini" : "full";
    setViewMode(newMode);

    const window = getCurrentWindow();
    if (newMode === "mini") {
      await window.setSize(new LogicalSize(480, 120));
    } else {
      await window.setSize(new LogicalSize(480, 350));
    }
  }, [viewMode]);

  // Playback controls with error handling
  const handlePlayPause = useCallback(async () => {
    try {
      await playPause();
    } catch (error) {
      handleError(error, "Play/Pause");
    }
  }, []);

  const handleNext = useCallback(async () => {
    try {
      await nextTrack();
    } catch (error) {
      handleError(error, "Next Track");
    }
  }, []);

  const handlePrev = useCallback(async () => {
    try {
      await prevTrack();
    } catch (error) {
      handleError(error, "Previous Track");
    }
  }, []);

  // Not logged in
  if (!isLoggedIn) {
    return <LoginScreen onLogin={login} onManualCode={submitManualCode} />;
  }

  // Mini mode
  if (viewMode === "mini" && track) {
    return (
      <div
        className="w-full h-full select-none flex flex-col overflow-hidden relative"
        style={{ backgroundColor: currentTheme.backgroundColor }}
      >
        {/* App Bar */}
        <div
          data-tauri-drag-region
          className="flex items-center justify-between h-9 px-3 backdrop-blur-xl border-b border-white/5 cursor-move shrink-0 z-30"
          style={{ backgroundColor: `${currentTheme.backgroundColor}cc` }}
        >
          <div className="flex items-center gap-2 pointer-events-none">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentTheme.accentColor }}
            />
            <span className="text-white/60 text-[11px] font-medium">
              Spotify Lyrics
            </span>
          </div>

          <div className="flex items-center gap-1">
            <ThemeSwitcher currentTheme={themeName} onThemeChange={setTheme} />
            <button
              onClick={logout}
              className="w-5 h-5 flex items-center justify-center rounded bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
              title="Logout"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
            <ViewModeToggle mode={viewMode} onToggle={toggleViewMode} />
            <button
              onClick={() => getCurrentWindow().close()}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/80 text-white/30 hover:text-white transition-all"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="1" y1="1" x2="7" y2="7" />
                <line x1="7" y1="1" x2="1" y2="7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mini Content */}
        <div className="flex-1 relative z-10 flex flex-col" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <MiniOverlay
            track={track}
            currentLyric={currentLyric || ""}
            isPlaying={track.is_playing}
            onPlayPause={handlePlayPause}
            onNext={handleNext}
            onPrev={handlePrev}
          />

          {/* Progress Bar */}
          <ProgressBar
            progressMs={currentProgressMs}
            durationMs={track.duration_ms}
            isPlaying={track.is_playing}
          />
        </div>
      </div>
    );
  }

  // Full mode
  return (
      <OverlayContainer
        isLoggedIn={isLoggedIn}
        header={track ? <TrackInfo track={track} lyricsSource={lyricsSource} currentProgressMs={currentProgressMs} onPlayPause={handlePlayPause} onNext={handleNext} onPrev={handlePrev} /> : null}
        albumArt={track?.album_art}
        theme={currentTheme}
        rightButtons={
          <>
            <ViewModeToggle mode={viewMode} onToggle={toggleViewMode} />
            <ThemeSwitcher currentTheme={themeName} onThemeChange={setTheme} />
            <button
              onClick={logout}
              className="w-5 h-5 flex items-center justify-center rounded bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
              title="Logout"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </>
        }
      >

      {!track ? (
        <div className="h-full flex items-center justify-center pointer-events-none">
          <div className="text-white/20 text-sm">No music playing</div>
        </div>
      ) : (
        <>
          {/* Lyrics - This is the scrollable container */}
          <LyricsDisplay
            lyrics={lyrics}
            activeLine={activeLine}
            isLoading={isLoading}
            containerRef={lyricsContainerRef}
            setLineRef={setLineRef}
            theme={currentTheme}
          />

          {/* Sync Toggle */}
          <SyncToggle isEnabled={isSyncEnabled} onToggle={toggleSync} />
        </>
      )}
    </OverlayContainer>
  );
}
