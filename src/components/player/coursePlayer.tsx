"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";

import { Card } from "@/components/ui/card";
import { Modal, ModalInfoRow, Popover } from "@/components/ui/overlay";
import { TabPanel, Tabs, type TabItem } from "@/components/ui/tabs";
import { createUuid } from "@/domain/uuid";
import type {
  CourseComment,
  CourseDetail,
  LeaderboardEntry,
  PlayerTab,
  Uuid,
} from "@/domain/types";

import { ContentSidebar } from "./contentSidebar";
import { LessonHeader } from "./lessonHeader";
import { OverviewPanel } from "./overviewPanel";
import { PlayerBottomBar } from "./playerBottomBar";
import {
  createInitialPlayerState,
  createPlayerReducer,
  derivePlayerState,
  toastToneClasses,
  type PlayerState,
} from "./playerReducer";
import { useVideoTransport } from "./useVideoTransport";
import { VideoStage } from "./videoStage";

// Agent-built panels. These four imports are the integration seam: their prop
// contracts are declared in docs/system-design.md § 6.5.
import { CommentsPanel } from "./commentsPanel";
import { LeaderboardPanel } from "./leaderboardPanel";
import { MaterialsPanel } from "./materialsPanel";
import { StudentProgressCard } from "./studentProgressCard";

export interface CoursePlayerProps {
  detail: CourseDetail;
  initialLessonId: Uuid | null;
  comments: CourseComment[];
  pinnedComment: CourseComment | null;
  leaderboard: LeaderboardEntry[];
}

/**
 * The player island.
 *
 * A single client island on purpose: the video stage, the content list, the
 * progress ring, the sidebar toggle and the tab strip are one interaction loop,
 * and splitting them across separate islands would either duplicate state or add
 * a network round-trip per interaction. Everything expensive — the course read
 * model, the comment list, the leaderboard — is resolved on the server and handed
 * in as serialisable props, so hydration has nothing to fetch.
 */
export function CoursePlayer({
  detail,
  initialLessonId,
  comments,
  pinnedComment,
  leaderboard,
}: CoursePlayerProps) {
  const { course, lessons, progress, viewer } = detail;

  // Sections start expanded: a collapsed course list hides the context a learner
  // needs to know what they are about to watch. The active section is guaranteed
  // expanded so the current lesson is always visible.
  const initialExpanded = useMemo(() => {
    const activeLesson = lessons.find((lesson) => lesson.id === initialLessonId);
    const sectionIds = course.sections.map((section) => section.id);
    return activeLesson ? [activeLesson.sectionId] : sectionIds.slice(0, 1);
  }, [lessons, initialLessonId, course.sections]);

  const [state, rawDispatch] = useReducer(
    createPlayerReducer(lessons),
    createInitialPlayerState({
      activeLessonId: initialLessonId,
      progress,
      comments,
      expandedSectionIds: initialExpanded,
    }),
  );

  const derived = derivePlayerState(state, lessons, course);
  const { currentLesson, next, previous, metrics, completedIds, positionLabel } = derived;

  const transport = useVideoTransport({
    lessonId: currentLesson?.id ?? null,
    durationSeconds: currentLesson?.durationSeconds ?? 0,
  });

  const lessonsById = useMemo(
    () => new Map(lessons.map((lesson) => [lesson.id, lesson])),
    [lessons],
  );

  const activeMaterial = useMemo(
    () => course.materials.find((material) => material.id === state.openMaterialId) ?? null,
    [course.materials, state.openMaterialId],
  );

  const openStudentEntry = useMemo(
    () => leaderboard.find((entry) => entry.student.id === state.openStudentId) ?? null,
    [leaderboard, state.openStudentId],
  );

  const dispatch = rawDispatch;

  // Mirror the selected lesson into the URL so a lesson is bookmarkable and
  // survives a reload, without paying for a router navigation per click.
  useEffect(() => {
    if (!state.activeLessonId) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("lesson") === state.activeLessonId) return;
    url.searchParams.set("lesson", state.activeLessonId);
    window.history.replaceState(null, "", url);
  }, [state.activeLessonId]);

  useEffect(() => {
    if (!state.toast) return;
    const timer = setTimeout(() => dispatch({ type: "dismissToast" }), 3000);
    return () => clearTimeout(timer);
  }, [state.toast, dispatch]);

  const selectLesson = useCallback(
    (lessonId: Uuid) => dispatch({ type: "selectLesson", lessonId }),
    [dispatch],
  );

  const tabItems: TabItem<PlayerTab>[] = [
    { id: "overview", label: "Overview", icon: "bookOpen" },
    { id: "materials", label: "Materials", icon: "file", count: course.materials.length },
    { id: "comments", label: "Comments", icon: "message", count: state.comments.length },
    { id: "leaderboard", label: "Leaderboard", icon: "trophy", count: leaderboard.length },
  ];

  return (
    <div className="mx-auto w-full max-w-shell px-3 pb-mobile-bar pt-3 sm:px-4 lg:px-6 lg:pb-8">
      {/* The grid is the desktop layout: content column + fixed sidebar track.
          Collapsing animates the track, so the video grows without a reflow jump. */}
      <div
        style={{ "--sidebar-track": state.sidebarCollapsed ? "0px" : "var(--sidebar-width)" } as React.CSSProperties}
        className="grid grid-cols-1 items-start gap-4 transition-[grid-template-columns] duration-layout lg:grid-cols-[minmax(0,1fr)_var(--sidebar-track)] lg:gap-6"
      >
        <main className="flex min-w-0 flex-col gap-4">
          <div className="flex min-w-0 flex-col overflow-hidden rounded-card border border-border bg-surface shadow-xs">
            <VideoStage
              transport={transport}
              stageUrl={course.stageUrl}
              stageBlurDataUrl={course.stageBlurDataUrl}
              stageAlt={`Cover artwork for ${course.title}`}
              lessonTitle={currentLesson?.title ?? course.title}
              lessonNumber={currentLesson?.index ?? 0}
              immersive={state.immersive}
              onImmersiveChange={(immersive) => dispatch({ type: "setImmersive", immersive })}
              onNext={() => dispatch({ type: "goToNextLesson" })}
              onPrevious={() => dispatch({ type: "goToPreviousLesson" })}
              hasNext={Boolean(next)}
              hasPrevious={Boolean(previous)}
            />

            <LessonHeader
              courseTitle={course.title}
              lesson={currentLesson}
              positionLabel={positionLabel}
              sectionTitle={currentLesson?.sectionTitle ?? course.sections[0]?.title ?? ""}
              instructor={course.instructor}
              updatedAt={course.updatedAt}
              isCompleted={currentLesson ? completedIds.has(currentLesson.id) : false}
              onToggleComplete={(lessonId) => dispatch({ type: "toggleLessonComplete", lessonId })}
              onToggleSidebar={() => dispatch({ type: "toggleSidebar" })}
              sidebarCollapsed={state.sidebarCollapsed}
            />

            <nav className="px-4 sm:px-5" aria-label="Lesson details">
              <Tabs
                items={tabItems}
                active={state.activeTab}
                onChange={(tab) => dispatch({ type: "setActiveTab", tab })}
                label="Lesson details"
              />
            </nav>

            <div className="px-4 py-4 sm:px-5">
              <TabPanel id="overview" active={state.activeTab}>
                <OverviewPanel course={course} lesson={currentLesson} />
              </TabPanel>

              <TabPanel id="materials" active={state.activeTab}>
                <MaterialsPanel
                  materials={course.materials}
                  lessonResources={currentLesson?.resources ?? []}
                  openMaterialId={state.openMaterialId}
                  onOpenMaterial={(materialId) => dispatch({ type: "openMaterial", materialId })}
                  active={state.activeTab === "materials"}
                />
              </TabPanel>

              <TabPanel id="comments" active={state.activeTab}>
                <CommentsPanel
                  comments={state.comments}
                  pinned={pinnedComment}
                  viewer={viewer}
                  lessonId={currentLesson?.id ?? null}
                  onAddComment={(body) =>
                    dispatch({
                      type: "addComment",
                      comment: {
                        id: createUuid(),
                        courseId: course.id,
                        lessonId: currentLesson?.id ?? null,
                        author: viewer,
                        body,
                        createdAt: new Date().toISOString(),
                        helpfulCount: 0,
                        viewerHasMarkedHelpful: false,
                      },
                    })
                  }
                  onToggleHelpful={(commentId) => dispatch({ type: "toggleCommentHelpful", commentId })}
                  active={state.activeTab === "comments"}
                />
              </TabPanel>

              <TabPanel id="leaderboard" active={state.activeTab}>
                <LeaderboardPanel
                  entries={leaderboard}
                  viewerId={viewer.id}
                  active={state.activeTab === "leaderboard"}
                  openStudentId={state.openStudentId}
                  onOpenStudent={(studentId) => dispatch({ type: "openStudent", studentId })}
                />
              </TabPanel>
            </div>
          </div>
        </main>

        <div
          id="course-content-sidebar"
          className="min-w-0 lg:sticky lg:top-6"
        >
          <ContentSidebar
            sections={course.sections}
            lessonsById={lessonsById}
            activeLessonId={state.activeLessonId}
            completedIds={completedIds}
            expandedSectionIds={state.expandedSectionIds}
            onSelectLesson={selectLesson}
            onToggleComplete={(lessonId) => dispatch({ type: "toggleLessonComplete", lessonId })}
            onToggleSection={(sectionId, expanded) =>
              dispatch({ type: "setSectionExpanded", sectionId, expanded })
            }
            completedLessons={metrics.completedLessons}
            totalLessons={metrics.totalLessons}
            progressPercent={metrics.progressPercent}
            collapsed={state.sidebarCollapsed}
            sheetOpen={state.mobileSheetOpen}
            onCloseSheet={() => dispatch({ type: "setMobileSheet", open: false })}
          />
        </div>
      </div>

      <PlayerBottomBar
        activeLessonId={state.activeLessonId}
        lessonTitle={currentLesson?.title ?? null}
        positionLabel={positionLabel}
        progressPercent={metrics.progressPercent}
        isCompleted={currentLesson ? completedIds.has(currentLesson.id) : false}
        hasPrevious={Boolean(previous)}
        hasNext={Boolean(next)}
        onPrevious={() => dispatch({ type: "goToPreviousLesson" })}
        onNext={() => dispatch({ type: "goToNextLesson" })}
        onOpenSheet={() => dispatch({ type: "setMobileSheet", open: true })}
        onToggleComplete={(lessonId) => dispatch({ type: "toggleLessonComplete", lessonId })}
      />

      <PlayerToast state={state} />

      {openStudentEntry ? (
        <StudentPopover
          // Remount per student so the popover re-measures its anchor instead of
          // inheriting the previous entry's position.
          key={openStudentEntry.student.id}
          entry={openStudentEntry}
          onClose={() => dispatch({ type: "openStudent", studentId: null })}
          onSelectLesson={selectLesson}
        />
      ) : null}

      <Modal
        open={Boolean(activeMaterial)}
        onClose={() => dispatch({ type: "openMaterial", materialId: null })}
        title={activeMaterial?.title ?? ""}
        description={activeMaterial?.description}
        size="lg"
        footer={
          <a
            href={activeMaterial?.url ?? "#"}
            download
            className="inline-flex h-11 items-center justify-center gap-2 rounded-control bg-brand-600 px-4 text-body-sm font-medium text-white transition-colors duration-micro hover:bg-brand-700"
          >
            Download
          </a>
        }
      >
        {activeMaterial ? (
          <div className="flex flex-col gap-4">
            <div className="flex aspect-[3/2] items-center justify-center rounded-control border border-border bg-surface-sunken">
              <Card padding="lg" tone="outline" className="w-full max-w-sm text-center">
                <p className="text-body-sm font-medium text-text-secondary">
                  No inline preview available for this asset.
                </p>
                <p className="mt-1 text-caption text-text-tertiary">
                  Download the file to open it locally.
                </p>
              </Card>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <ModalInfoRow icon="fileText" label="Type" value={activeMaterial.fileType.toUpperCase()} />
              <ModalInfoRow
                icon="download"
                label="Size"
                value={activeMaterial.sizeBytes === null ? "External link" : formatSizeLabel(activeMaterial.sizeBytes)}
              />
              {activeMaterial.pages !== null ? (
                <ModalInfoRow icon="bookOpen" label="Pages" value={String(activeMaterial.pages)} />
              ) : null}
              <ModalInfoRow icon="clock" label="Lesson" value={currentLesson ? String(currentLesson.index) : "—"} />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function formatSizeLabel(sizeBytes: number): string {
  const kilobytes = Math.round(sizeBytes / 1024);
  return kilobytes >= 1024 ? `${(kilobytes / 1024).toFixed(1)} MB` : `${kilobytes} KB`;
}

/** Live region announcing progress changes without moving focus. */
function PlayerToast({ state }: { state: PlayerState }) {
  if (!state.toast) return null;

  return (
    <div
      aria-live="polite"
      role="status"
      className={`pointer-events-none fixed bottom-mobile-bar left-1/2 z-50 -translate-x-1/2 rounded-control border px-3 py-2 text-body-sm font-medium shadow-md lg:bottom-6 ${
        toastToneClasses[state.toast.tone]
      }`}
    >
      {state.toast.message}
    </div>
  );
}

/**
 * Anchored student progress popover.
 *
 * The trigger lives inside the leaderboard list, which scrolls with the page, so
 * the popover is positioned against the viewport rather than nested beside the
 * avatar — nesting would be clipped by the panel's `overflow: hidden`, and would
 * scroll away with the list.
 *
 * `anchorToFocus` lets the popover find that trigger itself: the control the
 * learner activated has focus whether they used the mouse or the keyboard, so
 * there is no need for the leaderboard panel to hand element geometry up to
 * here. The popover is only mounted while an entry is open, so there is no state
 * to reset between students.
 */
function StudentPopover({
  entry,
  onClose,
  onSelectLesson,
}: {
  entry: LeaderboardEntry;
  onClose: () => void;
  onSelectLesson: (lessonId: Uuid) => void;
}) {
  return (
    <Popover open onClose={onClose} label={`Progress for ${entry.student.name}`} anchorToFocus>
      <StudentProgressCard entry={entry} onClose={onClose} onSelectLesson={onSelectLesson} />
    </Popover>
  );
}