"use client";

import { useId, type ReactElement } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress";
import { formatInteger } from "@/domain/format";
import type { LeaderboardEntry, Uuid } from "@/domain/types";

export interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
  viewerId: Uuid;
  /** True when the panel's tab is selected; the shell owns visibility. */
  active: boolean;
  openStudentId: Uuid | null;
  onOpenStudent: (studentId: Uuid | null) => void;
}

type RankTone = "brand" | "success" | "warning" | "neutral";

function rankTone(rank: number): RankTone {
  if (rank === 1) return "brand";
  if (rank === 2) return "success";
  if (rank === 3) return "warning";
  return "neutral";
}

function LeaderboardRow({
  entry,
  isViewer,
  isOpen,
  onOpenStudent,
}: {
  entry: LeaderboardEntry;
  isViewer: boolean;
  isOpen: boolean;
  onOpenStudent: (studentId: Uuid | null) => void;
}) {
  const { student } = entry;
  const rank = formatInteger(entry.rank);

  return (
    <li
      // The anchored popover positions against this row, so the anchor has to
      // be the row itself rather than the avatar control.
      className={`relative rounded-card border p-2 ${
        isViewer ? "border-brand-300 bg-brand-50" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-center gap-2">
        <Badge tone={rankTone(entry.rank)} className="size-9 shrink-0 justify-center">
          <span className="sr-only">{`Rank ${rank}`}</span>
          <span aria-hidden="true">{rank}</span>
        </Badge>

        <button
          type="button"
          onClick={() => onOpenStudent(isOpen ? null : student.id)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label={`View progress for ${student.name}`}
          title={`View progress for ${student.name}`}
          className="flex size-tap-target shrink-0 items-center justify-center rounded-full transition-transform duration-micro hover:scale-105"
        >
          <Avatar src={student.avatarUrl} name={student.name} size="md" ring={isViewer} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 truncate text-body-sm font-semibold text-text-primary">
              {student.name}
            </span>
            {isViewer ? (
              <Badge tone="brand" className="shrink-0">
                You
              </Badge>
            ) : null}
            <span
              className="ml-auto shrink-0 text-caption font-semibold text-text-primary"
              data-numeric
            >
              {formatInteger(entry.progressPercent)}%
            </span>
          </div>

          <p className="truncate text-caption text-text-secondary">{student.headline}</p>

          <ProgressBar
            value={entry.progressPercent}
            size="sm"
            tone={entry.progressPercent >= 100 ? "success" : "brand"}
            label={`${student.name} course progress`}
            className="mt-2"
          />

          <div className="mt-1.5 flex items-center justify-between gap-2 text-micro text-text-secondary">
            <span className="min-w-0 truncate" data-numeric>
              {formatInteger(entry.completedLessons)}/{formatInteger(entry.totalLessons)} lessons
            </span>
            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap" data-numeric>
              <Icon name="sparkles" size={12} className="shrink-0" />
              {formatInteger(entry.streakDays)}-day streak
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * Leaderboard tab.
 *
 * The avatar is the only interactive element in a row, so it carries the whole
 * affordance: it is a 44 px target with `aria-expanded` plus a name that says
 * whose progress opens — a bare image button is unusable with a screen reader.
 * Re-clicking the open row hands `null` back so the shell can toggle the
 * anchored popover closed from the same trigger.
 *
 * The panel renders while inactive (the shell hides panels) and `inert` keeps a
 * hidden row's avatar button out of the tab order.
 */
export function LeaderboardPanel({
  entries,
  viewerId,
  active,
  openStudentId,
  onOpenStudent,
}: LeaderboardPanelProps): ReactElement {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} inert={!active} className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="text-title-sm font-semibold text-text-primary">
          Leaderboard
        </h2>
        <p className="text-caption text-text-secondary">
          Ranked by lessons completed. Open an avatar to inspect a learner&apos;s progress.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center rounded-card border border-dashed border-border bg-surface-sunken px-4 py-8 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-surface text-text-secondary shadow-xs">
            <Icon name="users" size={22} />
          </span>
          <p className="mt-3 text-body-sm font-medium text-text-primary">No learners ranked yet</p>
          <p className="mt-1 text-caption text-text-secondary">
            The leaderboard fills in as people complete lessons in this course.
          </p>
        </div>
      ) : (
        <ol aria-labelledby={headingId} className="flex flex-col gap-2">
          {entries.map((entry) => (
            <LeaderboardRow
              key={entry.student.id}
              entry={entry}
              isViewer={entry.student.id === viewerId}
              isOpen={openStudentId === entry.student.id}
              onOpenStudent={onOpenStudent}
            />
          ))}
        </ol>
      )}
    </section>
  );
}
