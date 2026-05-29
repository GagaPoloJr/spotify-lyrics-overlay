import { SpotifyTrack } from "../../api/spotify";
import { ProgressBar } from "./ProgressBar";

interface TrackInfoProps {
  track: SpotifyTrack;
  lyricsSource?: string;
  currentProgressMs?: number;
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export function TrackInfo({ track, lyricsSource, currentProgressMs, onPlayPause, onNext, onPrev }: TrackInfoProps) {
  return (
    <div className="pt-3 pb-2 px-4">
      <div className="flex items-center gap-3">
        {/* Album Art */}
        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white/5 shadow-lg">
          {track.album_art ? (
            <img
              src={track.album_art}
              alt="Album"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0 text-left">
          <div className="text-base font-semibold text-white/95 truncate drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
            {track.name}
          </div>
          <div className="text-xs text-slate-400 truncate mt-0.5">
            {track.artist}
          </div>
          {lyricsSource && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${
                lyricsSource === "spotify" ? "bg-green-500" : "bg-blue-400"
              }`} />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                {lyricsSource === "spotify" ? "Spotify" : "LRCLIB"}
              </span>
            </div>
          )}
        </div>

        {/* Playback Controls */}
        {onPlayPause && onNext && onPrev && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M9 1L3 6L9 11V1Z" />
                <rect x="1" y="1" width="1.5" height="10" rx="0.5" />
              </svg>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); onPlayPause(); }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              {track.is_playing ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <rect x="2" y="1" width="3" height="10" rx="0.5" />
                  <rect x="7" y="1" width="3" height="10" rx="0.5" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 1L10 6L3 11V1Z" />
                </svg>
              )}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M3 1L9 6L3 11V1Z" />
                <rect x="9" y="1" width="1.5" height="10" rx="0.5" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {currentProgressMs !== undefined && (
        <div className="mt-2 -mx-1">
          <ProgressBar
            progressMs={currentProgressMs}
            durationMs={track.duration_ms}
            isPlaying={track.is_playing}
          />
        </div>
      )}
    </div>
  );
}
