"use client";

import { useEffect } from "react";

/**
 * Hold a Screen Wake Lock while `active` — keeps the display awake during cook
 * mode so a countdown or a recipe step stays visible with hands in the dough.
 *
 * Degrades silently where the API is unsupported or the request is denied. Re-
 * acquires on tab re-focus, since the browser drops the lock when the page is
 * hidden.
 */
export function useWakeLock(active = true) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined") return;

    const wakeLock = (
      navigator as Navigator & {
        wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> };
      }
    ).wakeLock;
    if (!wakeLock) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const lock = await wakeLock.request("screen");
        if (cancelled) {
          lock.release().catch(() => {});
          return;
        }
        sentinel = lock;
      } catch {
        // Unsupported, denied, or the document isn't visible — no-op.
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible" && !sentinel) acquire();
    };

    acquire();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      sentinel?.release().catch(() => {});
      sentinel = null;
    };
  }, [active]);
}
