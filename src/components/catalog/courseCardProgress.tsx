import { ProgressBar } from "@/components/ui/progress";

import type { CourseStatus } from "@/domain/types";

export interface CourseCardProgressProps {
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  status: CourseStatus;
}

/**
 * The card's progress block.
 *
 * Not-started courses get a quiet "N lessons · total duration" line instead of
 * an empty 0% bar — an empty bar next to a zero percentage communicates nothing
 * and adds a row of visual noise to every un-started card in the grid.
 */
export function CourseCardProgress({
  progressPercent,
  completedLessons,
  totalLessons,
  status,
}: CourseCardProgressProps) {
  if (status === "not-started") {
    return (
      <p className="text-caption text-text-tertiary" data-numeric>
        {totalLessons} lessons · not started yet
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-caption font-medium text-text-secondary" data-numeric>
          {completedLessons} of {totalLessons} lessons
        </span>
        <span className="text-caption font-semibold text-text-primary" data-numeric>
          {progressPercent}%
        </span>
      </div>
      <ProgressBar
        value={progressPercent}
        size="sm"
        tone={status === "completed" ? "success" : "brand"}
        label="Course completion"
      />
    </div>
  );
}