"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { IconButton } from "./button";
import { Icon } from "./icon";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Constrains the body width; long material previews use `lg`. */
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
} as const;

/**
 * Centred dialog used for material previews and confirmations.
 *
 * Accessibility contract:
 *  - `role="dialog"` + `aria-modal` + `aria-labelledby` on the title element;
 *  - focus moves to the first focusable child and is trapped until close;
 *  - Escape and backdrop click both close;
 *  - background scroll is locked and focus returns to the trigger on close.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, open);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const titleId = "modal-title";
  const descriptionId = "modal-description";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink-950/50 backdrop-blur-[2px]"
        tabIndex={-1}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-panel bg-surface shadow-lg sm:rounded-panel ${sizeClasses[size]}`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-title-sm font-semibold text-text-primary">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-caption text-text-secondary">
                {description}
              </p>
            ) : null}
          </div>
          <IconButton label="Close" icon="x" variant="ghost" size="sm" onClick={onClose} />
        </header>

        <div className="scrollRegion min-h-0 flex-1 px-5 py-4">{children}</div>

        {footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-surface-sunken px-5 py-3">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Compact anchored card used for the student progress popover.
 *
 * Unlike `Modal` this is not modal: the page stays scrollable, Escape closes it,
 * and a click anywhere outside dismisses it. It renders inline (absolutely
 * positioned against its parent) rather than in a portal, because the anchor
 * element is already `position: relative` — which keeps the positioning logic
 * trivial and avoids a z-index context fight with the sticky player.
 */
export interface PopoverAnchor {
  top: number;
  left: number;
}

export function Popover({
  open,
  onClose,
  label,
  children,
  align = "start",
  anchor,
  anchorToFocus = false,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  align?: "start" | "center" | "end";
  /**
   * Viewport coordinates for a fixed-position popover.
   *
   * Required when the trigger lives inside a scroll container: an absolutely
   * positioned popover is clipped by the container's `overflow: hidden` and
   * scrolls away with the content. Anchoring to the viewport and closing on
   * scroll avoids both.
   */
  anchor?: PopoverAnchor;
  /**
   * Anchor to whichever control currently has focus.
   *
   * A click focuses its target and a keyboard activation moves focus to it, so
   * the focused element is the trigger in both cases — which means the popover
   * does not have to be handed element geometry from the panel that owns the
   * trigger, and cannot be anchored to the wrong element.
   */
  anchorToFocus?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredAnchor, setMeasuredAnchor] = useState<PopoverAnchor | null>(null);

  /**
   * A ref callback runs during commit, before the browser paints, which makes it
   * the right place to measure a node. The alternative — measuring in an effect —
   * works but sets state from an effect body, costing an extra render and, here,
   * a frame where the popover is positioned at the wrong place.
   */
  const attachContainer = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (!node || !anchorToFocus) return;

      const trigger = document.activeElement;
      if (!(trigger instanceof HTMLElement) || trigger === node || node.contains(trigger)) return;

      const rect = trigger.getBoundingClientRect();
      setMeasuredAnchor({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
    },
    [anchorToFocus],
  );

  const resolvedAnchor = anchor ?? (anchorToFocus ? measuredAnchor : null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!resolvedAnchor) return;

    function handleDismiss() {
      onClose();
    }

    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);
    return () => {
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
    };
  }, [resolvedAnchor, onClose]);

  if (!open) return null;

  const anchorClasses = resolvedAnchor
    ? "fixed"
    : `absolute top-[calc(100%+0.5rem)] ${
        align === "start" ? "left-0" : align === "end" ? "right-0" : "left-1/2 -translate-x-1/2"
      }`;

  const style: React.CSSProperties | undefined = resolvedAnchor
    ? { top: resolvedAnchor.top, left: resolvedAnchor.left, transform: "translateX(-50%)" }
    : undefined;

  return (
    <div ref={attachContainer} className={`z-50 w-72 ${anchorClasses}`} style={style}>
      <div
        role="dialog"
        aria-label={label}
        className="rounded-panel border border-border bg-surface p-4 shadow-lg"
      >
        {children}
      </div>
    </div>
  );
}

export function ModalInfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-control bg-surface-sunken px-3 py-2">
      <Icon name={icon} size={16} className="shrink-0 text-text-tertiary" />
      <span className="text-caption text-text-secondary">{label}</span>
      <span className="ml-auto text-caption font-medium text-text-primary" data-numeric>
        {value}
      </span>
    </div>
  );
}