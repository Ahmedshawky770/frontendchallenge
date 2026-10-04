/**
 * Guards shared by the course-scoped commands.
 *
 * Two different failures look identical on the wire ("this lesson is not in this
 * course") but mean different things to a client, so they are separated here:
 * a lesson id that exists nowhere is `404`, a lesson that belongs to a *different*
 * course is `409`. Both need the course graph, which is why this lives next to the
 * commands instead of in the route adapters.
 */

import { resolveCourse } from "@/server/cqrs/queries/courseQueries";
import { findAllCourses } from "@/server/repositories/courseRepository";

import { flattenLessons } from "@/domain/progress";
import type { Course } from "@/domain/types";

export async function loadCourseForCommand(courseIdOrSlug: string): Promise<Course | null> {
  return resolveCourse(courseIdOrSlug);
}

export function courseOwnsLesson(course: Course, lessonId: string): boolean {
  return flattenLessons(course).some((lesson) => lesson.id === lessonId);
}

/** A lesson id that resolves to no course at all — used to tell 404 from 409. */
export async function lessonExistsInAnyCourse(lessonId: string): Promise<boolean> {
  const courses = await findAllCourses();
  return courses.some((course) => courseOwnsLesson(course, lessonId));
}