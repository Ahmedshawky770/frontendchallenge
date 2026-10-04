"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { formatDuration } from "@/domain/format";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { VideoControls } from "./videoControls";
import { useImmersiveMode } from "./useImmersiveMode";
import type { VideoTransport } from "./useVideoTransport";

export interface VideoStageProps {
  transport: VideoTransport;
  /** Text-free backdrop art — not the catalogue thumbnail, which carries the course title. */
  stageUrl: string;
  stageBlurDataUrl: string;
  /** Describes the artwork for assistive tech; the visible stage already names the lesson. */
  stageAlt: string;
  lessonTitle: string;
  lessonNumber: number;
  immersive: boolean;
  onImmersiveChange: (immersive: boolean) => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  className?: string;
}

/**
 * The video stage.
 *
 * Layout contract — the two behaviours the brief calls out:
 *
 *  - **Mobile**: `sticky top-0` below the app bar, full-bleed width, above the
 *    scrolling content. Implemented in CSS so it survives hydration without a
 *    width check.
 *  - **Desktop**: inline in the grid; the sidebar collapse simply gives the
 *    column more room, and the stage keeps its 16:9 box because the aspect ratio
 *    is reserved rather than derived from content.
 *
 * The control bar auto-hides after 2.5 s of pointer inactivity while playing,
 * and never auto-hides when the user prefers reduced motion.
 */
export function VideoStage({
  transport,
  stageUrl,
  stageBlurDataUrl,
  stageAlt,
  lessonTitle,
  lessonNumber,
  immersive,
  onImmersiveChange,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  className = "",
}: VideoStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);

  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const immersiveApi = useImmersiveMode(stageRef);
  const isPlaying = transport.status === "playing";

  const revealControls = useCallback(() => {
    setControlsVisible(true);

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!isPlaying || prefersReducedMotion || immersive) return;

    idleTimerRef.current = setTimeout(() => setControlsVisible(false), 2500);
  }, [isPlaying, prefersReducedMotion, immersive]);

  // The control bar re-arms from pointer activity only. It deliberately does not
  // also re-arm on `transport.currentTime`: that value ticks four times a second
  // while playing, so watching it would reset the idle timer forever and the
  // controls would never hide. Scrubbing raises pointer events that bubble to
  // this element, so a seek reveals the controls for free.
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // Leaving fullscreen by any route (Esc, system gesture) must leave the layout.
  useEffect(() => {
    if (immersive && !immersiveApi.isFullscreen() && !window.matchMedia("(orientation: landscape) and (max-height: 560px)").matches) {
      onImmersiveChange(false);
    }
  }, [immersive, immersiveApi, onImmersiveChange]);

  async function handleEnterImmersive() {
    await immersiveApi.enter();
    onImmersiveChange(true);
  }

  async function handleExitImmersive() {
    await immersiveApi.exit();
    onImmersiveChange(false);
  }

  const showControls = controlsVisible || !isPlaying;

  return (
    <div
      ref={stageRef}
      onPointerMove={revealControls}
      onPointerDown={revealControls}
      className={[
        // No `w-full` here: the parent is a flex column, so `align-items: stretch`
        // already gives the stage the container width, and the negative margin
        // passed by the caller then widens it edge to edge. An explicit `w-full`
        // would pin the used width and the stage would overhang only on the left.
        "group relative isolate overflow-hidden bg-ink-950",
        // Desktop / tablet: inline block in the grid column.
        "md:rounded-card md:border md:border-ink-600",
        // Mobile: pinned under the app bar, edge to edge.
        "sticky top-0 z-30",
        immersive ? "fixed inset-0 z-[60] rounded-none border-0" : "",
        className,
      ].join(" ")}
    >
      <div className="relative aspect-video w-full">
        <Image
          src={stageUrl}
          alt={stageAlt}
          fill
          preload
          placeholder="blur"
          blurDataURL={stageBlurDataUrl}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 1100px"
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/10 to-ink-950/40" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-4">
          <span className="rounded-full bg-ink-950/60 px-2.5 py-1 text-micro font-medium text-white/90 backdrop-blur-sm">
            Lesson {lessonNumber}
          </span>
          {transport.status === "ended" ? (
            <span className="rounded-full bg-success-500/90 px-2.5 py-1 text-micro font-semibold text-white">
              Watched
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={transport.toggle}
          aria-label={isPlaying ? "Pause lesson" : "Play lesson"}
          className="absolute inset-0 flex items-center justify-center"
        >
          {!isPlaying ? (
            <span className="flex size-16 items-center justify-center rounded-full bg-white/95 text-ink-950 shadow-lg transition-transform duration-micro hover:scale-105 sm:size-20">
              <Icon name="play" size={30} className="translate-x-0.5" />
            </span>
          ) : null}
        </button>

        <p
          className={`absolute inset-x-0 bottom-0 px-4 pb-2 text-body-sm font-medium text-white/90 transition-opacity duration-micro ${
            showControls ? "opacity-0" : "opacity-100"
          }`}
        >
          {lessonTitle}
        </p>
      </div>

      <VideoControls
        transport={transport}
        lessonTitle={lessonTitle}
        immersive={immersive}
        onEnterImmersive={handleEnterImmersive}
        onExitImmersive={handleExitImmersive}
        onNext={onNext}
        onPrevious={onPrevious}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        className={`absolute inset-x-0 bottom-0 transition-opacity duration-micro ${
          showControls ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
    </div>
  );
}

/** Small helper reused by the lesson header so the timecode format stays identical. */
export function formatTimecode(seconds: number): string {
  return formatDuration(seconds);
}