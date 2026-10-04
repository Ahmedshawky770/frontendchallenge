import Link from "next/link";

import { Icon } from "@/components/ui/icon";

/**
 * The catalogue's site header.
 *
 * Scoped to the catalogue route rather than the root layout on purpose: the
 * player page is a focused, single-task surface with its own breadcrumb and a
 * sticky video column, and a persistent marketing-style header above it would
 * eat vertical space the video needs. One shell per route is the cheaper,
 * clearer trade — and it keeps the player's layout maths (`--app-bar-height`)
 * describing something that is actually on screen.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-app-bar w-full max-w-shell items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-control pr-2 text-body-sm font-semibold text-text-primary"
        >
          <span className="flex size-8 items-center justify-center rounded-control bg-brand-600 text-white">
            <Icon name="play" size={15} />
          </span>
          <span className="clampOne">Course Platform</span>
        </Link>

        <nav aria-label="Main" className="ml-auto">
          <ul className="flex items-center gap-1">
            <li>
              <Link
                href="/"
                aria-current="page"
                className="inline-flex h-9 items-center rounded-control bg-brand-50 px-3 text-caption font-medium text-brand-700"
              >
                Catalogue
              </Link>
            </li>
            {/* Hidden on phones: two nav labels plus the brand do not fit in 390 px,
                and the brand is the one that must stay legible. */}
            <li className="hidden sm:block">
              <Link
                href="/courses/advanced-typescript-patterns"
                className="inline-flex h-9 items-center rounded-control px-3 text-caption font-medium text-text-secondary transition-colors duration-micro hover:bg-neutral-100 hover:text-text-primary"
              >
                Sample player
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}