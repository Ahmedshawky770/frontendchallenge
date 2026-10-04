/**
 * `/api/courses/[courseId]/comments` — read (`GET`) and append (`POST`).
 *
 * Both verbs converge on the same layer as the Server Actions: the read goes through
 * the cached query handler, the write through the command handler. A new comment is
 * `201` — unlike an upload, the comment exists the moment this returns.
 */

import { errorResponse, readJsonBody, readParam, validationError } from "../../../http-adapter";

import { createComment } from "@/server/cqrs/commands/createComment";
import { getLessonComments } from "@/server/cqrs/queries/courseQueries";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/courses/[courseId]/comments">,
): Promise<Response> {
  const { courseId } = await ctx.params;
  const { searchParams } = new URL(request.url);

  const lessonId = readParam(searchParams, "lessonId") ?? null;
  const { comments, pinned } = await getLessonComments(courseId, lessonId);

  // `sort` is a presentation choice of this endpoint, not a domain rule: the cached
  // query always returns newest-first and the helpful order is derived from the same
  // read model.
  if (readParam(searchParams, "sort") === "helpful") {
    const byHelpful = [...comments].sort((left, right) => right.helpfulCount - left.helpfulCount);
    return Response.json({ comments: byHelpful, pinned });
  }

  return Response.json({ comments, pinned });
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/courses/[courseId]/comments">,
): Promise<Response> {
  const { courseId } = await ctx.params;

  const body = await readJsonBody(request);
  if (!body) return validationError("Request body must be a JSON object");

  const result = await createComment({ ...body, courseId });
  if (!result.ok) return errorResponse(result.error);

  return Response.json({ comment: result.data }, { status: 201 });
}