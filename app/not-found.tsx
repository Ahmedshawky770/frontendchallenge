import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-shell flex-1 items-center justify-center px-4 py-20">
      <Card padding="lg" className="w-full max-w-md text-center">
        <p className="text-micro font-semibold uppercase tracking-[0.08em] text-text-tertiary">
          404
        </p>
        <h1 className="mt-2 text-title-lg font-semibold text-text-primary">Page not found</h1>
        <p className="mt-2 text-body-sm text-text-secondary">
          The page you were looking for does not exist or has moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-control bg-brand-600 px-4 text-body-sm font-medium text-white transition-colors duration-micro hover:bg-brand-700"
        >
          <Icon name="arrowLeft" size={18} />
          Back to courses
        </Link>
      </Card>
    </main>
  );
}