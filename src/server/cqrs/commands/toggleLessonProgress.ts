/**
 * `PATCH /api/courses/[courseId]/progress` — complete, uncomplete or resume a lesson.
 *
 * The completed set is the only stored truth; the percentage is recomputed from it on
 * every read, so a toggle can never leave a stale number behind. `toggleLesson` in
 * the domain layer owns the array maths and this handler only decides *which*
 * transition was asked for and persists it.
 *
 * The same write changes three cache scopes: the progress read, the course detail
 * (the header ring reads it), and the catalogue cards.
 */

import { commandFail, commandOk, type CommandResult } from "./commandResult";
import { courseOwnsLesson, lessonExistsInAnyCourse, loadCourseForCommand } from "./courseGuard";

import { invalidatePrefix, cacheKeys, cachePrefixes } from "@/server/cache/cacheAside";
import { findProgressByCourseId, saveProgress } from "@/server/repositories/courseRepository";

import { computeMetrics, toggleLesson } from "@/domain/progress";
import { isUuidV4 } from "@/domain/uuid";
import type { CourseMetrics, EnrollmentProgress } from "@/domain/types";

export type ProgressAction = "complete" | "uncomplete" | "setLastLesson";

export interface ProgressCommandResult {
  courseId: string;
  progress: EnrollmentProgress;
  /** Recomputed from the persisted set, never echoed from the request. */
  metrics: CourseMetrics;
}

const actions: readonly ProgressAction[] = ["complete", "uncomplete", "setLastLesson"];

function isProgressAction(value: unknown): value is ProgressAction {
  return typeof value === "string" && (actions as readonly string[]).includes(value);
}

export async function toggleLessonProgress(
  input: unknown,
): Promise<CommandResult<ProgressCommandResult>> {
  const body = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;

  if (!isProgressAction(body.action)) {
    return commandFail("validation_failed", "Unknown progress action", {
      action: `action must be one of ${actions.join(", ")}`,
    });
  }

  const lessonId = typeof body.lessonId === "string" ? body.lessonId : "";
  if (!isUuidV4(lessonId)) {
    return commandFail("validation_failed", "lessonId must be a UUIDv4", {
      lessonId: "lessonId must be a UUIDv4",
    });
  }

  const course = await loadCourseForCommand(String(body.courseId ?? ""));
  if (!course) return commandFail("not_found", "Unknown course");

  if (!courseOwnsLesson(course, lessonId)) {
    const existsElsewhere = await lessonExistsInAnyCourse(lessonId);
    return existsElsewhere
      ? commandFail("conflict", "That lesson belongs to a different course")
      : commandFail("not_found", "Unknown lesson");
  }

  const current = await findProgressByCourseId(course.id);
  const updatedAt = new Date().toISOString();

  let next: EnrollmentProgress;
  if (body.action === "setLastLesson") {
    next = { ...current, lastLessonId: lessonId, updatedAt };
  } else {
    const shouldBeCompleted = body.action === "complete";
    const isCompleted = current.completedLessonIds.includes(lessonId);

    // Only go through the domain toggle when the state actually has to change, so
    // "complete" on an already-completed lesson stays complete.
    next = shouldBeCompleted === isCompleted ? { ...current, updatedAt } : toggleLesson(current, lessonId);

    // Completing a lesson moves the resume point there; un-completing must not.
    if (body.action === "uncomplete") {
      next = { ...next, lastLessonId: current.lastLessonId, updatedAt };
    }
  }

  const saved = await saveProgress(next);

  invalidatePrefix(cacheKeys.progress(course.id));
  invalidatePrefix(cachePrefixes.course(course.id));
  invalidatePrefix(cachePrefixes.catalogue());

  return commandOk({
    courseId: course.id,
    progress: saved,
    metrics: computeMetrics(course, saved),
  });
}