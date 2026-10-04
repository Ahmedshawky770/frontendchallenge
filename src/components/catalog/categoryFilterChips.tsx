import Link from "next/link";

import { catalogHref, type CatalogFilter, type CatalogCategoryFilter } from "@/domain/catalogFilter";
import type { CourseCategory } from "@/domain/types";

export interface CategoryFilterChipsProps {
  categories: { value: CourseCategory; label: string; count: number }[];
  active: CatalogCategoryFilter;
  /**
   * The rest of the current filter, preserved when a chip is chosen — switching
   * category should not silently drop the user's search text.
   */
  currentFilter: CatalogFilter;
}

/**
 * Category filter, rendered as links.
 *
 * Real `Link`s, not buttons that push history: each chip is a shareable,
 * prefetchable, middle-clickable URL, and the whole control keeps working with
 * JavaScript disabled. Counts come from the unfiltered catalogue so a chip never
 * disappears when the current category is already selected.
 */
export function CategoryFilterChips({ categories, active, currentFilter }: CategoryFilterChipsProps) {
  const hrefFor = (value: CatalogCategoryFilter) =>
    catalogHref({ ...currentFilter, category: value });

  const totalCount = categories.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <nav aria-label="Filter courses by category">
      <ul className="scrollStrip flex items-center gap-2 pb-1">
        <li className="shrink-0">
          <Chip href={hrefFor("all")} active={active === "all"} label="All" count={totalCount} />
        </li>
        {categories
          .filter((entry) => entry.count > 0)
          .map((category) => (
            <li key={category.value} className="shrink-0">
              <Chip
                href={hrefFor(category.value)}
                active={active === category.value}
                label={category.label}
                count={category.count}
              />
            </li>
          ))}
      </ul>
    </nav>
  );
}

function Chip({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={[
        "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-caption font-medium transition-colors duration-micro",
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-border bg-surface text-text-secondary hover:border-border-strong hover:bg-neutral-50 hover:text-text-primary",
      ].join(" ")}
    >
      {label}
      <span
        data-numeric
        className={`rounded-full px-1.5 py-px text-micro ${
          active ? "bg-white/20 text-white" : "bg-neutral-100 text-text-tertiary"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}