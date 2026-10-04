"use client";

import { useId, useRef, useState, type ReactNode } from "react";

export interface TooltipProps {
  label: string;
  children: ReactNode;
  /** Placement relative to the trigger. */
  placement?: "top" | "bottom";
}

/**
 * Hover/focus tooltip for icon controls in the video chrome.
 *
 * Deliberately minimal: no positioning library, no animation on mount. The video
 * control bar has a fixed layout, so a CSS-positioned tooltip is both sufficient
 * and one less dependency in the critical bundle.
 */
export function Tooltip({ label, children, placement = "top" }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(true);
  }

  function hide() {
    timerRef.current = setTimeout(() => setVisible(false), 80);
  }

  const positionClasses =
    placement === "top"
      ? "bottom-[calc(100%+0.375rem)] left-1/2 -translate-x-1/2"
      : "top-[calc(100%+0.375rem)] left-1/2 -translate-x-1/2";

  return (
    <span
      className="relative inline-flex"
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
    >
      <span aria-describedby={visible ? tooltipId : undefined}>{children}</span>

      <span
        role="tooltip"
        id={tooltipId}
        className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-xs bg-ink-950 px-2 py-1 text-micro font-medium text-white shadow-md transition-opacity duration-micro ${
          positionClasses
        } ${visible ? "opacity-100" : "opacity-0"}`}
      >
        {label}
      </span>
    </span>
  );
}