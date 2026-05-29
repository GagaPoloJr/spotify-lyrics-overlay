import { SpotifyTrack } from "../../api/spotify";

interface MiniOverlayProps {
  track: SpotifyTrack;
  currentLyric: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function MiniOverlay({
  track,
  currentLyric,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
}: MiniOverlayProps) {
  return (
    <div className="flex items-center gap-3 px-4 flex-1 min-h-0">
      {/* Album Art */}
      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5 shadow-md">
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        )}
      </div>

      {/* Current Lyric */}
      <div className="flex-1 min-w-0">
        <div className="text-white/90 text-sm font-medium truncate">
          {currentLyric || track.name || "..."}
        </div>
        <div className="text-slate-500 text-[10px] truncate">
          {track.artist}
        </div>
      </div>

      {/* Playback Controls */}
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
          {isPlaying ? (
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
    </div>
  );
}
