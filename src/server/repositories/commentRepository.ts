/**
 * Comment storage. Append-only from the application's point of view: the UI
 * creates comments and toggles the "helpful" flag, nothing is ever updated in
 * place except that flag.
 */

import { commentsBySlug, instructorPinnedComment } from "@/data/comments";
import { courses } from "@/data/courses";

import type { CourseComment, Uuid } from "@/domain/types";

type CommentStore = Record<string, CourseComment[]>;

const store: CommentStore = commentsBySlug;

function courseSlugFor(courseId: Uuid): string | null {
  return courses.find((course) => course.id === courseId)?.slug ?? null;
}

export async function findCommentsByCourseId(
  courseId: Uuid,
  lessonId: Uuid | null,
): Promise<CourseComment[]> {
  const slug = courseSlugFor(courseId);
  if (!slug) return [];

  const all = store[slug] ?? [];
  const filtered = lessonId
    ? all.filter((comment) => comment.lessonId === lessonId || comment.lessonId === null)
    : all;

  // Newest first. `createdAt` is ISO-8601 so a plain string compare is correct.
  return [...filtered].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function appendComment(comment: CourseComment): Promise<CourseComment> {
  const slug = courseSlugFor(comment.courseId);
  if (!slug) throw new Error(`Unknown course: ${comment.courseId}`);

  store[slug] = [comment, ...(store[slug] ?? [])];
  return comment;
}

export async function toggleHelpful(
  courseId: Uuid,
  commentId: Uuid,
): Promise<CourseComment | null> {
  const slug = courseSlugFor(courseId);
  if (!slug) return null;

  const comments = store[slug] ?? [];
  const index = comments.findIndex((comment) => comment.id === commentId);
  if (index === -1) return null;

  const current = comments[index];
  const next: CourseComment = {
    ...current,
    viewerHasMarkedHelpful: !current.viewerHasMarkedHelpful,
    helpfulCount: Math.max(current.helpfulCount + (current.viewerHasMarkedHelpful ? -1 : 1), 0),
  };

  comments[index] = next;
  return next;
}

export async function findPinnedComment(courseId: Uuid): Promise<CourseComment | null> {
  return instructorPinnedComment.courseId === courseId ? instructorPinnedComment : null;
}