"use client";

import { useCallback, useEffect } from "react";

/** Cross-browser fullscreen types; the standard API is still vendor-prefixed on iOS Safari. */
type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
  webkitExitFullscreen?: () => void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
  webkitFullscreenEnabled?: boolean;
};

type LockableOrientation = {
  lock?: (orientation: string) => Promise<void>;
  unlock?: () => void;
};

/**
 * `screen` does not exist during server rendering, and orientation locking is a
 * client-only capability anyway — so it is resolved inside the callbacks that
 * need it rather than during render, which would throw on the server.
 */
function getOrientation(): LockableOrientation | undefined {
  if (typeof screen === "undefined") return undefined;
  return screen.orientation as LockableOrientation | undefined;
}

export interface ImmersiveApi {
  isFullscreen: () => boolean;
  enter: () => Promise<void>;
  exit: () => Promise<void>;
}

/**
 * Fullscreen + landscape lock for the mobile video stage.
 *
 * Three cooperating mechanisms, each independently degradable:
 *
 *  1. `requestFullscreen` — supported everywhere; `webkitRequestFullscreen` on iOS.
 *  2. `screen.orientation.lock("landscape")` — Android Chrome and Edge only.
 *     iOS Safari has no orientation lock API at all, so the call is wrapped and
 *     the failure is reported instead of thrown: fullscreen still works and the
 *     CSS landscape layout applies if the user rotates manually.
 *  3. CSS `@media (orientation: landscape) and (max-height: 560px)` — the
 *     video-first layout, independent of both APIs above.
 *
 * Exiting is always possible: the fullscreen change event, an orientation
 * change, and the explicit close button all call `exit`.
 */
export function useImmersiveMode(stageRef: React.RefObject<HTMLElement | null>): ImmersiveApi {
  const isFullscreen = useCallback(() => {
    if (typeof document === "undefined") return false;
    const fullscreenDocument = document as FullscreenDocument;
    return Boolean(
      document.fullscreenElement ?? fullscreenDocument.webkitFullscreenElement,
    );
  }, []);

  const exit = useCallback(async () => {
    const fullscreenDocument = document as FullscreenDocument;

    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
    } else if (fullscreenDocument.webkitFullscreenElement) {
      fullscreenDocument.webkitExitFullscreen?.();
    }

const orientation = getOrientation();
    try {
      orientation?.unlock?.();
    } catch {
      // Unlocking throws when no lock is held; nothing to recover from.
    }
  }, []);

  const enter = useCallback(async () => {
    const stage = stageRef.current as FullscreenElement | null;
    if (!stage) return;

    try {
      if (stage.requestFullscreen) {
        await stage.requestFullscreen();
      } else if (stage.webkitRequestFullscreen) {
        await stage.webkitRequestFullscreen();
      }
    } catch {
      // A fullscreen request can be rejected (no user gesture, iframe policy).
      // The immersive layout still applies without it.
    }

    // Must be requested from inside the fullscreen promise chain on some browsers.
    try {
      await getOrientation()?.lock?.("landscape");
    } catch {
      // No orientation lock available — iOS Safari, or a desktop browser.
      // Fullscreen plus the landscape media query is the fallback.
    }
  }, [stageRef]);

  useEffect(() => {
    function handleChange() {
      if (isFullscreen()) return;
      try {
        getOrientation()?.unlock?.();
      } catch {
        // Unlocking throws when no lock is held; nothing to recover from.
      }
    }

    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
    };
  }, [isFullscreen]);

  return { isFullscreen, enter, exit };
}