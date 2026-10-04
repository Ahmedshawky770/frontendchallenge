"use client";

import { useId, type ReactElement } from "react";

import { SectionLabel } from "@/components/ui/badge";
import { Icon, type IconName } from "@/components/ui/icon";
import { formatFileSize } from "@/domain/format";
import type { CourseMaterial, FileType, LessonResource, Uuid } from "@/domain/types";

export interface MaterialsPanelProps {
  materials: CourseMaterial[];
  lessonResources: LessonResource[];
  openMaterialId: Uuid | null;
  onOpenMaterial: (materialId: Uuid | null) => void;
  /** True when the panel's tab is selected; the shell owns visibility. */
  active: boolean;
}

const fileTypeIcons: Record<FileType, IconName> = {
  pdf: "fileText",
  zip: "file",
  sheet: "file",
  // The sprite has no external-link glyph, so `paperclip` carries "leaves the
  // player" without adding a new icon to the shared set.
  link: "paperclip",
};

const fileTypeLabels: Record<FileType, string> = {
  pdf: "PDF",
  zip: "Archive",
  sheet: "Spreadsheet",
  link: "External link",
};

/** Mirrors the ghost `IconButton` at `md` (44 px), because a link cannot be a button. */
const actionClasses =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-control text-text-secondary transition-colors duration-micro hover:bg-surface-sunken";

interface MaterialRowData {
  id: Uuid;
  title: string;
  fileType: FileType;
  sizeBytes: number | null;
  pages: number | null;
  url: string;
}

function toRowData(material: CourseMaterial): MaterialRowData {
  return {
    id: material.id,
    title: material.title,
    fileType: material.fileType,
    sizeBytes: material.sizeBytes,
    pages: material.pages,
    url: material.url,
  };
}

function toResourceRowData(resource: LessonResource): MaterialRowData {
  return {
    id: resource.id,
    title: resource.title,
    fileType: resource.fileType,
    sizeBytes: resource.sizeBytes,
    pages: null,
    url: resource.url,
  };
}

function MaterialRow({
  item,
  isOpen,
  onOpen,
}: {
  item: MaterialRowData;
  isOpen: boolean;
  onOpen: () => void;
}) {
  const isExternal = item.fileType === "link";
  const metaParts = [
    fileTypeLabels[item.fileType],
    formatFileSize(item.sizeBytes),
    item.pages && item.pages > 0 ? `${item.pages} pages` : null,
  ];

  return (
    <li
      className={[
        "flex items-center gap-1 rounded-control border bg-surface p-1 transition-colors duration-micro",
        isOpen ? "border-brand-300 bg-brand-50" : "border-border",
      ].join(" ")}
    >
      {/*
        The row is a button and the file action is a sibling anchor: nesting an
        anchor inside a button is invalid HTML and breaks keyboard traversal.
      */}
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-current={isOpen ? "true" : undefined}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xs px-1 text-left hover:bg-surface-sunken"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-100 text-brand-700">
          <Icon name={fileTypeIcons[item.fileType]} size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="clampOne block text-body-sm font-medium text-text-primary">
            {item.title}
          </span>
          <span className="clampOne mt-0.5 block text-caption text-text-secondary" data-numeric>
            {metaParts.filter(Boolean).join(" · ")}
          </span>
        </span>
      </button>

      {isExternal ? (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`Open ${item.title} in a new tab`}
          title="Open in a new tab"
          className={actionClasses}
        >
          <Icon name="arrowLeft" size={18} className="rotate-180" />
        </a>
      ) : (
        <a
          href={item.url}
          download
          aria-label={`Download ${item.title}`}
          title="Download"
          className={actionClasses}
        >
          <Icon name="download" size={18} />
        </a>
      )}
    </li>
  );
}

function MaterialGroup({
  headingId,
  title,
  hint,
  items,
  openMaterialId,
  onOpenMaterial,
  emptyIcon,
  emptyTitle,
  emptyBody,
}: {
  headingId: string;
  title: string;
  hint: string;
  items: MaterialRowData[];
  openMaterialId: Uuid | null;
  onOpenMaterial: (materialId: Uuid | null) => void;
  emptyIcon: IconName;
  emptyTitle: string;
  emptyBody: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-card border border-dashed border-border bg-surface-sunken px-4 py-6 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-surface text-text-secondary shadow-xs">
          <Icon name={emptyIcon} size={22} />
        </span>
        <p className="mt-3 text-body-sm font-medium text-text-primary">{emptyTitle}</p>
        <p className="mt-1 text-caption text-text-secondary">{emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 id={headingId}>
        <SectionLabel>{title}</SectionLabel>
      </h3>
      <p className="text-caption text-text-secondary">{hint}</p>
      <ul aria-labelledby={headingId} className="flex flex-col gap-2">
        {items.map((item) => (
          <MaterialRow
            key={item.id}
            item={item}
            isOpen={openMaterialId === item.id}
            onOpen={() => onOpenMaterial(item.id)}
          />
        ))}
      </ul>
    </div>
  );
}

/**
 * Materials tab: attachments for the current lesson, then course-wide files.
 *
 * Two decisions worth stating:
 *
 *  - **The panel renders when inactive.** The shell hides panels itself, so
 *    returning `null` here would break any shell that keeps the DOM stable
 *    across tab switches. `inert` instead takes an off-screen panel out of the
 *    tab order and the accessibility tree, which is the part a CSS-only
 *    `display` switch leaves broken.
 *  - **Groups drop their heading when empty.** A "Lesson resources" header over
 *    an empty state reads as a loading failure; the empty state carries the
 *    message on its own.
 */
export function MaterialsPanel({
  materials,
  lessonResources,
  openMaterialId,
  onOpenMaterial,
  active,
}: MaterialsPanelProps): ReactElement {
  const headingId = useId();
  const lessonHeadingId = useId();
  const courseHeadingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      inert={!active}
      className="flex flex-col gap-5 p-4"
    >
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="text-title-sm font-semibold text-text-primary">
          Materials
        </h2>
        <p className="text-caption text-text-secondary">
          Downloads and references for the lesson you are watching and the course as a whole.
        </p>
      </div>

      <MaterialGroup
        headingId={lessonHeadingId}
        title="Lesson resources"
        hint={`${lessonResources.length} file${lessonResources.length === 1 ? "" : "s"} attached to this lesson`}
        items={lessonResources.map(toResourceRowData)}
        openMaterialId={openMaterialId}
        onOpenMaterial={onOpenMaterial}
        emptyIcon="paperclip"
        emptyTitle="No resources for this lesson"
        emptyBody="The instructor did not attach anything. Course materials below are always available."
      />

      <MaterialGroup
        headingId={courseHeadingId}
        title="Course materials"
        hint="Available for the whole course, in every lesson"
        items={materials.map(toRowData)}
        openMaterialId={openMaterialId}
        onOpenMaterial={onOpenMaterial}
        emptyIcon="bookOpen"
        emptyTitle="No course materials yet"
        emptyBody="Downloadable files for this course will appear here once the instructor publishes them."
      />
    </section>
  );
}
