import Image from "next/image";
import Link from "next/link";

import { ProgressBar } from "@/components/ui/progress";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { coursePlayerHref } from "@/domain/progress";
import type { CourseSummary } from "@/domain/types";

/**
 * "Continue where you left off" banner.
 *
 * Rendered only when something is in progress. A banner that says "nothing to
 * resume" is worse than no banner, so the parent renders `null` in that case
 * rather than passing an empty state down here.
 */
export function ResumeBanner({ course }: { course: CourseSummary }) {
  const href = coursePlayerHref(course);

  return (
    <section
      aria-labelledby="resume-heading"
      className="flex items-center gap-4 overflow-hidden rounded-card border border-border bg-surface p-4 shadow-xs sm:gap-5 sm:p-5"
    >
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        /* A small thumbnail on phones, larger from `sm`. The banner sits above the
           fold on every breakpoint, so its image must not push the catalogue
           grid below it — a full-width 16:9 here would cost a third of a phone
           viewport for something the learner has already seen on the card. */
        className="relative size-20 shrink-0 overflow-hidden rounded-control bg-surface-sunken sm:size-32"
      >
        <Image
          src={course.posterUrl}
          alt=""
          fill
          // Directly under the hero copy, so this is the catalogue's LCP element —
          // it has to be discovered from the document head, not lazily.
          preload
          placeholder="blur"
          blurDataURL={course.posterBlurDataUrl}
          sizes="(min-width: 640px) 8rem, 5rem"
          className="object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="inline-flex items-center gap-1.5 text-micro font-semibold uppercase tracking-[0.08em] text-brand-700">
          <Icon name="play" size={12} />
          Continue learning
        </span>

        <h2 id="resume-heading" className="text-title-sm font-semibold text-text-primary">
          <Link href={href} className="clampTwo hover:text-brand-700">
            {course.title}
          </Link>
        </h2>

        <div className="flex items-center gap-3">
          <ProgressBar
            value={course.progressPercent}
            size="sm"
            label={`Progress through ${course.title}`}
            className="max-w-xs"
          />
          <span className="shrink-0 text-caption font-medium text-text-secondary" data-numeric>
            {course.progressPercent}% · {course.completedLessons} of {course.lessonCount} lessons
          </span>
        </div>
      </div>

      {/* Icon-only on phones so the row keeps its height, with the label kept in
          the accessibility tree — the visible action never disappears. */}
      <LinkButton href={href} variant="secondary" iconRight="chevronRight" className="shrink-0">
        <span className="sr-only sm:not-sr-only">Resume</span>
      </LinkButton>
    </section>
  );
}