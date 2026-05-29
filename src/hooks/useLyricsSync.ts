import { useState, useEffect, useRef, useCallback } from "react";
import { SpotifyTrack } from "../api/spotify";
import { SyncedLyric } from "../services/lyrics";

export function useLyricsSync(
  track: SpotifyTrack | null,
  lyrics: SyncedLyric[],
  isPaused: boolean
) {
  const [activeLine, setActiveLine] = useState(-1);
  const [isSyncEnabled, setIsSyncEnabled] = useState(true);
  const [currentLyric, setCurrentLyric] = useState<string>("");
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const startTimestampRef = useRef<number>(0);
  const prevLyricsLengthRef = useRef<number>(0);

  const toggleSync = useCallback(() => {
    setIsSyncEnabled(prev => !prev);
  }, []);

  // Reset when track changes
  useEffect(() => {
    if (track) {
      startTimestampRef.current = Date.now() - track.progress_ms;
      setActiveLine(-1);
      setIsSyncEnabled(true);
      setCurrentLyric("");
    }
  }, [track?.id]);

  // Scroll to top when new lyrics are fetched
  useEffect(() => {
    const container = lyricsContainerRef.current;
    if (!container) return;

    if (lyrics.length > 0 && lyrics.length !== prevLyricsLengthRef.current) {
      prevLyricsLengthRef.current = lyrics.length;
      container.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [lyrics]);

  // Reset refs array when lyrics change
  useEffect(() => {
    lineRefs.current = lineRefs.current.slice(0, lyrics.length);
  }, [lyrics.length]);

  const scrollToLine = useCallback((index: number) => {
    if (!isSyncEnabled) return;

    const container = lyricsContainerRef.current;
    const el = lineRefs.current[index];

    if (!container || !el) return;

    const containerRect = container.getBoundingClientRect();
    const elementRect = el.getBoundingClientRect();

    const containerCenter = containerRect.height / 2;
    const elementTop = elementRect.top - containerRect.top + container.scrollTop;
    const targetScroll = elementTop - containerCenter + (elementRect.height / 2);

    container.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
  }, [isSyncEnabled]);

  // Sync active line with playback
  useEffect(() => {
    if (!track || !lyrics.length || isPaused || !isSyncEnabled) return;

    const interval = setInterval(() => {
      if (isPaused || !isSyncEnabled) return;

      const elapsed = Date.now() - startTimestampRef.current;
      const currentTime = Math.min(elapsed, track.duration_ms);

      const index = lyrics.findIndex(
        (line, i) =>
          currentTime >= line.time &&
          (i === lyrics.length - 1 || currentTime < lyrics[i + 1].time)
      );

      if (index !== -1 && index !== activeLine) {
        setActiveLine(index);
        setCurrentLyric(lyrics[index].text);
        scrollToLine(index);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [track, lyrics, activeLine, isPaused, isSyncEnabled, scrollToLine]);

  const setLineRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      if (el) {
        lineRefs.current[index] = el;
      } else {
        delete lineRefs.current[index];
      }
    },
    []
  );

  const scrollToTop = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = lyricsContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: 0, behavior });
  }, []);

  return {
    activeLine,
    isSyncEnabled,
    toggleSync,
    lyricsContainerRef,
    setLineRef,
    scrollToTop,
    currentLyric,
  };
}
