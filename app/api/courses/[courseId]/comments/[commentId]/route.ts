/**
 * `PATCH /api/courses/[courseId]/comments/[commentId]` — toggle the helpful flag.
 *
 * `200` with the updated comment rather than `204`: the client needs the new count to
 * render, and returning it removes a follow-up read from every tap.
 */

import { errorResponse, readJsonBody, validationError } from "../../../../http-adapter";

import { toggleCommentHelpful } from "@/server/cqrs/commands/toggleCommentHelpful";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/courses/[courseId]/comments/[commentId]">,
): Promise<Response> {
  const { courseId, commentId } = await ctx.params;

  const body = await readJsonBody(request);
  if (!body) return validationError("Request body must be a JSON object");

  const result = await toggleCommentHelpful({ ...body, courseId, commentId });
  if (!result.ok) return errorResponse(result.error);

  return Response.json({ comment: result.data });
}