"use client";

import { useEffect, type RefObject } from "react";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Traps focus inside `containerRef` while `active` is true, and restores focus to
 * the previously focused element on close.
 *
 * Dialogs and bottom sheets are the only two overlays in this app, and both must
 * behave the same way for keyboard and screen-reader users. Returning focus to
 * the trigger is what stops a keyboard user from being dropped at the top of the
 * document every time a modal closes.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelector),
    ).filter((element) => element.offsetParent !== null || element === document.activeElement);

    (focusable[0] ?? container).focus({ preventScroll: true });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab") return;

      const items = Array.from(
        container!.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => element.offsetParent !== null);

      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [active, containerRef]);
}