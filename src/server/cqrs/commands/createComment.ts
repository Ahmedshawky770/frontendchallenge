/**
 * `POST /api/courses/[courseId]/comments` — append a comment.
 *
 * The client sends a body and, optionally, the lesson it belongs to. Everything else
 * is assigned here: the uuid, the timestamp, and the author. Taking the author from
 * the request would let anyone post as an instructor.
 *
 * A write also has to be visible to the next read, so both cache scopes are dropped:
 * the course prefix (the comment lists) and the catalogue prefix (cards embed the
 * comment count). Invalidating a little too much is cheap; serving a stale count is
 * not.
 */

import { commandFail, commandOk, type CommandResult } from "./commandResult";
import { courseOwnsLesson, lessonExistsInAnyCourse, loadCourseForCommand } from "./courseGuard";

import { invalidatePrefix, cachePrefixes } from "@/server/cache/cacheAside";
import { appendComment } from "@/server/repositories/commentRepository";

import { viewer } from "@/data/profiles";
import { createUuid, isUuidV4 } from "@/domain/uuid";
import type { CourseComment } from "@/domain/types";

const maxBodyLength = 2000;

function validateBody(value: unknown): { body: string } | { fields: Record<string, string> } {
  const raw = typeof value === "string" ? value.trim() : "";
  if (raw.length === 0) {
    return { fields: { body: "body must not be empty" } };
  }
  if (raw.length > maxBodyLength) {
    return { fields: { body: `body must be at most ${maxBodyLength} characters` } };
  }
  return { body: raw };
}

export async function createComment(input: unknown): Promise<CommandResult<CourseComment>> {
  const body = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;

  const validated = validateBody(body.body);
  if ("fields" in validated) {
    return commandFail("validation_failed", "Comment is not valid", validated.fields);
  }

  const rawLessonId = body.lessonId;
  let lessonId: string | null = null;
  if (rawLessonId !== undefined && rawLessonId !== null) {
    if (typeof rawLessonId !== "string" || !isUuidV4(rawLessonId)) {
      return commandFail("validation_failed", "Comment is not valid", {
        lessonId: "lessonId must be a UUIDv4 or null",
      });
    }
    lessonId = rawLessonId;
  }

  const course = await loadCourseForCommand(String(body.courseId ?? ""));
  if (!course) return commandFail("not_found", "Unknown course");

  if (lessonId && !courseOwnsLesson(course, lessonId)) {
    const existsElsewhere = await lessonExistsInAnyCourse(lessonId);
    return existsElsewhere
      ? commandFail("conflict", "That lesson belongs to a different course")
      : commandFail("not_found", "Unknown lesson");
  }

  const comment: CourseComment = {
    id: createUuid(),
    courseId: course.id,
    lessonId,
    author: viewer,
    body: validated.body,
    createdAt: new Date().toISOString(),
    helpfulCount: 0,
    viewerHasMarkedHelpful: false,
  };

  let saved: CourseComment;
  try {
    saved = await appendComment(comment);
  } catch {
    return commandFail("not_found", "Unknown course");
  }

  invalidatePrefix(cachePrefixes.course(course.id));
  invalidatePrefix(cachePrefixes.catalogue());

  return commandOk(saved);
}