/**
 * `GET /api/courses/[courseId]` — the read model the player renders from.
 *
 * `courseId` is resolved by uuid first and by slug second, so a course stays
 * linkable by its human-readable path. `params` is a Promise in Next 16 and must be
 * awaited before it can be destructured.
 */

import { errorResponse } from "../../http-adapter";

import { getCourseDetail, resolveCourse } from "@/server/cqrs/queries/courseQueries";

export async function GET(_request: Request, ctx: RouteContext<"/api/courses/[courseId]">): Promise<Response> {
  const { courseId } = await ctx.params;

  const course = await resolveCourse(courseId);
  if (!course) return errorResponse({ code: "not_found", message: "Unknown course" });

  return Response.json(await getCourseDetail(course));
}