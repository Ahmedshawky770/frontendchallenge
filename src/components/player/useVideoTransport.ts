"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type PlaybackStatus = "idle" | "playing" | "paused" | "ended";

export interface VideoTransport {
  status: PlaybackStatus;
  currentTime: number;
  duration: number;
  /** 0–1 */
  fraction: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  skip: (deltaSeconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  cyclePlaybackRate: () => void;
}

const TICK_MS = 250;
export const playbackRates = [1, 1.25, 1.5, 2] as const;

/**
 * Playback clock for the course player.
 *
 * The challenge ships no media assets and no encoder, so there is no file for an
 * `<HTMLVideoElement>` to load. Rather than ship a dead `<video>` tag, the
 * transport owns the same state a real element would — status, current time,
 * duration, volume, rate, seek — and a timer advances it. The player UI, the
 * control bar and the lesson completion flow are therefore exercised for real.
 *
 * Swapping in a real stream means replacing the body of this hook with
 * `videoRef.current.play()/pause()` listeners; every caller already speaks in
 * terms of `status`, `currentTime` and `seek()`, so nothing above it changes.
 */
export function useVideoTransport({
  lessonId,
  durationSeconds,
}: {
  lessonId: string | null;
  durationSeconds: number;
}): VideoTransport {
  const [status, setStatus] = useState<PlaybackStatus>("paused");
  const [currentTime, setCurrentTime] = useState(0);
  const [volumeState, setVolumeState] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [rateIndex, setRateIndex] = useState(0);

  const duration = Math.max(durationSeconds, 0);
  const rate = playbackRates[rateIndex];
  const lastTickRef = useRef<number>(0);

  // A new lesson always starts paused at zero — resuming mid-lesson because the
  // previous one ended is the wrong default for a course player.
  //
  // This is state adjustment during render rather than an effect. The reset has
  // to be visible in *this* pass: an effect would let the control bar paint one
  // frame with the previous lesson's time and playing status. React re-runs the
  // component immediately and discards the intermediate tree, so nothing is
  // committed to the DOM in between.
  //
  // Keyed on `lessonId` alone: duration is derived from the lesson, so a
  // duration-only change no longer clobbers playback.
  const [trackedLessonId, setTrackedLessonId] = useState(lessonId);
  if (trackedLessonId !== lessonId) {
    setTrackedLessonId(lessonId);
    setStatus("paused");
    setCurrentTime(0);
  }

  useEffect(() => {
    if (status !== "playing") return;

    lastTickRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = ((now - lastTickRef.current) / 1000) * rate;
      lastTickRef.current = now;

      setCurrentTime((previous) => {
        const next = previous + elapsed;
        if (next >= duration) {
          setStatus("ended");
          return duration;
        }
        return next;
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [status, rate, duration]);

  const seek = useCallback(
    (seconds: number) => {
      setCurrentTime(Math.min(Math.max(seconds, 0), duration));
      setStatus((previous) => (previous === "ended" ? "paused" : previous));
    },
    [duration],
  );

  const play = useCallback(() => {
    // Replaying from the end restarts, matching every native player.
    setCurrentTime((previous) => (previous >= duration ? 0 : previous));
    setStatus("playing");
  }, [duration]);

  const pause = useCallback(() => setStatus("paused"), []);

  const toggle = useCallback(() => {
    setStatus((previous) => (previous === "playing" ? "paused" : "playing"));
  }, []);

  const skip = useCallback((deltaSeconds: number) => seek(currentTime + deltaSeconds), [seek, currentTime]);

  const toggleMute = useCallback(() => setMuted((previous) => !previous), []);

  const cyclePlaybackRate = useCallback(() => {
    setRateIndex((previous) => (previous + 1) % playbackRates.length);
  }, []);

  return useMemo(
    () => ({
      status,
      currentTime,
      duration,
      fraction: duration > 0 ? Math.min(currentTime / duration, 1) : 0,
      volume: volumeState,
      muted,
      playbackRate: rate,
      play,
      pause,
      toggle,
      seek,
      skip,
      setVolume: setVolumeState,
      toggleMute,
      cyclePlaybackRate,
    }),
    [
      status,
      currentTime,
      duration,
      volumeState,
      muted,
      rate,
      play,
      pause,
      toggle,
      seek,
      skip,
      toggleMute,
      cyclePlaybackRate,
    ],
  );
}