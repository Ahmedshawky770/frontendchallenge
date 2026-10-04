import type { Metadata } from "next";

import { CatalogPage } from "@/components/catalog/catalogPage";
import { parseCatalogFilter } from "@/domain/catalogFilter";
import { listCourses } from "@/server/cqrs/queries/catalogQueries";

export const metadata: Metadata = {
  title: "Course catalogue",
  description:
    "Browse every course on the platform, see how far you have got in each one, and jump back in where you left off.",
};

/**
 * Catalogue route.
 *
 * Filter state arrives in the URL (`?category=&status=&q=`), so this page renders
 * per request rather than baking one variant at build time. That is the
 * deliberate trade: a filtered catalogue becomes shareable and keeps working
 * without JavaScript, which is worth more here than a fully static prerender.
 *
 * The read is cache-aside, so a filtered render is a map lookup on a warm cache
 * rather than a query.
 */
export default async function CatalogRoute({ searchParams }: PageProps<"/">) {
  const filter = parseCatalogFilter(await searchParams);
  const { courses, categories, availableTotal, resumeCourse } = await listCourses(filter);

  return (
    <CatalogPage
      courses={courses}
      categories={categories}
      filter={filter}
      availableCount={availableTotal}
      resumeCourse={resumeCourse}
    />
  );
}