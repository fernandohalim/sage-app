"use client";

import { useSyncExternalStore } from "react";

type Mode = "light" | "dark";

const THEME_EVENT = "sage-theme-change";

function subscribe(callback: () => void): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    mq.removeEventListener("change", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

function getSnapshot(): Mode {
  const el = document.documentElement;
  if (el.classList.contains("dark")) return "dark";
  if (el.classList.contains("light")) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Stable value for SSR; the real mode is read after hydration.
function getServerSnapshot(): Mode {
  return "light";
}

export function ThemeToggle() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Mode = mode === "dark" ? "light" : "dark";
    const el = document.documentElement;
    el.classList.remove("light", "dark");
    el.classList.add(next);
    try {
      localStorage.setItem("sage-theme", next);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  const isDark = mode === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink/30 hover:text-ink"
    >
      <span aria-hidden className="text-base leading-none">
        {isDark ? "☀" : "☾"}
      </span>
    </button>
  );
}
