/**
 * Course read repository.
 *
 * The only module that knows how a course is stored. In this build the "storage"
 * is the fixture set in src/data; swapping it for Postgres means replacing the
 * bodies of these functions and nothing else — the query handlers and the UI
 * never learn the difference.
 */

import { courses } from "@/data/courses";
import { progressBySlug, emptyProgressFor } from "@/data/progress";

import {
  computeMetrics,
  flattenLessons,
  toCourseSummary,
} from "@/domain/progress";
import type {
  Course,
  CourseSummary,
  EnrollmentProgress,
  FlatLesson,
} from "@/domain/types";

export async function findAllCourses(): Promise<Course[]> {
  return courses;
}

export async function findCourseById(courseId: string): Promise<Course | null> {
  return courses.find((course) => course.id === courseId) ?? null;
}

export async function findCourseBySlug(slug: string): Promise<Course | null> {
  return courses.find((course) => course.slug === slug) ?? null;
}

export async function findProgressByCourseId(courseId: string): Promise<EnrollmentProgress> {
  const course = courses.find((entry) => entry.id === courseId);
  if (!course) return emptyProgressFor(courseId);
  return progressBySlug[course.slug] ?? emptyProgressFor(courseId);
}

export async function saveProgress(progress: EnrollmentProgress): Promise<EnrollmentProgress> {
  const course = courses.find((entry) => entry.id === progress.courseId);
  if (!course) throw new Error(`Unknown course: ${progress.courseId}`);

  progressBySlug[course.slug] = progress;
  return progress;
}

export interface CatalogueFilter {
  category?: string;
  query?: string;
  status?: string;
}

/** Catalogue projection: filtering happens on the summary, never on the lesson graph. */
export async function listCourseSummaries(
  filter: CatalogueFilter,
): Promise<CourseSummary[]> {
  const normalisedQuery = filter.query?.trim().toLowerCase() ?? "";

  const summaries = await Promise.all(
    courses.map(async (course) => {
      const progress = await findProgressByCourseId(course.id);
      return toCourseSummary(course, progress);
    }),
  );

  return summaries.filter((summary) => {
    if (filter.category && filter.category !== "all" && summary.category !== filter.category) {
      return false;
    }

    if (
      filter.status &&
      filter.status !== "all" &&
      summary.status !== filter.status
    ) {
      return false;
    }

    if (!normalisedQuery) return true;

    return (
      summary.title.toLowerCase().includes(normalisedQuery) ||
      summary.subtitle.toLowerCase().includes(normalisedQuery) ||
      summary.instructor.name.toLowerCase().includes(normalisedQuery)
    );
  });
}

export interface StoredCourseDetail {
  course: Course;
  lessons: FlatLesson[];
  progress: EnrollmentProgress;
}

export async function loadCourseDetail(course: Course): Promise<StoredCourseDetail> {
  const progress = await findProgressByCourseId(course.id);
  return { course, lessons: flattenLessons(course), progress };
}

export async function loadMetrics(course: Course, progress: EnrollmentProgress) {
  return computeMetrics(course, progress);
}