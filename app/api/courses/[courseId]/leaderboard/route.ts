/**
 * `GET /api/courses/[courseId]/leaderboard` — ranked cohort, shortest cache TTL of the
 * app (30 s) because it moves on every lesson completion.
 *
 * `limit` is clamped rather than rejected: an out-of-range number from a client is a
 * bad request for *them*, not a reason to fail the read.
 */

import { errorResponse, readIntParam } from "../../../http-adapter";

import { getLeaderboard, resolveCourse } from "@/server/cqrs/queries/courseQueries";

const defaultLimit = 5;
const maxLimit = 50;

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/courses/[courseId]/leaderboard">,
): Promise<Response> {
  const { courseId } = await ctx.params;
  const { searchParams } = new URL(request.url);

  const course = await resolveCourse(courseId);
  if (!course) return errorResponse({ code: "not_found", message: "Unknown course" });

  const requested = readIntParam(searchParams, "limit", defaultLimit);
  const entries = await getLeaderboard(course, Math.min(Math.max(requested, 1), maxLimit));

  return Response.json({ entries });
}