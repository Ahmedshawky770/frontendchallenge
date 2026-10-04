import { CourseGrid } from "./courseGrid";
import { CatalogFilters } from "./catalogFilters";
import { CategoryFilterChips } from "./categoryFilterChips";
import { EmptyCatalogState } from "./emptyCatalogState";
import { ResumeBanner } from "./resumeBanner";
import { SiteHeader } from "./siteHeader";

import { catalogHref, isDefaultFilter, type CatalogFilter } from "@/domain/catalogFilter";
import { formatInteger } from "@/domain/format";
import type { CourseCategory, CourseSummary } from "@/domain/types";

export interface CatalogPageProps {
  /** The already-filtered grid. Filtering happened on the server. */
  courses: CourseSummary[];
  /** Counts per category, always computed from the unfiltered catalogue. */
  categories: { value: CourseCategory; label: string; count: number }[];
  filter: CatalogFilter;
  /** Size of the whole catalogue, used for the "N courses" summary line. */
  availableCount: number;
  /** Most recently updated in-progress course, or null when there is none. */
  resumeCourse: CourseSummary | null;
}

/**
 * Catalogue layout.
 *
 * A Server Component tree. The only client island is `CatalogFilters`, because
 * every other part of this page is either static markup or a `Link` — the
 * course grid ships zero JavaScript of its own.
 */
export function CatalogPage({
  courses,
  categories,
  filter,
  availableCount,
  resumeCourse,
}: CatalogPageProps) {
  const filtered = !isDefaultFilter(filter);
  const categoryLabel = categories.find((entry) => entry.value === filter.category)?.label ?? null;

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <main id="main-content" className="mx-auto w-full max-w-shell flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <div className="flex flex-col gap-6 lg:gap-8">
          <section aria-labelledby="catalog-heading" className="flex flex-col gap-2">
            <p className="text-caption font-medium uppercase tracking-[0.08em] text-brand-700">
              Course catalogue
            </p>
            <h1
              id="catalog-heading"
              className="max-w-2xl text-display-lg font-bold tracking-tight text-text-primary"
            >
              Learn something that ships
            </h1>
            <p className="measure text-body text-text-secondary">
              {formatInteger(availableCount)} courses, each one ending in a working piece of software.
              Pick up where you left off or start something new.
            </p>
          </section>

          {resumeCourse ? <ResumeBanner course={resumeCourse} /> : null}

          <section aria-labelledby="catalog-toolbar-heading" className="flex flex-col gap-3">
            <h2 id="catalog-toolbar-heading" className="sr-only">
              Filter and search courses
            </h2>

            <CatalogFilters filter={filter} />

            <CategoryFilterChips
              categories={categories}
              active={filter.category}
              currentFilter={filter}
            />
          </section>

          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-body-sm font-medium text-text-primary" data-numeric aria-live="polite">
              {filtered
                ? `${formatInteger(courses.length)} of ${formatInteger(availableCount)} courses`
                : `${formatInteger(courses.length)} courses`}
            </p>
            <p className="text-caption text-text-tertiary">
              {filtered ? "Filtered view" : "Sorted by most recently updated"}
            </p>
          </div>

          {courses.length > 0 ? (
            <CourseGrid courses={courses} />
          ) : (
            <EmptyCatalogState
              query={filter.query}
              categoryLabel={categoryLabel}
              statusLabel={statusLabel(filter.status)}
              availableCount={availableCount}
              clearHref={catalogHref({ category: "all", status: "all", query: "" })}
            />
          )}
        </div>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-shell flex-col gap-1 px-4 py-6 text-caption text-text-tertiary sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Course Platform — a Next.js App Router reference build.</p>
          <p>Progress is stored in memory and resets when the server restarts.</p>
        </div>
      </footer>
    </div>
  );
}

function statusLabel(status: CatalogFilter["status"]): string | null {
  if (status === "all") return null;
  const labels = {
    "not-started": "not started",
    "in-progress": "in progress",
    completed: "completed",
  } as const;
  return labels[status];
}