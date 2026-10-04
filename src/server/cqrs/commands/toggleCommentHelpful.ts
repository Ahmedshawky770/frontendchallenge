/**
 * `PATCH /api/courses/[courseId]/comments/[commentId]` — mark a comment helpful.
 *
 * The toggle is idempotent in the sense that matters here: it flips the viewer's own
 * flag rather than incrementing a shared counter, so two concurrent taps cannot lose
 * a vote and the count can never drift below zero.
 *
 * Comment cache keys live under `courses:{courseId}:comments:*`, which is inside the
 * course prefix — one invalidation covers every lesson-scoped comment list.
 */

import { commandFail, commandOk, type CommandResult } from "./commandResult";
import { loadCourseForCommand } from "./courseGuard";

import { invalidatePrefix, cachePrefixes } from "@/server/cache/cacheAside";
import { toggleHelpful } from "@/server/repositories/commentRepository";

import { isUuidV4 } from "@/domain/uuid";
import type { CourseComment } from "@/domain/types";

export async function toggleCommentHelpful(input: unknown): Promise<CommandResult<CourseComment>> {
  const body = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;

  if (body.action !== "toggleHelpful") {
    return commandFail("validation_failed", "Unsupported comment action", {
      action: "action must be toggleHelpful",
    });
  }

  const commentId = typeof body.commentId === "string" ? body.commentId : "";
  if (!isUuidV4(commentId)) {
    return commandFail("validation_failed", "commentId must be a UUIDv4", {
      commentId: "commentId must be a UUIDv4",
    });
  }

  const course = await loadCourseForCommand(String(body.courseId ?? ""));
  if (!course) return commandFail("not_found", "Unknown course");

  const comment = await toggleHelpful(course.id, commentId);
  if (!comment) return commandFail("not_found", "Unknown comment");

  invalidatePrefix(cachePrefixes.course(course.id));

  return commandOk(comment);
}