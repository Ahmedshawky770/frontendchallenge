/**
 * Course detail query handlers (CQRS read side).
 *
 * `getCourseDetail` assembles the single read model the player island renders
 * from, so the page performs one cache-aware read instead of five uncached ones.
 */

import { viewerProfile } from "@/data/comments";

import { cacheAside, cacheKeys, cacheTtl } from "@/server/cache/cacheAside";
import { findCourseById, findCourseBySlug, loadCourseDetail } from "@/server/repositories/courseRepository";
import { findCommentsByCourseId, findPinnedComment } from "@/server/repositories/commentRepository";
import { loadLeaderboard } from "@/server/repositories/leaderboardRepository";

import { computeMetrics } from "@/domain/progress";
import type {
  CourseComment,
  CourseDetail,
  Course,
  LeaderboardEntry,
  Uuid,
} from "@/domain/types";

export async function getCourseDetail(
  course: Course,
  progressOverride?: CourseDetail["progress"],
): Promise<CourseDetail> {
  const { lessons, progress } = await cacheAside({
    key: cacheKeys.courseDetail(course.id),
    ttlSeconds: cacheTtl.courseDetail,
    load: () => loadCourseDetail(course),
  });

  const effectiveProgress = progressOverride ?? progress;

  return {
    course,
    lessons,
    progress: effectiveProgress,
    metrics: computeMetrics(course, effectiveProgress),
    viewer: viewerProfile,
  };
}

/** Resolves by uuid first, then by slug, so links stay human-readable. */
export async function resolveCourse(idOrSlug: string): Promise<Course | null> {
  const { value } = await cacheAside({
    key: cacheKeys.courseBySlug(idOrSlug),
    ttlSeconds: cacheTtl.courseDetail,
    load: () => findCourseBySlug(idOrSlug),
  });
  if (value) return value;
  return findCourseById(idOrSlug);
}

export async function getLessonComments(
  courseId: Uuid,
  lessonId: Uuid | null,
): Promise<{ comments: CourseComment[]; pinned: CourseComment | null }> {
  const { value } = await cacheAside({
    key: cacheKeys.comments(courseId, lessonId),
    ttlSeconds: cacheTtl.comments,
    load: async () => ({
      comments: await findCommentsByCourseId(courseId, lessonId),
      pinned: await findPinnedComment(courseId),
    }),
  });

  return value;
}

export async function getLeaderboard(
  course: Course,
  limit = 5,
): Promise<LeaderboardEntry[]> {
  const { value } = await cacheAside({
    key: cacheKeys.leaderboard(course.id, limit),
    ttlSeconds: cacheTtl.leaderboard,
    load: () => loadLeaderboard(course, limit),
  });
  return value;
}

export async function getCourseProgress(courseId: Uuid) {
  const course = await findCourseById(courseId);
  if (!course) return null;

  const { progress } = await loadCourseDetail(course);
  return {
    courseId,
    ...computeMetrics(course, progress),
    completedLessonIds: progress.completedLessonIds,
    lastLessonId: progress.lastLessonId,
  };
}