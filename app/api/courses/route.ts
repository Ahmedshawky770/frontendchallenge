/**
 * `GET /api/courses` — catalogue read model.
 *
 * Thin adapter: it reads the query params, hands them to the parser that
 * allow-lists the values, then passes the result to the query handler, which
 * owns the cache-aside read. `202`/`404` do not apply — an empty catalogue is a
 * `200` with `courses: []`.
 *
 * Parsing is not optional here: filter values land in the cache key, so raw
 * strings from the request would let a caller mint unbounded cache entries.
 */

import { listCourses } from "@/server/cqrs/queries/catalogQueries";
import { parseCatalogFilter } from "@/domain/catalogFilter";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);

  const result = await listCourses(
    parseCatalogFilter({
      category: searchParams.get("category") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      q: searchParams.get("q") ?? undefined,
    }),
  );

  return Response.json(result);
}