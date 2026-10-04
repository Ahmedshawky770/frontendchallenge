"use client";

import type { ReactElement } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ModalInfoRow } from "@/components/ui/overlay";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { formatInteger } from "@/domain/format";
import type { LeaderboardEntry, Uuid } from "@/domain/types";

export interface StudentProgressCardProps {
  entry: LeaderboardEntry;
  onClose: () => void;
  onSelectLesson?: (lessonId: Uuid) => void;
}

/**
 * Content of the student progress popover — the shell owns the `Popover`
 * wrapper, the anchoring and the dismissal wiring, so this file renders the card
 * body only.
 *
 * Two constraints shaped the layout: the popover is 288 px wide (256 px of
 * content), so every text row is `min-w-0` + truncated or line-clamped; and the
 * read model carries no timestamps for a learner, so the activity line reports
 * the streak — a value that is actually in the data — instead of inventing a
 * "last seen" moment.
 *
 * `onSelectLesson` is optional and the jump row is omitted without it, because
 * `LeaderboardEntry` has no lesson id: the callback is a signal the shell
 * resolves, and the student id is passed as the stable handle for it.
 */
export function StudentProgressCard({
  entry,
  onClose,
  onSelectLesson,
}: StudentProgressCardProps): ReactElement {
  const { student } = entry;
  const percent = formatInteger(entry.progressPercent);
  const isComplete = entry.progressPercent >= 100;
  const streakLabel =
    entry.streakDays > 0 ? `${formatInteger(entry.streakDays)}-day streak` : "no active streak";

  return (
    <div role="group" aria-label={`Progress for ${student.name}`} className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <Avatar src={student.avatarUrl} name={student.name} size="lg" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-body-sm font-semibold text-text-primary">{student.name}</p>
          <p className="clampTwo mt-0.5 text-micro text-text-secondary">{student.headline}</p>
          <Badge tone={student.role === "instructor" ? "info" : "neutral"} className="mt-1.5">
            {student.role === "instructor" ? "Instructor" : "Student"}
          </Badge>
        </div>

        <IconButton
          label="Close"
          icon="x"
          variant="ghost"
          size="md"
          onClick={onClose}
          className="-mr-1 -mt-1 shrink-0"
        />
      </div>

      <div className="flex items-center gap-3">
        <ProgressRing
          value={entry.progressPercent}
          size={56}
          tone={isComplete ? "success" : "brand"}
          label={`${student.name} course progress`}
        >
          {percent}%
        </ProgressRing>

        <div className="min-w-0 flex-1">
          <ProgressBar
            value={entry.progressPercent}
            size="sm"
            tone={isComplete ? "success" : "brand"}
            label={`${student.name} completed lessons`}
          />
          <p className="mt-2 clampTwo text-micro text-text-secondary">
            {`Completed ${formatInteger(entry.completedLessons)} of ${formatInteger(entry.totalLessons)} lessons · ${percent}% complete`}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <ModalInfoRow
          icon="sparkles"
          label="Streak"
          value={`${formatInteger(entry.streakDays)} day${entry.streakDays === 1 ? "" : "s"}`}
        />
        <ModalInfoRow
          icon="checkCircle"
          label="Lessons done"
          value={`${formatInteger(entry.completedLessons)} / ${formatInteger(entry.totalLessons)}`}
        />
      </div>

      <p className="flex items-center gap-2 text-micro text-text-secondary">
        <Icon name="clock" size={14} className="shrink-0 text-text-tertiary" />
        <span className="min-w-0 truncate">
          <span className="font-medium text-text-primary">Most recent activity</span>
          {` · ${streakLabel}`}
        </span>
      </p>

      {onSelectLesson ? (
        <div className="border-t border-border pt-3">
          <Button
            variant="subtle"
            size="md"
            block
            iconLeft="play"
            onClick={() => onSelectLesson(student.id)}
          >
            Jump to this learner&apos;s next lesson
          </Button>
        </div>
      ) : null}
    </div>
  );
}
