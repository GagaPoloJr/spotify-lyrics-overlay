import { useAuth } from "../hooks/useAuth";
import { useSpotifyPolling } from "../hooks/useSpotifyPolling";
import { useLyricsSync } from "../hooks/useLyricsSync";
import { LoginScreen } from "./overlay/LoginScreen";
import { OverlayContainer } from "./overlay/OverlayContainer";
import { TrackInfo } from "./overlay/TrackInfo";
import { LyricsDisplay } from "./overlay/LyricsDisplay";
import { SyncToggle } from "./overlay/SyncToggle";

export default function LyricsSync() {
  const { isLoggedIn, login, submitManualCode } = useAuth();
  const { track, lyrics, lyricsSource, isLoading, isPaused } =
    useSpotifyPolling(isLoggedIn);
  const {
    activeLine,
    isSyncEnabled,
    toggleSync,
    lyricsContainerRef,
    setLineRef,
  } = useLyricsSync(track, lyrics, isPaused);

  // Not logged in - show login screen
  if (!isLoggedIn) {
    return <LoginScreen onLogin={login} onManualCode={submitManualCode} />;
  }

  // Logged in - show overlay
  return (
    <OverlayContainer
      isLoggedIn={isLoggedIn}
      header={track ? <TrackInfo track={track} lyricsSource={lyricsSource} /> : null}
    >
      {!track ? (
        <div className="h-full flex items-center justify-center pointer-events-none">
          <div className="text-white/20 text-sm">
            No music playing
          </div>
        </div>
      ) : (
        <>
          <LyricsDisplay
            lyrics={lyrics}
            activeLine={activeLine}
            isLoading={isLoading}
            containerRef={lyricsContainerRef}
            setLineRef={setLineRef}
          />

          {/* Sync Toggle Button */}
          <SyncToggle isEnabled={isSyncEnabled} onToggle={toggleSync} />
        </>
      )}
    </OverlayContainer>
  );
}
