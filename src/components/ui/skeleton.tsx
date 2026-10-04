import type { ReactNode } from "react";

/** Loading placeholder. Uses a slow pulse so it never flashes on fast loads. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-control bg-neutral-200 ${className}`} />;
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={`h-4 ${index === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ children }: { children?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-xs">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="flex flex-col gap-3 p-4">{children ?? <SkeletonText />}</div>
    </div>
  );
}