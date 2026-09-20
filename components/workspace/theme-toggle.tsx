"use client";

import { useSyncExternalStore } from "react";

import { Moon, Sun } from "@/lib/icons";

const THEME_KEY = "theme";
const CHANGE_EVENT = "vs:theme-change";

const getSnapshot = () => document.documentElement.classList.contains("dark");
const getServerSnapshot = () => false;

const subscribe = (onChange: () => void) => {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
};

const emitChange = () => {
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

/**
 * Global visual-theme switch for the workspace top navigation.
 *
 * Applies the `dark` class on `document.documentElement` (matching the
 * FOUC-guard inline script in the root layout, which reads the same
 * `localStorage["theme"]` key) and persists the choice so it applies across
 * every page — including the checkout flows. The current theme is read from
 * the DOM, not mirrored in React state, so it stays in sync no matter where
 * it is changed.
 */
export function ThemeToggle() {
  const isDark = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const toggle = () => {
    const next = !getSnapshot();
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      /* ignore */
    }
    emitChange();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-input/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}