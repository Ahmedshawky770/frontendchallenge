import { Skeleton, SkeletonCard, SkeletonText } from "@/components/ui/skeleton";

/**
 * Catalogue loading skeleton.
 *
 * Mirrors the real geometry — header bar, title block, toolbar, three-column
 * card grid — so a filter navigation settles into place instead of jumping.
 * Marked `aria-busy` with a label rather than relying on the pulse alone, so a
 * screen reader announces the wait.
 */
export default function Loading() {
  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex h-app-bar w-full max-w-shell items-center px-4 sm:px-6">
          <Skeleton className="size-8 rounded-control" />
          <Skeleton className="ml-2 h-4 w-32" />
        </div>
      </div>

      <main className="mx-auto w-full max-w-shell flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <div className="flex flex-col gap-6 lg:gap-8" aria-busy="true" aria-label="Loading courses">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-full max-w-xl" />
            <SkeletonText lines={2} className="max-w-xl" />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Skeleton className="h-11 w-full md:max-w-sm" />
              <Skeleton className="h-11 w-64" />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-9 w-24 shrink-0 rounded-full" />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">
            {Array.from({ length: 6 }, (_, index) => (
              <SkeletonCard key={index}>
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <div className="flex items-center gap-2">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-11 w-full" />
              </SkeletonCard>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}