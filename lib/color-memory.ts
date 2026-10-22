"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "vistafront:recent-colors";
const MAX_RECENT_COLORS = 12;
const CHANGE_EVENT = "vistafront:recent-colors-changed";

function readStored(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function writeStored(colors: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  } catch {
    // Storage can be unavailable (private mode, quota); keep in-memory only.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: colors }));
}

export function normalizeColor(color: string): string {
  return color.trim().toLowerCase();
}

export function getRecentColors(): string[] {
  return readStored();
}

export function rememberColor(color: string): string[] {
  const normalized = normalizeColor(color);
  if (!normalized) return readStored();
  const next = [
    normalized,
    ...readStored().filter(
      (existing) => normalizeColor(existing) !== normalized,
    ),
  ].slice(0, MAX_RECENT_COLORS);
  writeStored(next);
  return next;
}

export function rememberColorsFromHtml(html: string): string[] {
  if (!html || typeof window === "undefined") return readStored();
  const found = new Set<string>();
  const pattern =
    /(?:^|[\s;])(?:color|background-color)\s*:\s*(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]*\)|hsl[a]?\([^)]*\))/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    found.add(match[2] ?? match[1]);
  }
  let next = readStored();
  for (const color of found) {
    const normalized = normalizeColor(color);
    if (!next.some((existing) => normalizeColor(existing) === normalized)) {
      next = [normalized, ...next];
    }
  }
  next = next.slice(0, MAX_RECENT_COLORS);
  if (JSON.stringify(next) !== JSON.stringify(readStored())) {
    writeStored(next);
  }
  return next;
}

export function clearRecentColors(): void {
  writeStored([]);
}

export function useRecentColors(): string[] {
  const [colors, setColors] = useState<string[]>(() => readStored());

  useEffect(() => {
    const sync = () => setColors(readStored());
    sync();
    window.addEventListener(CHANGE_EVENT, sync as EventListener);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync as EventListener);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return colors;
}

export const useColorMemory = useRecentColors;
