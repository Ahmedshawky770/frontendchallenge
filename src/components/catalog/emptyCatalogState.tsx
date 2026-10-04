import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export interface EmptyCatalogStateProps {
  /** Echoes the active filters back so the user can see what excluded everything. */
  query: string;
  categoryLabel: string | null;
  statusLabel: string | null;
  /** How many courses exist without the current filters. */
  availableCount: number;
  clearHref: string;
}

/**
 * Shown when the filters match nothing.
 *
 * An empty grid with no explanation reads as a broken page, so this states which
 * filters are active and offers the one action that resolves it.
 */
export function EmptyCatalogState({
  query,
  categoryLabel,
  statusLabel,
  availableCount,
  clearHref,
}: EmptyCatalogStateProps) {
  const activeFilters = [
    query ? `search “${query}”` : null,
    categoryLabel,
    statusLabel,
  ].filter((entry): entry is string => Boolean(entry));

  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-border-strong bg-surface px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon name="search" size={22} />
      </span>

      <div className="flex flex-col gap-1.5">
        <h2 className="text-title-sm font-semibold text-text-primary">No courses match</h2>
        <p className="measure text-body-sm text-text-secondary">
          {activeFilters.length > 0 ? (
            <>
              Nothing matches {activeFilters.join(" · ")}.
              {availableCount > 0 ? ` Clear the filters to see all ${availableCount} courses.` : null}
            </>
          ) : (
            <>The catalogue is empty right now. Check back shortly.</>
          )}
        </p>
      </div>

      {activeFilters.length > 0 ? (
        <LinkButton href={clearHref} variant="secondary" iconLeft="rotate">
          Clear filters
        </LinkButton>
      ) : null}
    </div>
  );
}