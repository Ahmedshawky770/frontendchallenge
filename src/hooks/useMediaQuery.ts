"use client";

import { useEffect, useState } from "react";

/**
 * Subscribes to a media query.
 *
 * Used only for behaviour that CSS cannot express — disabling the video
 * auto-hide timer, or closing the mobile sheet when the viewport grows. Layout
 * itself never reads this hook; it is CSS grid and media queries, so a JS delay
 * cannot cause a broken layout on first paint.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const list = window.matchMedia(query);
    setMatches(list.matches);

    function handleChange(event: MediaQueryListEvent) {
      setMatches(event.matches);
    }

    list.addEventListener("change", handleChange);
    return () => list.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}