"use client";

import { Badge } from "@/components/ui/badge";
import { Icon, type IconName } from "@/components/ui/icon";
import { formatDuration } from "@/domain/format";
import { lessonKindLabel } from "@/domain/progress";
import type { CourseSection, FlatLesson, Uuid } from "@/domain/types";

export interface LessonRowProps {
  lesson: FlatLesson;
  isActive: boolean;
  isCompleted: boolean;
  /** Global lesson number, so it survives collapsing a section. */
  number: number;
  onSelect: (lessonId: Uuid) => void;
  onToggleComplete: (lessonId: Uuid) => void;
}

const kindIcons: Record<FlatLesson["kind"], IconName> = {
  video: "play",
  reading: "bookOpen",
  quiz: "quiz",
};

/**
 * One lesson in the content list.
 *
 * Two controls live in the row: the row itself selects the lesson, and a
 * separate checkbox marks it complete. They are deliberately different hit
 * targets — conflating "watch this" with "I finished this" is how a course
 * player ends up with progress the learner never earned.
 */
export function LessonRow({
  lesson,
  isActive,
  isCompleted,
  number,
  onSelect,
  onToggleComplete,
}: LessonRowProps) {
  return (
    <li>
      <div
        className={[
          "group flex items-center gap-2 rounded-control pr-1 transition-colors duration-micro",
          isActive ? "bg-brand-50" : "hover:bg-neutral-100",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => onSelect(lesson.id)}
          aria-current={isActive ? "true" : undefined}
          className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 text-left"
        >
          <span
            className={[
              "flex size-8 shrink-0 items-center justify-center rounded-full text-micro font-semibold",
              isCompleted
                ? "bg-success-50 text-success-700"
                : isActive
                  ? "bg-brand-600 text-white"
                  : "bg-neutral-100 text-text-tertiary",
            ].join(" ")}
          >
            {isCompleted ? (
              <Icon name="check" size={15} />
            ) : (
              <span data-numeric>{number}</span>
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span
              className={[
                "clampOne block text-body-sm",
                isActive ? "font-semibold text-brand-700" : "font-medium text-text-primary",
              ].join(" ")}
            >
              {lesson.title}
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 text-caption text-text-tertiary">
              <Icon name={kindIcons[lesson.kind]} size={12} />
              {lessonKindLabel(lesson.kind)}
              <span aria-hidden="true">·</span>
              <span data-numeric>{formatDuration(lesson.durationSeconds)}</span>
              {lesson.isPreview ? (
                <Badge tone="info" className="ml-0.5">
                  Preview
                </Badge>
              ) : null}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => onToggleComplete(lesson.id)}
          aria-pressed={isCompleted}
          aria-label={
            isCompleted ? `Mark "${lesson.title}" as not completed` : `Mark "${lesson.title}" as completed`
          }
          title={isCompleted ? "Mark incomplete" : "Mark complete"}
          className={[
            "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-micro",
            isCompleted
              ? "text-success-700 hover:bg-success-50"
              : "text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600",
          ].join(" ")}
        >
          <Icon name={isCompleted ? "checkCircle" : "circle"} size={18} />
        </button>
      </div>
    </li>
  );
}

export interface LessonListProps {
  sections: CourseSection[];
  /** Flat lessons keyed by section, used for numbering and current-state lookup. */
  lessonsById: Map<Uuid, FlatLesson>;
  activeLessonId: Uuid | null;
  completedIds: Set<Uuid>;
  expandedSectionIds: Uuid[];
  onSelectLesson: (lessonId: Uuid) => void;
  onToggleComplete: (lessonId: Uuid) => void;
  onToggleSection: (sectionId: Uuid, expanded: boolean) => void;
  /** Rendered in the sidebar header — the collapse control on desktop. */
  headerAction?: React.ReactNode;
  className?: string;
}

/**
 * Sectioned course content.
 *
 * `lessonsById` is passed rather than re-deriving numbering inside the list so
 * the number shown next to a lesson is always its course-wide position, even
 * when earlier sections are collapsed.
 */
export function LessonList({
  sections,
  lessonsById,
  activeLessonId,
  completedIds,
  expandedSectionIds,
  onSelectLesson,
  onToggleComplete,
  onToggleSection,
  headerAction,
  className = "",
}: LessonListProps) {
  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      {headerAction ? (
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-3">
          {headerAction}
        </div>
      ) : null}

      <div className="scrollRegion min-h-0 flex-1 px-2 py-2">
        {sections.map((section, sectionIndex) => {
          const expanded = expandedSectionIds.includes(section.id);
          const completedCount = section.lessons.filter((lesson) =>
            completedIds.has(lesson.id),
          ).length;
          const sectionComplete = completedCount === section.lessons.length;

          return (
            <section key={section.id} className="mb-1">
              <h3>
                <button
                  type="button"
                  onClick={() => onToggleSection(section.id, !expanded)}
                  aria-expanded={expanded}
                  aria-controls={`section-lessons-${section.id}`}
                  className="flex w-full items-center gap-2 rounded-control px-2 py-2 text-left transition-colors duration-micro hover:bg-neutral-100"
                >
                  <Icon
                    name={expanded ? "chevronDown" : "chevronRight"}
                    size={15}
                    className="shrink-0 text-text-tertiary"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="clampOne block text-body-sm font-semibold text-text-primary">
                      {section.title}
                    </span>
                    <span className="mt-0.5 block text-caption text-text-tertiary" data-numeric>
                      Section {sectionIndex + 1} · {completedCount}/{section.lessons.length} done
                    </span>
                  </span>
                  {sectionComplete ? (
                    <Icon name="checkCircle" size={16} className="shrink-0 text-success-500" />
                  ) : null}
                </button>
              </h3>

              <ul
                id={`section-lessons-${section.id}`}
                hidden={!expanded}
                className="mt-0.5 flex flex-col gap-0.5"
              >
                {section.lessons.map((lesson) => {
                  const flatLesson = lessonsById.get(lesson.id);
                  if (!flatLesson) return null;

                  return (
                    <LessonRow
                      key={lesson.id}
                      lesson={flatLesson}
                      number={flatLesson.index}
                      isActive={lesson.id === activeLessonId}
                      isCompleted={completedIds.has(lesson.id)}
                      onSelect={onSelectLesson}
                      onToggleComplete={onToggleComplete}
                    />
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}