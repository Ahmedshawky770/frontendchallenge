import Image from "next/image";

import type { ReactNode } from "react";

export interface AvatarProps {
  src: string;
  /** Used as the accessible name and as the fallback initials. */
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Renders a ring — used to mark the current user or a rank-one entry. */
  ring?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: "size-7 text-micro",
  sm: "size-8 text-caption",
  md: "size-10 text-body-sm",
  lg: "size-12 text-body",
  xl: "size-16 text-title",
} as const;

const pixelSizes = { xs: 28, sm: 32, md: 40, lg: 48, xl: 64 } as const;

/**
 * Circular profile image.
 *
 * `alt` carries the person's name because the avatar is frequently the *only*
 * representation of that person — in the leaderboard it is the entire control,
 * so a missing name would make the list unusable.
 */
export function Avatar({ src, name, size = "md", ring = false, className = "" }: AvatarProps) {
  const pixels = pixelSizes[size];

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-semibold text-brand-700 ${
        ring ? "ring-2 ring-brand-500 ring-offset-2 ring-offset-surface" : ""
      } ${sizeClasses[size]} ${className}`}
    >
      <Image
        src={src}
        alt={name}
        width={pixels}
        height={pixels}
        sizes={`${pixels}px`}
        className="size-full object-cover"
      />
    </span>
  );
}

/** Overlapping avatar group — used for the enrolled-student count. */
export function AvatarStack({
  people,
  max = 4,
}: {
  people: { src: string; name: string }[];
  max?: number;
}) {
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;

  return (
    <span className="flex items-center">
      {visible.map((person, index) => (
        <span
          key={person.name}
          className="-ml-2 first:ml-0 rounded-full ring-2 ring-surface"
          style={{ zIndex: visible.length - index }}
        >
          <Avatar src={person.src} name={person.name} size="sm" />
        </span>
      ))}
      {overflow > 0 ? (
        <span className="-ml-2 inline-flex size-8 items-center justify-center rounded-full bg-neutral-100 text-micro font-semibold text-neutral-600 ring-2 ring-surface">
          +{overflow}
        </span>
      ) : null}
    </span>
  );
}

/** Text + avatar pair used by comment cards and the pinned note. */
export function AvatarWithName({
  src,
  name,
  meta,
  children,
}: {
  src: string;
  name: string;
  meta?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar src={src} name={name} size="sm" />
      <span className="flex min-w-0 flex-col">
        <span className="clampOne text-body-sm font-medium text-text-primary">{name}</span>
        {meta ? <span className="clampOne text-caption text-text-tertiary">{meta}</span> : null}
      </span>
      {children}
    </span>
  );
}