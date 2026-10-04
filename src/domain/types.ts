/**
 * Domain types for the course platform.
 *
 * This module is framework-free on purpose: it imports nothing from React, Next
 * or the server layer, so it can be imported by server components, client
 * components, route handlers and tests alike.
 */

/** RFC 4122 version 4 identifier. */
export type Uuid = string;

/** ISO-8601 timestamp in UTC, e.g. "2026-03-04T10:12:00.000Z". */
export type IsoDateTime = string;

export type CourseCategory =
  | "engineering"
  | "design"
  | "data"
  | "business"
  | "marketing"
  | "security";

export type CourseLevel = "beginner" | "intermediate" | "advanced";

export type CourseStatus = "not-started" | "in-progress" | "completed";

export type LessonKind = "video" | "reading" | "quiz";

export type FileType = "pdf" | "zip" | "sheet" | "link";

export type PlayerTab = "overview" | "materials" | "comments" | "leaderboard";

export interface ViewerProfile {
  id: Uuid;
  name: string;
  avatarUrl: string;
  role: "instructor" | "student";
  headline: string;
}

export interface Instructor extends ViewerProfile {
  role: "instructor";
  title: string;
  studentsCount: number;
}

export interface LessonResource {
  id: Uuid;
  lessonId: Uuid;
  title: string;
  fileType: FileType;
  sizeBytes: number;
  url: string;
}

export interface Lesson {
  id: Uuid;
  sectionId: Uuid;
  courseId: Uuid;
  /** 1-based position within the whole course, so ordering survives filtering. */
  index: number;
  title: string;
  kind: LessonKind;
  durationSeconds: number;
  isPreview: boolean;
  summary: string;
  resources: LessonResource[];
}

export interface CourseSection {
  id: Uuid;
  courseId: Uuid;
  title: string;
  lessons: Lesson[];
}

export interface CourseMaterial {
  id: Uuid;
  courseId: Uuid;
  title: string;
  description: string;
  fileType: FileType;
  /** null for external links, which have no payload size. */
  sizeBytes: number | null;
  /** null for anything that is not paginated. */
  pages: number | null;
  url: string;
}

export interface Course {
  id: Uuid;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: CourseCategory;
  level: CourseLevel;
  instructor: Instructor;
  posterUrl: string;
  posterBlurDataUrl: string;
  accentColor: string;
  rating: number;
  ratingCount: number;
  enrolledCount: number;
  updatedAt: IsoDateTime;
  sections: CourseSection[];
  materials: CourseMaterial[];
}

export interface EnrollmentProgress {
  courseId: Uuid;
  completedLessonIds: Uuid[];
  lastLessonId: Uuid | null;
  updatedAt: IsoDateTime;
}

export interface CourseComment {
  id: Uuid;
  courseId: Uuid;
  lessonId: Uuid | null;
  author: ViewerProfile;
  body: string;
  createdAt: IsoDateTime;
  helpfulCount: number;
  viewerHasMarkedHelpful: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  student: ViewerProfile;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  streakDays: number;
}

/** Flattened course shape used by the player and the catalogue. */
export interface FlatLesson extends Lesson {
  sectionTitle: string;
  sectionIndex: number;
}

export interface CourseMetrics {
  totalLessons: number;
  totalSections: number;
  completedLessons: number;
  progressPercent: number;
  status: CourseStatus;
  totalDurationSeconds: number;
  remainingDurationSeconds: number;
}

/** Catalogue card projection — never leaks the whole course graph. */
export interface CourseSummary {
  id: Uuid;
  slug: string;
  title: string;
  subtitle: string;
  category: CourseCategory;
  level: CourseLevel;
  instructor: ViewerProfile;
  posterUrl: string;
  posterBlurDataUrl: string;
  accentColor: string;
  rating: number;
  ratingCount: number;
  enrolledCount: number;
  lessonCount: number;
  totalDurationSeconds: number;
  progressPercent: number;
  status: CourseStatus;
  lastLessonId: Uuid | null;
}

/** Read model returned to the player island: course + flattened lessons + progress. */
export interface CourseDetail {
  course: Course;
  lessons: FlatLesson[];
  progress: EnrollmentProgress;
  metrics: CourseMetrics;
  viewer: ViewerProfile;
}