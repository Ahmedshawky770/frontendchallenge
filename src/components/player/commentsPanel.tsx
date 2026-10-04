"use client";

import { useId, useState, type FormEvent, type KeyboardEvent, type ReactElement } from "react";

import { Avatar, AvatarWithName } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { formatCount, formatRelativeTime } from "@/domain/format";
import type { CourseComment, Uuid, ViewerProfile } from "@/domain/types";

export interface CommentsPanelProps {
  comments: CourseComment[];
  pinned: CourseComment | null;
  viewer: ViewerProfile;
  lessonId: Uuid | null;
  onAddComment: (body: string) => void;
  onToggleHelpful: (commentId: Uuid) => void;
  /** True when the panel's tab is selected; the shell owns visibility. */
  active: boolean;
}

const characterLimit = 2000;
/** Amber starts here so the warning lands before the hard `maxLength` cut. */
const characterWarningThreshold = 1800;

const composerClasses =
  "w-full resize-y rounded-control border border-border-strong bg-surface px-3 py-2 text-body-sm text-text-primary placeholder:text-text-tertiary";

type LessonScope = "current" | "course";

function CommentItem({
  comment,
  referenceDate,
  lessonScope,
  isViewer,
  onToggleHelpful,
}: {
  comment: CourseComment;
  referenceDate: Date;
  lessonScope: LessonScope | null;
  isViewer: boolean;
  onToggleHelpful: (commentId: Uuid) => void;
}) {
  const isHelpful = comment.viewerHasMarkedHelpful;

  return (
    <li className="rounded-card border border-border bg-surface p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <Avatar src={comment.author.avatarUrl} name={comment.author.name} size="sm" />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 truncate text-body-sm font-medium text-text-primary">
              {comment.author.name}
            </span>
            {isViewer ? <Badge tone="brand">You</Badge> : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {comment.author.role === "instructor" ? (
              <Badge tone="info">Instructor</Badge>
            ) : null}
            {lessonScope ? (
              <Badge tone={lessonScope === "current" ? "brand" : "neutral"}>
                {lessonScope === "current" ? "This lesson" : "Whole course"}
              </Badge>
            ) : null}
            <time
              dateTime={comment.createdAt}
              // Relative time is wall-clock dependent, so a server render and the
              // client hydration can legitimately disagree by one minute.
              suppressHydrationWarning
              className="text-caption text-text-tertiary"
            >
              {formatRelativeTime(comment.createdAt, referenceDate)}
            </time>
          </div>

          <p className="mt-1 whitespace-pre-line text-body-sm text-text-primary">
            {comment.body}
          </p>

          <div className="mt-2">
            <Button
              size="sm"
              variant={isHelpful ? "subtle" : "ghost"}
              aria-pressed={isHelpful}
              onClick={() => onToggleHelpful(comment.id)}
              iconLeft={isHelpful ? "check" : undefined}
            >
              Helpful · {formatCount(comment.helpfulCount)}
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}

function PinnedNote({
  comment,
  referenceDate,
  isViewer,
  onToggleHelpful,
}: {
  comment: CourseComment;
  referenceDate: Date;
  isViewer: boolean;
  onToggleHelpful: (commentId: Uuid) => void;
}) {
  return (
    <li className="rounded-card border border-brand-300 bg-brand-50 p-3 sm:p-4">
      <AvatarWithName
        src={comment.author.avatarUrl}
        name={comment.author.name}
        meta={formatRelativeTime(comment.createdAt, referenceDate)}
      >
        <Badge tone="brand" className="shrink-0 bg-surface">
          <Icon name="sparkles" size={14} />
          Pinned note
        </Badge>
      </AvatarWithName>

      <p className="mt-2 whitespace-pre-line text-body-sm text-text-primary">{comment.body}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {comment.author.role === "instructor" ? (
          <Badge tone="info">Instructor</Badge>
        ) : null}
        {isViewer ? <Badge tone="brand" className="bg-surface">You</Badge> : null}
        <Button
          size="sm"
          variant={comment.viewerHasMarkedHelpful ? "subtle" : "ghost"}
          aria-pressed={comment.viewerHasMarkedHelpful}
          onClick={() => onToggleHelpful(comment.id)}
          iconLeft={comment.viewerHasMarkedHelpful ? "check" : undefined}
        >
          Helpful · {formatCount(comment.helpfulCount)}
        </Button>
      </div>
    </li>
  );
}

/**
 * Discussion tab: composer first, then the instructor's pinned note, then the
 * thread.
 *
 * Why the ordering is deliberate — the pinned note is the answer to the most
 * common question in any cohort, and burying it under 40 replies makes it
 * invisible. Keeping it directly under the composer means it is the first thing
 * read and the last thing scrolled past.
 *
 * The panel renders even when inactive (the shell hides panels); `inert` keeps
 * an off-screen panel out of the tab order, and the local `aria-live` region
 * only fires while the panel is actually on screen.
 */
export function CommentsPanel({
  comments,
  pinned,
  viewer,
  lessonId,
  onAddComment,
  onToggleHelpful,
  active,
}: CommentsPanelProps): ReactElement {
  const [body, setBody] = useState("");
  const headingId = useId();
  const composerId = useId();
  const counterId = useId();

  // One reference instant per render, so every timestamp in the list agrees.
  const referenceDate = new Date();
  const trimmedBody = body.trim();
  const nearLimit = body.length > characterWarningThreshold;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedBody) return;
    onAddComment(trimmedBody);
    setBody("");
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter posts the comment; Shift+Enter inserts the newline the field exists for.
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <section aria-labelledby={headingId} inert={!active} className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="text-title-sm font-semibold text-text-primary">
          Discussion
        </h2>
        <p className="text-caption text-text-secondary" data-numeric>
          {formatCount(comments.length)} comment{comments.length === 1 ? "" : "s"} · posting as{" "}
          {viewer.name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-card border border-border bg-surface p-3 shadow-xs sm:p-4">
        <label htmlFor={composerId} className="sr-only">
          Add a comment
        </label>
        <textarea
          id={composerId}
          rows={3}
          maxLength={characterLimit}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleComposerKeyDown}
          aria-describedby={counterId}
          placeholder="Ask a question or share what worked for you…"
          className={composerClasses}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p
            id={counterId}
            data-numeric
            className={`text-caption ${nearLimit ? "text-warning-700" : "text-text-secondary"}`}
          >
            {formatCount(body.length)} / {formatCount(characterLimit)} characters
          </p>
          <Button
            type="submit"
            size="md"
            disabled={!trimmedBody}
            iconLeft="message"
          >
            Post comment
          </Button>
        </div>
      </form>

      <ul aria-live="polite" aria-relevant="additions" className="flex flex-col gap-3">
        {pinned ? (
          <PinnedNote
            comment={pinned}
            referenceDate={referenceDate}
            isViewer={pinned.author.id === viewer.id}
            onToggleHelpful={onToggleHelpful}
          />
        ) : null}

        {comments.length === 0 ? (
          <li className="flex flex-col items-center rounded-card border border-dashed border-border bg-surface-sunken px-4 py-8 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-surface text-text-secondary shadow-xs">
              <Icon name="message" size={22} />
            </span>
            <p className="mt-3 text-body-sm font-medium text-text-primary">No comments yet</p>
            <p className="mt-1 text-caption text-text-secondary">
              Start the thread — a question here usually unblocks the whole cohort.
            </p>
          </li>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              referenceDate={referenceDate}
              lessonScope={
                lessonId === null
                  ? null
                  : comment.lessonId === lessonId
                    ? "current"
                    : "course"
              }
              isViewer={comment.author.id === viewer.id}
              onToggleHelpful={onToggleHelpful}
            />
          ))
        )}
      </ul>
    </section>
  );
}
