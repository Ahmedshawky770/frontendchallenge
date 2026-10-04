import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { courses } from "@/data/courses";
import { resolveEntryLesson } from "@/domain/progress";

import { CoursePlayer } from "@/components/player/coursePlayer";
import { resolveCourse, getCourseDetail, getLessonComments, getLeaderboard } from "@/server/cqrs/queries/courseQueries";

/** Pre-render one static shell per course; the read model itself is cache-aware. */
export function generateStaticParams() {
  return courses.map((course) => ({ courseId: course.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/courses/[courseId]">): Promise<Metadata> {
  const { courseId } = await params;
  const course = await resolveCourse(courseId);

  if (!course) return { title: "Course not found" };

  return {
    title: `${course.title} · Course Player`,
    description: course.subtitle,
  };
}

/**
 * Player route.
 *
 * A Server Component that resolves the whole read model before any client
 * JavaScript runs: course, flattened lessons, progress, comments and
 * leaderboard all arrive as serialisable props, so the island hydrates with
 * complete data and never issues a waterfall of client fetches.
 */
export default async function CoursePlayerPage({ params, searchParams }: PageProps<"/courses/[courseId]">) {
  const [{ courseId }, query] = await Promise.all([params, searchParams]);

  const course = await resolveCourse(courseId);
  if (!course) notFound();

  const detail = await getCourseDetail(course);
  const { comments, pinned } = await getLessonComments(course.id, null);
  const leaderboard = await getLeaderboard(course, 6);

  // `?lesson=<uuid>` deep-links a lesson; otherwise resume where the learner
  // left off. The lookup is validated against the flattened lesson list so a
  // stale bookmark cannot crash the page.
  const requestedLessonId = typeof query.lesson === "string" ? query.lesson : null;
  const requestedExists = detail.lessons.some((lesson) => lesson.id === requestedLessonId);
  const entryLesson = resolveEntryLesson(detail.lessons, detail.progress);
  const initialLessonId = requestedExists
    ? requestedLessonId
    : (entryLesson?.id ?? null);

  return (
    <CoursePlayer
      detail={detail}
      initialLessonId={initialLessonId}
      comments={comments}
      pinnedComment={pinned}
      leaderboard={leaderboard}
    />
  );
}