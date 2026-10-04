/**
 * Stable id factory for mock fixtures.
 *
 * Every entity in this project is identified by a UUIDv4 (see src/domain/uuid.ts
 * for why). Fixtures derive theirs deterministically from a namespace plus a
 * path, so:
 *  - server and client render identical ids (no hydration mismatch),
 *  - React keys stay stable across renders,
 *  - a fixture can be rewritten without hunting 190 copy-pasted uuids.
 */

import { deriveUuidV4 } from "@/domain/uuid";

export const ids = {
  profile: (key: string) => deriveUuidV4("profile", key),
  course: (slug: string) => deriveUuidV4("course", slug),
  section: (slug: string, sectionIndex: number) => deriveUuidV4("section", slug, sectionIndex),
  lesson: (slug: string, sectionIndex: number, lessonIndex: number) =>
    deriveUuidV4("lesson", slug, sectionIndex, lessonIndex),
  resource: (slug: string, sectionIndex: number, lessonIndex: number, resourceIndex: number) =>
    deriveUuidV4("resource", slug, sectionIndex, lessonIndex, resourceIndex),
  material: (slug: string, materialIndex: number) => deriveUuidV4("material", slug, materialIndex),
  comment: (courseSlug: string, commentIndex: number) =>
    deriveUuidV4("comment", courseSlug, commentIndex),
  enrollment: (courseSlug: string) => deriveUuidV4("enrollment", courseSlug),
} as const;