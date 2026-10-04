"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribes to a media query.
 *
 * Built on `useSyncExternalStore` rather than `useState` + `useEffect`: the
 * browser is the store, matchMedia is the subscription, and the hook reads the
 * current value during render. The effect version had to set state from inside
 * an effect, which costs an extra render pass on mount and on every query change.
 *
 * `getServerSnapshot` returns false because the server has no viewport. Handing
 * React a server snapshot that matches the first client render is what keeps
 * hydration from mismatching on a viewport-dependent value.
 *
 * Used only for behaviour CSS cannot express — disabling the video auto-hide
 * timer, or closing the mobile sheet when the viewport grows. Layout itself
 * never reads this hook; it is CSS grid and media queries, so a JS delay cannot
 * cause a broken layout on first paint.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onStoreChange);
      return () => list.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}