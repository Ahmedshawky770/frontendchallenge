"use client";

import { Icon } from "@/components/ui/icon";
import { Tooltip } from "@/components/ui/tooltip";
import { formatDuration } from "@/domain/format";

import type { VideoTransport } from "./useVideoTransport";

export interface VideoControlsProps {
  transport: VideoTransport;
  lessonTitle: string;
  onEnterImmersive: () => void;
  onExitImmersive: () => void;
  immersive: boolean;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  className?: string;
}

/**
 * Custom control bar.
 *
 * The native `<video controls>` element cannot be restyled, and every design in
 * this project is token-driven, so the bar is built from the same primitives as
 * the rest of the UI. Consequences that are handled here:
 *
 *  - the seek bar is a real `<input type="range">` so it is keyboard operable
 *    (arrow keys, Home/End, Page Up/Down) for free;
 *  - every control is a real `<button>` with an accessible name;
 *  - the icon-only controls carry a Tooltip for pointer users, but the
 *    accessible name does not depend on it.
 */
export function VideoControls({
  transport,
  lessonTitle,
  onEnterImmersive,
  onExitImmersive,
  immersive,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  className = "",
}: VideoControlsProps) {
  const { status, currentTime, duration, fraction, volume, muted, playbackRate } = transport;
  const isPlaying = status === "playing";

  return (
    <div
      className={`flex flex-col gap-1.5 bg-gradient-to-t from-ink-950/90 via-ink-950/70 to-transparent px-3 pb-3 pt-8 sm:px-4 ${className}`}
    >
      <label className="group flex items-center gap-3">
        <span className="sr-only">Seek within lesson</span>
        <input
          type="range"
          min={0}
          max={Math.max(duration, 1)}
          step={1}
          value={Math.floor(currentTime)}
          onChange={(event) => transport.seek(Number(event.target.value))}
          aria-valuetext={`${formatDuration(currentTime)} of ${formatDuration(duration)}`}
          className="h-1.5 flex-1 cursor-pointer rounded-full bg-white/25 accent-brand-500"
          style={{
            background: `linear-gradient(to right, var(--color-brand-500) ${fraction * 100}%, rgb(255 255 255 / 0.25) ${fraction * 100}%)`,
          }}
        />
      </label>

      <div className="flex items-center gap-1 sm:gap-2">
        <ControlButton
          label="Previous lesson"
          onClick={onPrevious}
          disabled={!hasPrevious}
          icon="chevronLeft"
        />
        <ControlButton
          label={isPlaying ? "Pause" : status === "ended" ? "Replay" : "Play"}
          onClick={transport.toggle}
          icon={isPlaying ? "pause" : "play"}
          emphasis
        />
        <ControlButton
          label="Next lesson"
          onClick={onNext}
          disabled={!hasNext}
          icon="chevronRight"
        />

        <span className="ml-1 text-caption font-medium text-white/85" data-numeric>
          {formatDuration(currentTime)} <span className="text-white/50">/ {formatDuration(duration)}</span>
        </span>

        <span className="flex-1" />

        <span className="clampOne hidden max-w-40 text-caption text-white/60 lg:block">{lessonTitle}</span>

        <Tooltip label={muted ? "Unmute" : `Volume ${Math.round(volume * 100)}%`} placement="top">
          <span className="inline-flex items-center">
            <ControlButton
              label={muted ? "Unmute" : "Mute"}
              onClick={transport.toggleMute}
              icon={muted ? "volumeMuted" : "volume"}
            />
          </span>
        </Tooltip>

        <ControlButton
          label={`Playback speed ${playbackRate}x`}
          onClick={transport.cyclePlaybackRate}
          text={`${playbackRate}x`}
        />

        <ControlButton
          label={immersive ? "Exit fullscreen" : "Fullscreen and rotate"}
          onClick={immersive ? onExitImmersive : onEnterImmersive}
          icon={immersive ? "minimize" : "maximize"}
        />
      </div>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  icon,
  text,
  disabled,
  emphasis = false,
}: {
  label: string;
  onClick: () => void;
  icon?: Parameters<typeof Icon>[0]["name"];
  text?: string;
  disabled?: boolean;
  emphasis?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex h-9 items-center justify-center rounded-control transition-colors duration-micro",
        "disabled:cursor-not-allowed disabled:opacity-35",
        emphasis
          ? "w-11 bg-white text-ink-950 hover:bg-white/90"
          : "min-w-9 px-1.5 text-white/90 hover:bg-white/15",
      ].join(" ")}
    >
      {icon ? <Icon name={icon} size={emphasis ? 18 : 16} /> : null}
      {text ? <span className="ml-1 text-caption font-semibold" data-numeric>{text}</span> : null}
    </button>
  );
}