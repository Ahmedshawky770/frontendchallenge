/**
 * `/api/courses/[courseId]/progress` — read the progress read model, or mutate it.
 *
 * The `PATCH` response carries the freshly recomputed metrics rather than just an
 * acknowledgement, because the client's next action is to repaint a progress ring and
 * a percentage derived from the request would eventually disagree with the store.
 */

import { errorResponse, readJsonBody, validationError } from "../../../http-adapter";

import { toggleLessonProgress } from "@/server/cqrs/commands/toggleLessonProgress";
import { getCourseProgress } from "@/server/cqrs/queries/courseQueries";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/courses/[courseId]/progress">,
): Promise<Response> {
  const { courseId } = await ctx.params;

  const progress = await getCourseProgress(courseId);
  if (!progress) return errorResponse({ code: "not_found", message: "Unknown course" });

  return Response.json(progress);
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/courses/[courseId]/progress">,
): Promise<Response> {
  const { courseId } = await ctx.params;

  const body = await readJsonBody(request);
  if (!body) return validationError("Request body must be a JSON object");

  const result = await toggleLessonProgress({ ...body, courseId });
  if (!result.ok) return errorResponse(result.error);

  return Response.json(result.data);
}