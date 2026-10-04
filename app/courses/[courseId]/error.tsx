"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

/**
 * Route-level error boundary.
 *
 * Next 16 renamed the `reset` prop to `retry`; `retry` re-renders the segment
 * without a full page load, which is what a transient data failure needs.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-shell flex-1 items-center justify-center px-4 py-16">
      <Card padding="lg" className="w-full max-w-md text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-danger-50 text-danger-700">
          <Icon name="warning" size={24} />
        </span>
        <h1 className="mt-4 text-title font-semibold text-text-primary">
          This lesson could not be loaded
        </h1>
        <p className="mt-2 text-body-sm text-text-secondary">
          {error.message || "An unexpected error interrupted the request. Your progress is safe."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={retry}>Try again</Button>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-control border border-border-strong px-4 text-body-sm font-medium text-neutral-800 transition-colors duration-micro hover:bg-neutral-50"
          >
            Back to courses
          </Link>
        </div>
      </Card>
    </main>
  );
}