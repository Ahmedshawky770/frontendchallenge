"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { formatDate, formatDuration } from "@/domain/format";
import { lessonKindLabel } from "@/domain/progress";
import type { FlatLesson, Instructor, Uuid } from "@/domain/types";

export interface LessonHeaderProps {
  courseTitle: string;
  lesson: FlatLesson | null;
  positionLabel: string;
  sectionTitle: string;
  instructor: Instructor;
  /** Course last-updated timestamp, ISO-8601. */
  updatedAt: string;
  isCompleted: boolean;
  onToggleComplete: (lessonId: Uuid) => void;
  /** Desktop sidebar collapse control. Hidden below `lg`, where the sheet is used instead. */
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

const kindTones = {
  video: "brand",
  reading: "info",
  quiz: "warning",
} as const;

/**
 * Everything between the video and the tab strip: where you are in the course,
 * which lesson this is, who teaches it, and the two actions that act on it.
 *
 * The collapse toggle lives here rather than inside the sidebar on purpose — a
 * collapsed sidebar is zero-width, so a control placed inside it would be
 * clipped along with the panel.
 */
export function LessonHeader({
  courseTitle,
  lesson,
  positionLabel,
  sectionTitle,
  instructor,
  updatedAt,
  isCompleted,
  onToggleComplete,
  onToggleSidebar,
  sidebarCollapsed = false,
}: LessonHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-border px-4 pb-4 pt-3 sm:px-5">
      <div className="flex items-center gap-2 text-caption text-text-tertiary">
        <Link
          href="/"
          className="-mx-1 inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xs px-1 font-medium transition-colors duration-micro hover:text-text-primary sm:min-h-0"
        >
          <Icon name="arrowLeft" size={15} />
          All courses
        </Link>
        <span aria-hidden="true">/</span>
        <span className="clampOne">{courseTitle}</span>
      </div>

      {/* Stacked on phones, side by side from `sm`. In a row the action button
          takes its intrinsic width and squeezes the `h1` into a two-word-per-line
          column, which is exactly where the lesson name most needs to be read. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-x-4 sm:gap-y-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {lesson ? (
              <Badge tone={kindTones[lesson.kind]}>{lessonKindLabel(lesson.kind)}</Badge>
            ) : null}
            {lesson?.isPreview ? <Badge tone="info">Free preview</Badge> : null}
            <span className="text-caption text-text-tertiary" data-numeric>
              Lesson {positionLabel} · {sectionTitle}
            </span>
          </div>

          <h1 className="mt-2 text-title font-semibold text-text-primary lg:text-body-lg">
            {lesson?.title ?? "No lesson selected"}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <span className="flex size-6 items-center justify-center rounded-full bg-brand-100 text-micro font-semibold text-brand-700">
                {instructor.name.charAt(0)}
              </span>
              {instructor.name}
            </span>
            {lesson ? (
              <span className="inline-flex items-center gap-1.5" data-numeric>
                <Icon name="clock" size={14} />
                {formatDuration(lesson.durationSeconds)}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Icon name="sparkles" size={14} />
              Updated {formatDate(updatedAt)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {lesson ? (
            <button
              type="button"
              onClick={() => onToggleComplete(lesson.id)}
              aria-pressed={isCompleted}
              className={[
                "inline-flex h-11 items-center gap-2 rounded-control px-4 text-body-sm font-medium transition-colors duration-micro",
                isCompleted
                  ? "bg-success-50 text-success-700 hover:bg-success-500 hover:text-white"
                  : "border border-border-strong bg-surface text-neutral-800 shadow-xs hover:bg-neutral-50",
              ].join(" ")}
            >
              <Icon name={isCompleted ? "checkCircle" : "circle"} size={18} />
              {isCompleted ? "Completed" : "Mark complete"}
            </button>
          ) : null}

          {onToggleSidebar ? (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-expanded={!sidebarCollapsed}
              aria-controls="course-content-sidebar"
              aria-label={sidebarCollapsed ? "Show course content sidebar" : "Hide course content sidebar"}
              title={sidebarCollapsed ? "Show course content" : "Hide course content"}
              className="hidden size-11 shrink-0 items-center justify-center rounded-control border border-border-strong bg-surface text-neutral-700 shadow-xs transition-colors duration-micro hover:bg-neutral-50 lg:inline-flex"
            >
              <Icon name={sidebarCollapsed ? "minimizeSidebarAlt" : "minimizeSidebar"} size={18} />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}