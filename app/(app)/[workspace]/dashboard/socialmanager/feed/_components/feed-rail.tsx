"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { PenLine } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import {
  FEED_STATUSES,
  statusLabel,
  type FeedFilters,
} from "../lib/feed-filters";

/**
 * The right rail: the status filter and the way into the real composer.
 *
 * No mini-composer, on purpose. A composer needs media, per-channel tailoring,
 * scheduling and first-comments — all of which live in `compose/` and have been
 * built once. A small textarea here would either be a worse composer or a
 * second one to keep correct, and it is the shortcut nobody asked for once they
 * see what the real one does.
 *
 * Status lives here rather than beside the channel chips so each control has one
 * home: the chips answer "which channel?", this answers "which kind of post?".
 */
export function FeedRail({
  filters,
  workspaceSlug,
}: {
  filters: FeedFilters;
  workspaceSlug: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setStatus = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value && value !== "published") next.set("status", value);
    else next.delete("status");
    const query = next.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  };

  const activeStatus = filters.status || "published";

  return (
    <aside className="space-y-4 lg:sticky lg:top-6">
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
        <h2 className="text-sm font-semibold text-neutral-900">
          Post status
        </h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          The feed opens on what has reached the platforms.
        </p>
        <div className="mt-3 space-y-1">
          {FEED_STATUSES.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={activeStatus === option.value}
              onClick={() => setStatus(option.value)}
              className={
                activeStatus === option.value
                  ? "flex w-full items-center justify-between rounded-lg bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700"
                  : "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
              }
            >
              {option.label}
            </button>
          ))}
        </div>
        {filters.status && filters.status !== "published" && (
          <p className="mt-2 text-[11px] text-neutral-400">
            Showing {statusLabel(filters.status).toLowerCase()} posts only.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
        <h2 className="text-sm font-semibold text-neutral-900">
          Publish something
        </h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          Plan, tailor per channel, and schedule from the composer.
        </p>
        <Button asChild className="mt-3 w-full gap-2">
          <Link
            href={`/${workspaceSlug}/dashboard/socialmanager/compose`}
          >
            <PenLine className="size-4" />
            New Post
          </Link>
        </Button>
      </section>
    </aside>
  );
}
