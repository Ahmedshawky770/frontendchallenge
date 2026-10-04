"use client";

import { useEffect } from "react";

/**
 * Locks background scrolling while an overlay is open.
 *
 * `overflow: hidden` on <body> alone is not enough on iOS, where the page keeps
 * scrolling under the overlay; padding for the scrollbar prevents the layout
 * shifting when the bar disappears.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [locked]);
}