"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Error boundary for the authenticated (app) segment.
 *
 * The important arrival here is `ServerUnavailableError` from
 * `getAuthUser()`: Django answered `429`/`5xx` on every retry. That is NOT
 * a dead session -- the user's cookies are untouched -- so the boundary
 * offers a retry instead of the old behaviour (redirect to /login, which
 * destroyed a perfectly valid session).
 *
 * `reset()` re-renders the segment. By the time the user clicks it, the
 * throttle window (60s) has usually slid and the render succeeds. Any
 * other error that reaches this boundary is also retryable by definition,
 * so the UI is the same; the exact message is only shown in development.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App segment error:", error);
  }, [error]);

  const isUnavailable = (error as Error & { name?: string })?.name ===
    "ServerUnavailableError";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        {isUnavailable ? "The server is busy" : "Something went wrong"}
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {isUnavailable
          ? "We're getting a lot of traffic right now. Your session is safe — try again in a moment."
          : "An unexpected error occurred while loading this page. Your session is safe — try again in a moment."}
      </p>
      <Button className="mt-6" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
