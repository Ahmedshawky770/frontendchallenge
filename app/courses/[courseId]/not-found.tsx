import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { courses } from "@/data/courses";

/**
 * Course-level 404. The player route calls `notFound()` when a slug cannot be
 * resolved, which is also what a tampered `?lesson=` deep link effectively is.
 */
export default async function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-shell flex-1 items-center justify-center px-4 py-16">
      <Card padding="lg" className="w-full max-w-md text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <Icon name="search" size={24} />
        </span>
        <h1 className="mt-4 text-title font-semibold text-text-primary">Course not found</h1>
        <p className="mt-2 text-body-sm text-text-secondary">
          That course or lesson does not exist. It may have been unpublished, or the link may be
          out of date.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-control bg-brand-600 px-4 text-body-sm font-medium text-white transition-colors duration-micro hover:bg-brand-700"
        >
          <Icon name="arrowLeft" size={18} />
          Browse all {courses.length} courses
        </Link>
      </Card>
    </main>
  );
}