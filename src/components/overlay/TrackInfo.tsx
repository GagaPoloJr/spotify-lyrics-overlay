import { SpotifyTrack } from "../../api/spotify";

interface TrackInfoProps {
  track: SpotifyTrack;
  lyricsSource?: string;
}

export function TrackInfo({ track, lyricsSource }: TrackInfoProps) {
  return (
    <div className="pt-3 pb-4 px-4 text-center pointer-events-none bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent">
      <div className="text-base font-semibold text-white/95 truncate drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
        {track.name}
      </div>
      <div className="text-xs text-white/50 truncate mt-0.5">
        {track.artist}
      </div>
      {lyricsSource && (
        <div className="flex items-center justify-center gap-1.5 mt-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${
            lyricsSource === "spotify" ? "bg-green-500" : "bg-blue-400"
          }`} />
          <span className="text-[10px] text-white/25 uppercase tracking-wider">
            {lyricsSource === "spotify" ? "Spotify" : "LRCLIB"}
          </span>
        </div>
      )}
    </div>
  );
}
