/**
 * Pure domain logic. No React, no Next, no I/O — every function here is a
 * total function over its inputs, which is what makes the read model cheap to
 * compute during render instead of storing derived state.
 */

import type {
  Course,
  CourseMetrics,
  CourseStatus,
  CourseSummary,
  EnrollmentProgress,
  FlatLesson,
  Lesson,
} from "./types";

/** Every lesson in the course, in stable course order. */
export function flattenLessons(course: Course): FlatLesson[] {
  return course.sections.flatMap((section, sectionIndex) =>
    section.lessons.map((lesson) => ({ ...lesson, sectionTitle: section.title, sectionIndex })),
  );
}

export function findLesson(course: Course, lessonId: string | null): FlatLesson | null {
  if (!lessonId) return null;
  const lessons = flattenLessons(course);
  return lessons.find((lesson) => lesson.id === lessonId) ?? null;
}

/**
 * Progress is always derived, never stored twice: the completed set is the only
 * source of truth, the percentage is a pure function of it.
 */
export function computeMetrics(course: Course, progress: EnrollmentProgress): CourseMetrics {
  const allLessons = flattenLessons(course);
  const lessonIds = new Set(allLessons.map((lesson) => lesson.id));

  const completedLessons = progress.completedLessonIds.filter((id) => lessonIds.has(id)).length;
  const totalLessons = allLessons.length;
  const totalDurationSeconds = allLessons.reduce((sum, lesson) => sum + lesson.durationSeconds, 0);

  const completedDuration = allLessons
    .filter((lesson) => progress.completedLessonIds.includes(lesson.id))
    .reduce((sum, lesson) => sum + lesson.durationSeconds, 0);

  return {
    totalLessons,
    totalSections: course.sections.length,
    completedLessons,
    progressPercent: percent(completedLessons, totalLessons),
    status: resolveStatus(completedLessons, totalLessons),
    totalDurationSeconds,
    remainingDurationSeconds: Math.max(totalDurationSeconds - completedDuration, 0),
  };
}

export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function resolveStatus(completedLessons: number, totalLessons: number): CourseStatus {
  if (totalLessons === 0 || completedLessons === 0) return "not-started";
  if (completedLessons >= totalLessons) return "completed";
  return "in-progress";
}

export function isLessonCompleted(progress: EnrollmentProgress, lessonId: string): boolean {
  return progress.completedLessonIds.includes(lessonId);
}

/** Toggles membership and returns a new array — never mutates in place. */
export function toggleLesson(progress: EnrollmentProgress, lessonId: string): EnrollmentProgress {
  const completed = progress.completedLessonIds.includes(lessonId);
  return {
    ...progress,
    completedLessonIds: completed
      ? progress.completedLessonIds.filter((id) => id !== lessonId)
      : [...progress.completedLessonIds, lessonId],
    lastLessonId: lessonId,
  };
}

export function previousLesson(lessons: FlatLesson[], currentId: string | null): FlatLesson | null {
  if (!currentId) return null;
  const index = lessons.findIndex((lesson) => lesson.id === currentId);
  return index > 0 ? lessons[index - 1] : null;
}

export function nextLesson(lessons: FlatLesson[], currentId: string | null): FlatLesson | null {
  if (!currentId) return lessons[0] ?? null;
  const index = lessons.findIndex((lesson) => lesson.id === currentId);
  return index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null;
}

/**
 * Where "Start" / "Resume" should land: the resume point when it is still valid,
 * otherwise the first unfinished lesson, otherwise the first lesson.
 */
export function resolveEntryLesson(
  lessons: FlatLesson[],
  progress: EnrollmentProgress,
): FlatLesson | null {
  if (lessons.length === 0) return null;

  const resumeTarget = lessons.find((lesson) => lesson.id === progress.lastLessonId);
  if (resumeTarget) return resumeTarget;

  const unfinished = lessons.find((lesson) => !progress.completedLessonIds.includes(lesson.id));
  return unfinished ?? lessons[0];
}

/** Catalogue projection: the card only needs these fields, not the lesson graph. */
export function toCourseSummary(course: Course, progress: EnrollmentProgress): CourseSummary {
  const metrics = computeMetrics(course, progress);

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    category: course.category,
    level: course.level,
    instructor: {
      id: course.instructor.id,
      name: course.instructor.name,
      avatarUrl: course.instructor.avatarUrl,
      role: "instructor",
      headline: course.instructor.title,
    },
    posterUrl: course.posterUrl,
    posterBlurDataUrl: course.posterBlurDataUrl,
    accentColor: course.accentColor,
    rating: course.rating,
    ratingCount: course.ratingCount,
    enrolledCount: course.enrolledCount,
    lessonCount: metrics.totalLessons,
    totalDurationSeconds: metrics.totalDurationSeconds,
    completedLessons: metrics.completedLessons,
    progressPercent: metrics.progressPercent,
    status: metrics.status,
    lastLessonId: progress.lastLessonId,
    updatedAt: course.updatedAt,
  };
}

/** The catalogue call-to-action label, derived from status — never stored twice. */
export function courseActionLabel(status: CourseStatus): string {
  if (status === "completed") return "Review course";
  if (status === "in-progress") return "Resume";
  return "Start course";
}

/**
 * Player route for a course.
 *
 * An in-progress course deep-links to the lesson it was left on. The player
 * seeds its initial lesson from `?lesson=<uuid>` and falls back to the resume
 * point when the param is missing or no longer valid, so a stale `lastLessonId`
 * degrades to "resume" rather than rendering an error.
 *
 * The path shape is duplicated from the route segment on purpose: the catalogue
 * and the player both need it, and threading a URL builder through the data
 * layer to avoid one template string would be worse than the duplication.
 */
export function coursePlayerHref(
  course: Pick<CourseSummary, "slug" | "status" | "lastLessonId">,
): string {
  if (course.status === "in-progress" && course.lastLessonId) {
    return `/courses/${course.slug}?lesson=${course.lastLessonId}`;
  }
  return `/courses/${course.slug}`;
}

/**
 * The single course to surface as "continue where you left off": the most
 * recently updated in-progress one. Null when nothing is in progress, which is
 * the signal to hide the resume banner entirely.
 */
export function pickResumeCourse(summaries: CourseSummary[]): CourseSummary | null {
  const inProgress = summaries.filter((course) => course.status === "in-progress");
  if (inProgress.length === 0) return null;

  return inProgress.reduce((newest, course) =>
    course.updatedAt > newest.updatedAt ? course : newest,
  );
}

/** Human label for a lesson kind, reused by the lesson row and the tabs. */
export function lessonKindLabel(kind: Lesson["kind"]): string {
  if (kind === "reading") return "Reading";
  if (kind === "quiz") return "Quiz";
  return "Video";
}