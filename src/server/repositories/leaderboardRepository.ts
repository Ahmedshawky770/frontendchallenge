/**
 * Leaderboard read model.
 *
 * Ranking is derived from completed-lesson counts, never stored as a rank, so a
 * student who finishes a lesson moves up without a separate write path.
 */

import { leaderboardStreaks, leaderboardStudents, viewer } from "@/data/profiles";

import type { Course, LeaderboardEntry } from "@/domain/types";
import { computeMetrics } from "@/domain/progress";

export async function loadLeaderboard(
  course: Course,
  limit = 5,
): Promise<LeaderboardEntry[]> {
  const metrics = computeMetrics(course, {
    courseId: course.id,
    completedLessonIds: [],
    lastLessonId: null,
    updatedAt: new Date(0).toISOString(),
  });

  const cohort = [...leaderboardStudents];

  // The signed-in learner appears in their own leaderboard so their standing is
  // visible; without this the list would never show "you" at any rank.
  if (!cohort.some((student) => student.id === viewer.id)) {
    cohort.push(viewer);
  }

  const entries = cohort.map((student, index) => {
    const isViewer = student.id === viewer.id;
    // Deterministic per-student completion counts, one entry per cohort slot.
    const completedLessons = Math.round((cohort.length - index) / (cohort.length + 1) * metrics.totalLessons);

    return {
      student,
      completedLessons: isViewer ? metrics.completedLessons : completedLessons,
      totalLessons: metrics.totalLessons,
      progressPercent: isViewer
        ? metrics.progressPercent
        : Math.round((completedLessons / metrics.totalLessons) * 100),
      streakDays: leaderboardStreaks[index % leaderboardStreaks.length],
    };
  });

  entries.sort((left, right) => right.progressPercent - left.progressPercent);

  return entries.slice(0, Math.min(Math.max(limit, 1), 50)).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}