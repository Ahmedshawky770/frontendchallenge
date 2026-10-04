"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Icon } from "@/components/ui/icon";
import { SegmentedControl } from "@/components/ui/segmentedControl";
import { toSearchParams, type CatalogFilter, type CatalogStatusFilter } from "@/domain/catalogFilter";

export interface CatalogFiltersProps {
  filter: CatalogFilter;
}

const statusOptions: { value: CatalogStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "not-started", label: "Not started" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

/** Long enough to avoid a navigation per keystroke, short enough to feel live. */
const searchDebounceMs = 250;

/**
 * The catalogue's only client island.
 *
 * Filter state lives in the URL, not in React state: the server re-renders the
 * filtered grid, so a filtered catalogue is shareable, bookmarkable, and
 * correct before hydration. This component's whole job is to move the user
 * between those URLs.
 *
 * It is a real `<form method="get">` with named controls. With JavaScript
 * disabled, typing and pressing Enter submits it and the browser navigates to
 * the same URL this island would have pushed — there is no second code path to
 * keep in sync, and no layout that depends on hydration having happened.
 */
export function CatalogFilters({ filter }: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(filter.query);
  const isEditingRef = useRef(false);

  /**
   * Adopt a value that arrived from the URL (back button, or the "clear
   * filters" link) — but never while the user is mid-word, or the input would
   * erase characters as they type.
   */
  useEffect(() => {
    if (!isEditingRef.current) setQuery(filter.query);
  }, [filter.query]);

  function navigate(next: CatalogFilter) {
    const search = toSearchParams(next);
    startTransition(() => {
      router.replace(search ? `${pathname}${search}` : pathname, { scroll: false });
    });
  }

  // Debounced search: one navigation per pause, not one per keypress.
  useEffect(() => {
    if (query === filter.query) return;

    const timer = setTimeout(() => navigate({ ...filter, query }), searchDebounceMs);
    return () => clearTimeout(timer);
    // `navigate` closes over `filter`, which changes on every server render.
    // Depending on the query alone keeps the timer from resetting mid-typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Without JavaScript the browser performs this GET navigation itself.
    event.preventDefault();
    navigate({ ...filter, query });
  }

  return (
    <form
      action="/"
      method="get"
      onSubmit={handleSubmit}
      aria-busy={isPending}
      className="flex flex-col gap-3"
    >
      <input type="hidden" name="category" value={filter.category} />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative min-w-0 flex-1 md:max-w-sm">
          <label htmlFor="catalog-search" className="sr-only">
            Search courses by title, description or instructor
          </label>
          <Icon
            name="search"
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
          />
          <input
            id="catalog-search"
            name="q"
            type="search"
            autoComplete="off"
            placeholder="Search courses or instructors"
            value={query}
            onChange={(event) => {
              isEditingRef.current = true;
              setQuery(event.target.value);
            }}
            onBlur={() => {
              isEditingRef.current = false;
              setQuery((current) => current.trim().slice(0, 80));
            }}
            className="h-11 w-full rounded-control border border-border bg-surface pl-10 pr-10 text-body-sm text-text-primary shadow-xs outline-none transition-colors duration-micro placeholder:text-text-tertiary focus:border-brand-500"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                navigate({ ...filter, query: "" });
              }}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-xs text-text-tertiary transition-colors duration-micro hover:bg-neutral-100 hover:text-text-primary"
            >
              <Icon name="x" size={15} />
            </button>
          ) : null}
        </div>

        <SegmentedControl
          name="status"
          legend="Filter by course status"
          options={statusOptions}
          value={filter.status}
          onChange={(status) => navigate({ ...filter, status })}
        />
      </div>

      {/* Implicit form submission needs a submit control when the form has more
          than one field; this one stays out of the visual design. */}
      <button type="submit" className="sr-only">
        Apply filters
      </button>

      <div
        aria-hidden="true"
        className={`h-0.5 overflow-hidden rounded-full bg-brand-100 transition-opacity duration-micro ${
          isPending ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="block h-full w-1/3 animate-pulse rounded-full bg-brand-500" />
      </div>
    </form>
  );
}