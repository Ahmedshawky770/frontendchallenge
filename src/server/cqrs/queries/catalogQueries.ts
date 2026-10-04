/**
 * Catalogue query handlers (CQRS read side).
 *
 * Query handlers are read-only, return serialisable DTOs, and are the only
 * callers of `cacheAside`. They never write, so they can be cached aggressively
 * and called from anywhere without a transaction or a lock.
 *
 * The filter is expected to already be normalised by `parseCatalogFilter` —
 * that is what keeps the cache-key space finite.
 */

import { cacheAside, cacheKeys, cacheTtl } from "@/server/cache/cacheAside";
import { listCourseSummaries } from "@/server/repositories/courseRepository";

import { pickResumeCourse } from "@/domain/progress";
import type { CatalogFilter } from "@/domain/catalogFilter";
import type { CourseCategory, CourseStatus, CourseSummary } from "@/domain/types";

export interface CatalogueResult {
  /** The grid, already filtered. */
  courses: CourseSummary[];
  /** How many courses matched. */
  total: number;
  /** Size of the whole catalogue, so the UI can say "3 of 6 courses". */
  availableTotal: number;
  /** Chip counts, always derived from the unfiltered set. */
  categories: { value: CourseCategory; label: string; count: number }[];
  /** Most recently updated in-progress course, or null when nothing is started. */
  resumeCourse: CourseSummary | null;
  generatedAt: string;
}

const unfiltered: CatalogFilter = { category: "all", status: "all", query: "" };

const categoryLabels: Record<CourseCategory, string> = {
  engineering: "Engineering",
  design: "Design",
  data: "Data & AI",
  business: "Business",
  marketing: "Marketing",
  security: "Security",
};

/**
 * One handler for the whole catalogue screen.
 *
 * The page needs four things — the filtered grid, per-category counts, the
 * unfiltered total and a resume candidate — and three of them are derived from
 * the same unfiltered read. Aggregating here rather than in the page means one
 * handler, one cache contract, and no chance of the components disagreeing
 * about what "6 courses" means.
 *
 * When the filter *is* the unfiltered filter the two reads collapse into one
 * cache entry, so the common first paint is a single load.
 */
export async function listCourses(filter: CatalogFilter): Promise<CatalogueResult> {
  const [filteredResult, allResult] = await Promise.all([
    cacheAside({
      key: cacheKeys.catalogue(filter.category, filter.status, filter.query),
      ttlSeconds: cacheTtl.catalogue,
      load: () => listCourseSummaries(filter),
    }),
    cacheAside({
      key: cacheKeys.catalogue(),
      ttlSeconds: cacheTtl.catalogue,
      load: () => listCourseSummaries(unfiltered),
    }),
  ]);

  // Counts come from the unfiltered set so a category chip never disappears when
  // it is filtered out — the user must always be able to click their way back.
  const categories = (Object.keys(categoryLabels) as CourseCategory[]).map((value) => ({
    value,
    label: categoryLabels[value],
    count: allResult.value.filter((course) => course.category === value).length,
  }));

  return {
    courses: filteredResult.value,
    total: filteredResult.value.length,
    availableTotal: allResult.value.length,
    categories,
    resumeCourse: pickResumeCourse(allResult.value),
    generatedAt: new Date().toISOString(),
  };
}

export const catalogueStatusLabels: Record<CourseStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Completed",
};