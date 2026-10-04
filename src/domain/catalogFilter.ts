/**
 * Catalogue filter parsing and normalisation.
 *
 * Pure functions, no framework imports: the same rules can run in a Server
 * Component, a route handler or a unit test.
 *
 * Validating here rather than at the query handler is deliberate. Filter values
 * arrive from the URL, and the filter values are interpolated into cache keys
 * (`courses:list:<category>:<query>`). Passing raw strings straight through would
 * let a caller mint an unbounded number of cache entries — one request per
 * invented `?q=` — which turns a shared cache into a memory-exhaustion vector.
 * An allow-list plus a length cap keeps the key space finite.
 */

import type { CourseCategory, CourseStatus } from "./types";

export const catalogCategories = [
  "engineering",
  "design",
  "data",
  "business",
  "marketing",
  "security",
] as const satisfies readonly CourseCategory[];

export const catalogStatuses = ["not-started", "in-progress", "completed"] as const satisfies readonly CourseStatus[];

/** "all" is a UI sentinel meaning "do not filter", not a stored value. */
export const catalogSentinels = ["all"] as const;

export type CatalogCategoryFilter = CourseCategory | "all";
export type CatalogStatusFilter = CourseStatus | "all";

/** Long enough for any real course title, short enough to bound the cache key. */
export const maxQueryLength = 80;

export interface CatalogFilter {
  category: CatalogCategoryFilter;
  status: CatalogStatusFilter;
  query: string;
}

export interface RawCatalogParams {
  category?: string | string[] | undefined;
  status?: string | string[] | undefined;
  q?: string | string[] | undefined;
}

/** Collapses `?a=1&a=2` to a single value; only the first is meaningful. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseCategory(value: string | string[] | undefined): CatalogCategoryFilter {
  const raw = first(value)?.trim().toLowerCase();
  return catalogCategories.find((entry) => entry === raw) ?? "all";
}

export function parseStatus(value: string | string[] | undefined): CatalogStatusFilter {
  const raw = first(value)?.trim().toLowerCase();
  return catalogStatuses.find((entry) => entry === raw) ?? "all";
}

export function parseQuery(value: string | string[] | undefined): string {
  return (first(value) ?? "").trim().slice(0, maxQueryLength);
}

export function parseCatalogFilter(params: RawCatalogParams): CatalogFilter {
  return {
    category: parseCategory(params.category),
    status: parseStatus(params.status),
    query: parseQuery(params.q),
  };
}

export function isDefaultFilter(filter: CatalogFilter): boolean {
  return filter.category === "all" && filter.status === "all" && filter.query === "";
}

/**
 * Serialises a filter back into search params, omitting defaults.
 *
 * Omitting rather than emitting `category=all` keeps filtered URLs short and
 * means "no filter" has exactly one canonical URL, which matters when the same
 * catalogue is linked from the player header.
 */
export function toSearchParams(filter: CatalogFilter): string {
  const params = new URLSearchParams();
  if (filter.category !== "all") params.set("category", filter.category);
  if (filter.status !== "all") params.set("status", filter.status);
  if (filter.query) params.set("q", filter.query);

  const serialised = params.toString();
  return serialised ? `?${serialised}` : "";
}

/**
 * Absolute catalogue path for a filter — the only thing that should build one.
 *
 * The leading slash is load-bearing. `toSearchParams` returns `""` when every
 * filter is at its default, and an `href=""` resolves to the *current* URL, so a
 * "Clear filters" link built that way silently reloads the page it is on instead
 * of clearing anything. Keeping the prefix here means no call site can forget it.
 */
export function catalogHref(filter: CatalogFilter): string {
  return `/${toSearchParams(filter)}`;
}

/** Switches one dimension of the current filter, leaving the others untouched. */
export function withFilterValue(
  filter: CatalogFilter,
  patch: Partial<CatalogFilter>,
): CatalogFilter {
  return { ...filter, ...patch };
}

export const levelLabels = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
} as const;