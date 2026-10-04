/**
 * Catalogue query handlers (CQRS read side).
 *
 * Query handlers are read-only, return serialisable DTOs, and are the only
 * callers of `cacheAside`. They never write, so they can be cached aggressively
 * and called from anywhere without a transaction or a lock.
 */

import { cacheAside, cacheKeys, cacheTtl } from "@/server/cache/cacheAside";
import {
  listCourseSummaries,
  type CatalogueFilter,
} from "@/server/repositories/courseRepository";

import type { CourseCategory, CourseStatus, CourseSummary } from "@/domain/types";

export interface CatalogueResult {
  courses: CourseSummary[];
  total: number;
  categories: { value: CourseCategory; label: string; count: number }[];
  generatedAt: string;
}

const categoryLabels: Record<CourseCategory, string> = {
  engineering: "Engineering",
  design: "Design",
  data: "Data & AI",
  business: "Business",
  marketing: "Marketing",
  security: "Security",
};

export async function listCourses(filter: CatalogueFilter): Promise<CatalogueResult> {
  const { value: courses } = await cacheAside({
    key: cacheKeys.catalogue(filter.category, filter.query),
    ttlSeconds: cacheTtl.catalogue,
    load: () => listCourseSummaries(filter),
  });

  // Counts come from the unfiltered set so a category chip never disappears when
  // it is filtered out — the user must always be able to click their way back.
  const { value: allCourses } = await cacheAside({
    key: cacheKeys.catalogue(),
    ttlSeconds: cacheTtl.catalogue,
    load: () => listCourseSummaries({}),
  });

  const categories = (Object.keys(categoryLabels) as CourseCategory[]).map((value) => ({
    value,
    label: categoryLabels[value],
    count: allCourses.filter((course) => course.category === value).length,
  }));

  return {
    courses,
    total: courses.length,
    categories,
    generatedAt: new Date().toISOString(),
  };
}

export const catalogueStatusLabels: Record<CourseStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Completed",
};