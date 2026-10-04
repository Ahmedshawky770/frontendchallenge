import { CourseCard } from "./courseCard";

import type { CourseSummary } from "@/domain/types";

export interface CourseGridProps {
  courses: CourseSummary[];
  /** How many leading cards get `preload` — above-the-fold images only. */
  eagerCount?: number;
}

/**
 * Responsive catalogue grid: 1 column on phones, 2 from `sm`, 3 from `xl`.
 *
 * Tracks are `minmax(0, 1fr)` rather than `1fr` so an unbroken long title
 * shrinks its column instead of pushing the grid wider than the viewport — this
 * is the single most common cause of horizontal scroll in a card grid.
 */
export function CourseGrid({ courses, eagerCount = 3 }: CourseGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">
      {courses.map((course, index) => (
        <li key={course.id} className="min-w-0">
          <CourseCard course={course} eager={index < eagerCount} />
        </li>
      ))}
    </ul>
  );
}