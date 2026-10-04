import Image from "next/image";
import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { formatCount, formatDurationLong, formatRating } from "@/domain/format";
import { levelLabels } from "@/domain/catalogFilter";
import { courseActionLabel, coursePlayerHref } from "@/domain/progress";
import type { CourseSummary } from "@/domain/types";

import { CourseCardProgress } from "./courseCardProgress";
import { StatusPill } from "./statusPill";

export interface CourseCardProps {
  course: CourseSummary;
  /** First row of cards is `preload`ed so the LCP image is not discovered late. */
  eager?: boolean;
}

/**
 * One course in the catalogue grid.
 *
 * A Server Component: the only thing here that needs the client is navigation,
 * and `next/link` already prefetches and handles that. The resume-aware CTA is
 * a `Link` rather than a client island — an island would add hydration for a
 * label that is already computed on the server.
 *
 * The whole card is not a link. Only the title and the artwork are, so the
 * "Resume" button stays a distinct target and a stray click near the progress
 * bar cannot navigate out from under the user.
 */
export function CourseCard({ course, eager = false }: CourseCardProps) {
  const href = coursePlayerHref(course);

  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-xs transition-shadow duration-micro hover:shadow-md">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="relative block aspect-video overflow-hidden bg-surface-sunken"
      >
        <Image
          src={course.posterUrl}
          alt=""
          fill
          preload={eager}
          loading={eager ? undefined : "lazy"}
          placeholder="blur"
          blurDataURL={course.posterBlurDataUrl}
          sizes="(min-width: 1280px) 24rem, (min-width: 640px) 45vw, 92vw"
          className="object-cover transition-transform duration-layout group-hover:scale-[1.03]"
        />
        <span className="absolute left-3 top-3">
          <StatusPill status={course.status} className="bg-surface/95 backdrop-blur-sm" />
        </span>
        <span className="absolute right-3 top-3 rounded-chip bg-ink-950/60 px-2 py-1 text-micro font-medium text-white backdrop-blur-sm">
          {levelLabels[course.level]}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1.5">
          <Link
            href={href}
            className="rounded-xs text-title-sm font-semibold text-text-primary hover:text-brand-700 focus-visible:outline-none focus-visible:underline"
          >
            <span className="clampTwo">{course.title}</span>
          </Link>
          <p className="clampTwo text-caption text-text-secondary">{course.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Avatar src={course.instructor.avatarUrl} name={course.instructor.name} size="sm" />
          <div className="flex min-w-0 flex-col">
            <span className="clampOne text-caption font-medium text-text-primary">
              {course.instructor.name}
            </span>
            <span className="clampOne text-caption text-text-tertiary">
              {course.instructor.headline}
            </span>
          </div>
        </div>

        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-text-secondary">
          <div className="inline-flex items-center gap-1.5">
            <dt className="sr-only">Lessons</dt>
            <Icon name="list" size={14} />
            <dd data-numeric>{course.lessonCount}</dd>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <dt className="sr-only">Total duration</dt>
            <Icon name="clock" size={14} />
            <dd data-numeric>{formatDurationLong(course.totalDurationSeconds)}</dd>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <dt className="sr-only">Rating</dt>
            <Icon name="star" size={14} />
            <dd data-numeric>
              {formatRating(course.rating)}
              <span className="text-text-tertiary"> ({formatCount(course.ratingCount)})</span>
            </dd>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <dt className="sr-only">Enrolled learners</dt>
            <Icon name="users" size={14} />
            <dd data-numeric>{formatCount(course.enrolledCount)}</dd>
          </div>
        </dl>

        <div className="mt-auto flex flex-col gap-3 pt-1">
          <CourseCardProgress
            progressPercent={course.progressPercent}
            completedLessons={course.completedLessons}
            totalLessons={course.lessonCount}
            status={course.status}
          />

          <LinkButton href={href} block iconRight="chevronRight" size="md">
            {courseActionLabel(course.status)}
          </LinkButton>
        </div>
      </div>
    </article>
  );
}