"use client";

import { IconButton } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { formatInteger } from "@/domain/format";
import type { CourseSection, FlatLesson, Uuid } from "@/domain/types";

import { LessonList } from "./lessonList";

export interface ContentSidebarProps {
  sections: CourseSection[];
  lessonsById: Map<Uuid, FlatLesson>;
  activeLessonId: Uuid | null;
  completedIds: Set<Uuid>;
  expandedSectionIds: Uuid[];
  onSelectLesson: (lessonId: Uuid) => void;
  onToggleComplete: (lessonId: Uuid) => void;
  onToggleSection: (sectionId: Uuid, expanded: boolean) => void;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  /** Desktop: user-collapsed column. Mobile: closed bottom sheet. */
  collapsed: boolean;
  sheetOpen: boolean;
  onCloseSheet: () => void;
}

/**
 * Course content panel — one DOM node serving two very different roles.
 *
 * Desktop (`lg` and up): a fixed 380 px grid column. Collapsing it animates the
 * grid track to 0 and clips the panel, so the video column grows to full width
 * while the content stays mounted — no refetch, no layout flash, scroll position
 * preserved.
 *
 * Mobile and tablet (`< lg`): the same element becomes a bottom sheet. It is
 * `position: fixed` and translated off-screen unless open, and the page behind it
 * keeps its own scroll.
 *
 * Rendering one instance instead of two matters: duplicating the list would
 * double the DOM, produce duplicate landmark labels, and let screen-reader users
 * reach a "hidden" copy that looks visible.
 */
export function ContentSidebar({
  sections,
  lessonsById,
  activeLessonId,
  completedIds,
  expandedSectionIds,
  onSelectLesson,
  onToggleComplete,
  onToggleSection,
  completedLessons,
  totalLessons,
  progressPercent,
  collapsed,
  sheetOpen,
  onCloseSheet,
}: ContentSidebarProps) {
  return (
    <>
      {/* Backdrop exists only for the mobile sheet; the desktop column must not dim the page. */}
      <button
        type="button"
        aria-label="Close course content"
        onClick={onCloseSheet}
        tabIndex={sheetOpen ? 0 : -1}
        className={`fixed inset-0 z-30 cursor-default bg-ink-950/40 transition-opacity duration-overlay lg:hidden ${
          sheetOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-label="Course content"
        className={[
          "flex flex-col overflow-hidden border-border bg-surface transition-[transform,opacity] duration-overlay",
          // --- mobile: bottom sheet ---
          "fixed inset-x-0 bottom-0 z-40 max-h-[86dvh] rounded-t-panel border-t shadow-lg",
          // `max-lg:` is load-bearing. These two rules describe a sheet that is
          // parked below the viewport, which is true only below `lg` — on desktop
          // the same element is a normal grid column. Left unprefixed they also
          // applied at `lg`, where `pointer-events: none` inherited down to every
          // lesson row and section header and made the whole course content list
          // unclickable. `max-lg` also keeps this clear of the `lg:` collapse rule
          // below, so the two can never fight at the same breakpoint.
          sheetOpen
            ? "translate-y-0"
            : "max-lg:pointer-events-none max-lg:translate-y-[105%]",
          // --- desktop: grid column ---
          // The player has no app bar of its own, so the sticky offset is a plain
          // gutter. It used to subtract `--app-bar-height`, which left the sidebar
          // floating a full bar lower than the video column it sits beside.
          "lg:static lg:z-auto lg:max-h-[calc(100dvh-2rem)] lg:translate-y-0 lg:rounded-card lg:border lg:shadow-xs",
          collapsed ? "lg:pointer-events-none lg:opacity-0" : "lg:opacity-100",
        ].join(" ")}
      >
        <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
          <IconButton
            label="Close course content"
            icon="x"
            variant="ghost"
            size="sm"
            onClick={onCloseSheet}
            className="lg:hidden"
          />
          <div className="min-w-0 flex-1">
            <h2 className="clampOne text-title-sm font-semibold text-text-primary">Course content</h2>
            <p className="mt-0.5 text-caption text-text-secondary" data-numeric>
              {formatInteger(completedLessons)} of {formatInteger(totalLessons)} lessons · {progressPercent}%
            </p>
          </div>
        </div>

        <div className="border-b border-border px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-caption font-medium text-text-secondary">Your progress</span>
            <span className="text-caption font-semibold text-brand-700" data-numeric>
              {progressPercent}%
            </span>
          </div>
          <ProgressBar
            value={progressPercent}
            tone={progressPercent === 100 ? "success" : "brand"}
            label="Your course progress"
          />
        </div>

        <LessonList
          sections={sections}
          lessonsById={lessonsById}
          activeLessonId={activeLessonId}
          completedIds={completedIds}
          expandedSectionIds={expandedSectionIds}
          onSelectLesson={onSelectLesson}
          onToggleComplete={onToggleComplete}
          onToggleSection={onToggleSection}
          className="min-h-0 flex-1"
        />
      </aside>
    </>
  );
}