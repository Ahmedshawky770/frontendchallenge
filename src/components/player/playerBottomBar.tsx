"use client";

import { Icon } from "@/components/ui/icon";
import type { Uuid } from "@/domain/types";

export interface PlayerBottomBarProps {
  lessonTitle: string | null;
  positionLabel: string;
  progressPercent: number;
  isCompleted: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onOpenSheet: () => void;
  onToggleComplete: (lessonId: Uuid) => void;
  activeLessonId: Uuid | null;
}

/**
 * Mobile-only action bar.
 *
 * Pinned to the bottom of the viewport because the three actions a learner needs
 * on a phone are "where am I", "what is next" and "show me the list" — none of
 * which should require scrolling back up past a 16:9 video that occupies most of
 * the screen.
 *
 * The bar reserves its own height in the page flow via `pb-[var(--mobile-bar-height)]`
 * on the shell, so it never covers the last comment.
 */
export function PlayerBottomBar({
  lessonTitle,
  positionLabel,
  progressPercent,
  isCompleted,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onOpenSheet,
  onToggleComplete,
  activeLessonId,
}: PlayerBottomBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-sm lg:hidden">
      <div className="flex h-mobile-bar items-center gap-2 px-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPrevious}
          aria-label="Previous lesson"
          className="flex size-tap-target shrink-0 items-center justify-center rounded-control text-neutral-700 transition-colors duration-micro hover:bg-neutral-100 disabled:opacity-35"
        >
          <Icon name="chevronLeft" size={20} />
        </button>

        <button
          type="button"
          onClick={onOpenSheet}
          className="flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-control px-2 py-1 text-left transition-colors duration-micro hover:bg-neutral-100"
        >
          <span className="clampOne w-full text-body-sm font-medium text-text-primary">
            {lessonTitle ?? "No lesson selected"}
          </span>
          <span className="flex w-full items-center gap-2 text-micro text-text-tertiary">
            <span data-numeric>
              {positionLabel} · {progressPercent}%
            </span>
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-neutral-200">
              <span
                className="block h-full rounded-full bg-brand-500"
                style={{ width: `${progressPercent}%` }}
              />
            </span>
          </span>
        </button>

        {activeLessonId ? (
          <button
            type="button"
            onClick={() => onToggleComplete(activeLessonId)}
            aria-pressed={isCompleted}
            aria-label={isCompleted ? "Mark lesson incomplete" : "Mark lesson complete"}
            className={[
              "flex size-tap-target shrink-0 items-center justify-center rounded-control transition-colors duration-micro",
              isCompleted
                ? "bg-success-50 text-success-700"
                : "text-neutral-700 hover:bg-neutral-100",
            ].join(" ")}
          >
            <Icon name={isCompleted ? "checkCircle" : "circle"} size={20} />
          </button>
        ) : null}

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next lesson"
          className="flex size-tap-target shrink-0 items-center justify-center rounded-control bg-brand-600 text-white transition-colors duration-micro hover:bg-brand-700 disabled:opacity-35"
        >
          <Icon name="chevronRight" size={20} />
        </button>
      </div>
    </div>
  );
}