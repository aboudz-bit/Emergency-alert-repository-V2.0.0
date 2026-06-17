import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import type { IncidentEventDto } from "@workspace/keas-core";

// Faithful web port of the mobile hooks/useIncidentReplay.ts (same MIN/MAX step,
// scheduleNext timing, play/pause/reset/scrub/speed). Events are passed in
// (sourced from useIncidentEvents) instead of read from the mobile Zustand store.
export type ReplaySpeed = 1 | 2 | 4 | 8;

const MIN_STEP_MS = 200;
const MAX_STEP_MS = 3000;

export function useIncidentReplay(events: IncidentEventDto[]) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [speed, setSpeedState] = useState<ReplaySpeed>(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(currentIndex);
  const speedRef = useRef(speed);

  indexRef.current = currentIndex;
  speedRef.current = speed;

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.timestamp - b.timestamp),
    [events],
  );

  const totalEvents = sortedEvents.length;

  const visibleEvents = useMemo(
    () => (currentIndex >= 0 ? sortedEvents.slice(0, currentIndex + 1) : []),
    [sortedEvents, currentIndex],
  );

  const currentEvent =
    currentIndex >= 0 && currentIndex < totalEvents ? sortedEvents[currentIndex] : null;

  const progress = totalEvents > 0 ? Math.min(((currentIndex + 1) / totalEvents) * 100, 100) : 0;

  const duration =
    totalEvents > 0 ? sortedEvents[totalEvents - 1].timestamp - sortedEvents[0].timestamp : 0;

  const elapsed = currentEvent && totalEvents > 0 ? currentEvent.timestamp - sortedEvents[0].timestamp : 0;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleNext = useCallback(() => {
    const idx = indexRef.current;
    const spd = speedRef.current;
    const next = idx + 1;
    if (next >= sortedEvents.length) {
      setIsPlaying(false);
      return;
    }
    const delta = sortedEvents[next].timestamp - sortedEvents[idx].timestamp;
    const delayMs = Math.max(MIN_STEP_MS, Math.min(MAX_STEP_MS, delta / spd));

    timerRef.current = setTimeout(() => {
      setCurrentIndex(next);
      indexRef.current = next;
      scheduleNext();
    }, delayMs);
  }, [sortedEvents]);

  const play = useCallback(() => {
    if (totalEvents === 0) return;
    clearTimer();
    const startIdx = indexRef.current < 0 || indexRef.current >= totalEvents - 1 ? 0 : indexRef.current;
    setCurrentIndex(startIdx);
    indexRef.current = startIdx;
    setIsPlaying(true);
    scheduleNext();
  }, [totalEvents, clearTimer, scheduleNext]);

  const pause = useCallback(() => {
    clearTimer();
    setIsPlaying(false);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setIsPlaying(false);
    setCurrentIndex(-1);
    indexRef.current = -1;
  }, [clearTimer]);

  const scrubTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, totalEvents - 1));
      setCurrentIndex(clamped);
      indexRef.current = clamped;
      if (isPlaying) {
        clearTimer();
        scheduleNext();
      }
    },
    [totalEvents, isPlaying, clearTimer, scheduleNext],
  );

  const setSpeed = useCallback(
    (s: ReplaySpeed) => {
      setSpeedState(s);
      speedRef.current = s;
      if (isPlaying) {
        clearTimer();
        scheduleNext();
      }
    },
    [isPlaying, clearTimer, scheduleNext],
  );

  useEffect(() => clearTimer, [clearTimer]);

  return {
    isPlaying, currentIndex, speed, visibleEvents, totalEvents,
    progress, currentEvent, elapsed, duration,
    play, pause, reset, scrubTo, setSpeed,
  };
}
