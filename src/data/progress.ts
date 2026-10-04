import { courses } from "./courses";
import { ids } from "./ids";

import type { EnrollmentProgress } from "@/domain/types";

/**
 * Seed progress per course, expressed as counts rather than id lists so the
 * fixtures stay readable. The repository expands a count into the first N
 * lesson ids of the course, which keeps this file free of 90 pasted uuids.
 */
interface ProgressSeed {
  slug: string;
  completedLessons: number;
  /** Position of the resume point, as a global lesson index. */
  resumeAtLessonIndex: number;
}

const progressSeeds: ProgressSeed[] = [
  { slug: "advanced-typescript-patterns", completedLessons: 11, resumeAtLessonIndex: 11 },
  { slug: "design-systems-in-practice", completedLessons: 6, resumeAtLessonIndex: 6 },
  { slug: "applied-machine-learning", completedLessons: 0, resumeAtLessonIndex: 0 },
  { slug: "growth-analytics-funnel", completedLessons: 14, resumeAtLessonIndex: 2 },
  { slug: "product-strategy-masterclass", completedLessons: 3, resumeAtLessonIndex: 3 },
  { slug: "cloud-security-hardening", completedLessons: 0, resumeAtLessonIndex: 0 },
];

function buildProgress(seed: ProgressSeed): EnrollmentProgress {
  const course = courses.find((entry) => entry.slug === seed.slug);
  if (!course) throw new Error(`Unknown course slug in progress seed: ${seed.slug}`);

  const lessonIds = course.sections.flatMap((section) => section.lessons.map((lesson) => lesson.id));
  const completedCount = Math.min(seed.completedLessons, lessonIds.length);
  const resumeIndex = Math.min(Math.max(seed.resumeAtLessonIndex, 0), lessonIds.length - 1);

  return {
    courseId: ids.course(seed.slug),
    completedLessonIds: lessonIds.slice(0, completedCount),
    lastLessonId: lessonIds[resumeIndex] ?? lessonIds[0] ?? null,
    updatedAt: course.updatedAt,
  };
}

export const progressBySlug: Record<string, EnrollmentProgress> = Object.fromEntries(
  progressSeeds.map((seed) => [seed.slug, buildProgress(seed)]),
);

export const emptyProgressFor = (courseId: string): EnrollmentProgress => ({
  courseId,
  completedLessonIds: [],
  lastLessonId: null,
  updatedAt: new Date(0).toISOString(),
});