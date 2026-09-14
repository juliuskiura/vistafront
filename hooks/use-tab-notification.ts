"use client";

import { useCallback, useEffect, useRef } from "react";

const NOTIFICATION_TITLES = ["New message", "Chat message"];

export function useTabNotification(defaultTitle?: string) {
  const originalTitleRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const titleIndexRef = useRef(0);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (originalTitleRef.current !== null) {
      document.title = originalTitleRef.current;
      originalTitleRef.current = null;
    }
  }, []);

  const notify = useCallback(() => {
    if (originalTitleRef.current === null) {
      originalTitleRef.current = document.title;
    }
    if (intervalRef.current) return;

    titleIndexRef.current = 0;
    document.title = NOTIFICATION_TITLES[titleIndexRef.current];
    intervalRef.current = setInterval(() => {
      titleIndexRef.current = (titleIndexRef.current + 1) % NOTIFICATION_TITLES.length;
      document.title = NOTIFICATION_TITLES[titleIndexRef.current];
    }, 900);
  }, []);

  useEffect(() => {
    return () => {
      stop();
      if (defaultTitle) document.title = defaultTitle;
    };
  }, [defaultTitle, stop]);

  return { notify, clear: stop };
}