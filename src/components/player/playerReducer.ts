/**
 * Player state machine.
 *
 * The whole player is one reducer. Two reasons:
 *
 *  1. Video stage, lesson list, progress ring, sidebar and tabs form a single
 *     interaction loop. Splitting that across several `useState` calls is how a
 *     player ends up showing "3 of 24" next to a progress bar reading 18%.
 *  2. Derived values (`currentLesson`, `progressPercent`, `nextLesson`) are
 *     computed from state in `derivePlayerState` rather than stored, so there is
 *     no second copy of the truth that can drift.
 *
 * The reducer is produced by a factory because navigation needs the immutable
 * lesson order as context. Closing over it keeps the order a single source of
 * truth instead of duplicating it into reducer state.
 */

import { computeMetrics, nextLesson, previousLesson, toggleLesson } from "@/domain/progress";
import type {
  Course,
  CourseComment,
  CourseMetrics,
  EnrollmentProgress,
  FlatLesson,
  PlayerTab,
  Uuid,
} from "@/domain/types";

export interface PlayerToast {
  id: string;
  message: string;
  tone: "success" | "info";
}

export interface PlayerState {
  activeLessonId: Uuid | null;
  activeTab: PlayerTab;
  /** Desktop sidebar collapse — user-controlled, independent of viewport width. */
  sidebarCollapsed: boolean;
  expandedSectionIds: Uuid[];
  openMaterialId: Uuid | null;
  openStudentId: Uuid | null;
  comments: CourseComment[];
  progress: EnrollmentProgress;
  /** Immersive: fullscreen + orientation lock. */
  immersive: boolean;
  mobileSheetOpen: boolean;
  toast: PlayerToast | null;
}

export type PlayerAction =
  | { type: "selectLesson"; lessonId: Uuid }
  | { type: "toggleLessonComplete"; lessonId: Uuid }
  | { type: "goToNextLesson" }
  | { type: "goToPreviousLesson" }
  | { type: "setActiveTab"; tab: PlayerTab }
  | { type: "toggleSidebar"; collapsed?: boolean }
  | { type: "setSectionExpanded"; sectionId: Uuid; expanded: boolean }
  | { type: "openMaterial"; materialId: Uuid | null }
  | { type: "openStudent"; studentId: Uuid | null }
  | { type: "addComment"; comment: CourseComment }
  | { type: "toggleCommentHelpful"; commentId: Uuid }
  | { type: "setImmersive"; immersive: boolean }
  | { type: "setMobileSheet"; open: boolean }
  | { type: "showToast"; message: string; tone?: "success" | "info" }
  | { type: "dismissToast" };

export interface DerivedPlayerState {
  currentLesson: FlatLesson | null;
  next: FlatLesson | null;
  previous: FlatLesson | null;
  metrics: CourseMetrics;
  completedIds: Set<Uuid>;
  /** "12 / 24" */
  positionLabel: string;
}

export interface PlayerInitialInput {
  activeLessonId: Uuid | null;
  progress: EnrollmentProgress;
  comments: CourseComment[];
  expandedSectionIds: Uuid[];
}

export function createInitialPlayerState(input: PlayerInitialInput): PlayerState {
  return {
    activeLessonId: input.activeLessonId,
    activeTab: "overview",
    sidebarCollapsed: false,
    expandedSectionIds: input.expandedSectionIds,
    openMaterialId: null,
    openStudentId: null,
    comments: input.comments,
    progress: input.progress,
    immersive: false,
    mobileSheetOpen: false,
    toast: null,
  };
}

export function createPlayerReducer(lessons: FlatLesson[]) {
  return function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
    switch (action.type) {
      case "selectLesson":
        return {
          ...state,
          activeLessonId: action.lessonId,
          // Picking a lesson on mobile should reveal it, not leave it hidden
          // behind an open bottom sheet.
          mobileSheetOpen: false,
          progress: { ...state.progress, lastLessonId: action.lessonId },
        };

      case "toggleLessonComplete": {
        const progress = toggleLesson(state.progress, action.lessonId);
        const isComplete = progress.completedLessonIds.includes(action.lessonId);

        return {
          ...state,
          progress,
          toast: {
            id: `${action.lessonId}-${progress.completedLessonIds.length}`,
            message: isComplete ? "Lesson marked complete" : "Lesson marked incomplete",
            tone: isComplete ? "success" : "info",
          },
        };
      }

      case "goToNextLesson": {
        const target = nextLesson(lessons, state.activeLessonId);
        if (!target) return state;
        return { ...state, activeLessonId: target.id, mobileSheetOpen: false };
      }

      case "goToPreviousLesson": {
        const target = previousLesson(lessons, state.activeLessonId);
        if (!target) return state;
        return { ...state, activeLessonId: target.id, mobileSheetOpen: false };
      }

      case "setActiveTab":
        return { ...state, activeTab: action.tab };

      case "toggleSidebar":
        return { ...state, sidebarCollapsed: action.collapsed ?? !state.sidebarCollapsed };

      case "setSectionExpanded":
        return {
          ...state,
          expandedSectionIds: action.expanded
            ? state.expandedSectionIds.includes(action.sectionId)
              ? state.expandedSectionIds
              : [...state.expandedSectionIds, action.sectionId]
            : state.expandedSectionIds.filter((id) => id !== action.sectionId),
        };

      case "openMaterial":
        return { ...state, openMaterialId: action.materialId };

      case "openStudent":
        return { ...state, openStudentId: action.studentId };

      case "addComment":
        return {
          ...state,
          comments: [action.comment, ...state.comments],
          toast: { id: action.comment.id, message: "Comment posted", tone: "success" },
        };

      case "toggleCommentHelpful":
        return {
          ...state,
          comments: state.comments.map((comment) =>
            comment.id === action.commentId
              ? {
                  ...comment,
                  viewerHasMarkedHelpful: !comment.viewerHasMarkedHelpful,
                  helpfulCount: Math.max(
                    comment.helpfulCount + (comment.viewerHasMarkedHelpful ? -1 : 1),
                    0,
                  ),
                }
              : comment,
          ),
        };

      case "setImmersive":
        return { ...state, immersive: action.immersive };

      case "setMobileSheet":
        return { ...state, mobileSheetOpen: action.open };

      case "showToast":
        return {
          ...state,
          toast: { id: String(Date.now()), message: action.message, tone: action.tone ?? "info" },
        };

      case "dismissToast":
        return { ...state, toast: null };

      default:
        return state;
    }
  };
}

/** Derived values, computed during render. Never stored in state. */
export function derivePlayerState(
  state: PlayerState,
  lessons: FlatLesson[],
  course: Course,
): DerivedPlayerState {
  const currentLesson = lessons.find((lesson) => lesson.id === state.activeLessonId) ?? null;
  const index = currentLesson
    ? lessons.findIndex((lesson) => lesson.id === currentLesson.id)
    : -1;

  return {
    currentLesson,
    next: nextLesson(lessons, state.activeLessonId),
    previous: previousLesson(lessons, state.activeLessonId),
    metrics: computeMetrics(course, state.progress),
    completedIds: new Set(state.progress.completedLessonIds),
    positionLabel: lessons.length === 0 ? "0 / 0" : `${index + 1} / ${lessons.length}`,
  };
}

export const toastToneClasses: Record<PlayerToast["tone"], string> = {
  success: "border-success-500/30 bg-success-50 text-success-700",
  info: "border-brand-300/40 bg-brand-50 text-brand-700",
};