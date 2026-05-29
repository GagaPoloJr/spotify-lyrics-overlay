import { useState, useEffect, useRef, useCallback } from "react";
import { getCurrentTrack, SpotifyTrack } from "../api/spotify";
import { fetchLyrics, SyncedLyric } from "../services/lyrics";

export function useSpotifyPolling(isLoggedIn: boolean) {
  const [track, setTrack] = useState<SpotifyTrack | null>(null);
  const [lyrics, setLyrics] = useState<SyncedLyric[]>([]);
  const [lyricsSource, setLyricsSource] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentProgressMs, setCurrentProgressMs] = useState(0);

  const lastTrackRef = useRef<string>("");
  const lastProgressRef = useRef<number>(0);
  const startTimestampRef = useRef<number>(0);
  const pauseDetectedRef = useRef<boolean>(false);
  const pollingActiveRef = useRef<boolean>(true);
  const trackRef = useRef<SpotifyTrack | null>(null);

  // Keep trackRef in sync
  useEffect(() => {
    trackRef.current = track;
  }, [track]);

  const fetchTrackAndLyrics = useCallback(async () => {
    if (!pollingActiveRef.current) return;

    const current = await getCurrentTrack();

    // No active playback
    if (!current) {
      if (trackRef.current !== null) {
        setTrack(null);
        setLyrics([]);
        setLyricsSource("");
        setCurrentProgressMs(0);
        lastTrackRef.current = "";
      }
      return;
    }

    const currentKey = `${current.artist}-${current.name}`;

    // Same track - handle seek/pause detection
    if (lastTrackRef.current === currentKey) {
      const progressDiff = Math.abs(
        current.progress_ms - lastProgressRef.current
      );

      // Detect seek (progress jumped more than 2 seconds)
      if (progressDiff > 2000) {
        console.log("[Playback] Seek detected, recalibrating");
        startTimestampRef.current = Date.now() - current.progress_ms;
        lastProgressRef.current = current.progress_ms;
        pauseDetectedRef.current = false;
        setIsPaused(false);
      }

      // Detect pause (no progress change)
      if (progressDiff < 100 && !pauseDetectedRef.current) {
        pauseDetectedRef.current = true;
        setIsPaused(true);
        // Set progress to last known position
        const elapsed = Date.now() - startTimestampRef.current;
        setCurrentProgressMs(Math.min(elapsed, current.duration_ms));
        console.log("[Playback] Pause detected");
      } else if (progressDiff > 100) {
        pauseDetectedRef.current = false;
        setIsPaused(false);
        // Recalibrate start time
        startTimestampRef.current = Date.now() - current.progress_ms;
      }

      setTrack(current);
      return;
    }

    // Track changed
    console.log(`[Track] Changed to: ${current.artist} - ${current.name}`);
    setTrack(current);
    setCurrentProgressMs(current.progress_ms);
    lastTrackRef.current = currentKey;
    lastProgressRef.current = current.progress_ms;
    startTimestampRef.current = Date.now() - current.progress_ms;
    pauseDetectedRef.current = false;
    setIsPaused(false);

    // Fetch lyrics
    setIsLoading(true);
    try {
      const result = await fetchLyrics(
        current.id,
        current.artist,
        current.name
      );

      if (result) {
        setLyrics(result.lyrics);
        setLyricsSource(result.source);
        console.log(
          `[Lyrics] Loaded ${result.lyrics.length} lines from ${result.source}`
        );
      } else {
        setLyrics([]);
        setLyricsSource("");
        console.warn("[Lyrics] No lyrics available");
      }
    } catch (e) {
      console.error("[Lyrics] Failed to fetch lyrics:", e);
      setLyrics([]);
      setLyricsSource("");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Real-time progress update (every 200ms)
  useEffect(() => {
    if (!track) return;

    // Don't update progress when paused
    if (isPaused) return;

    const interval = setInterval(() => {
      if (pauseDetectedRef.current) return; // Extra safety check
      
      const elapsed = Date.now() - startTimestampRef.current;
      const progress = Math.min(elapsed, track.duration_ms);
      setCurrentProgressMs(progress);
    }, 200);

    return () => clearInterval(interval);
  }, [track, isPaused]);

  // Start polling
  useEffect(() => {
    if (!isLoggedIn) {
      setTrack(null);
      setLyrics([]);
      setLyricsSource("");
      setCurrentProgressMs(0);
      lastTrackRef.current = "";
      return;
    }

    pollingActiveRef.current = true;

    const loop = async () => {
      if (!pollingActiveRef.current) return;
      await fetchTrackAndLyrics();
      if (pollingActiveRef.current) {
        setTimeout(loop, 5000);
      }
    };

    loop();

    return () => {
      pollingActiveRef.current = false;
    };
  }, [isLoggedIn, fetchTrackAndLyrics]);

  return {
    track,
    lyrics,
    lyricsSource,
    isLoading,
    isPaused,
    currentProgressMs,
    startTimestamp: startTimestampRef.current,
  };
}
