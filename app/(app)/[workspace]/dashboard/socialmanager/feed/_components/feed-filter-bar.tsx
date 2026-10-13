"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Search, X } from "@/lib/icons";
import { PlatformGlyph, usePlatformStyleResolver } from "@/components/platform-icon";
import { usePlatformBrand } from "@/lib/social/platform-brand-context";
import { cn } from "@/lib/utils";
import {
  hasActiveFilters,
  type FeedFilters,
  type FeedChannelChip,
} from "../lib/feed-filters";

/** How long the search box waits after the last keystroke before it becomes a
 *  filter. The field stays responsive because the feed does not. */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Search, channel chips, status and sort.
 *
 * Every control writes the URL rather than component state, so a filtered feed
 * is a link: shareable, bookmarkable, and correct after a refresh or a Back
 * press. The search box is the one control whose value lags (it is debounced),
 * so it is echoed from the filter it wrote rather than the other way round.
 *
 * There are two filters by design, not one combined panel: channel chips above
 * the feed and a status/sort pair in the rail, because that is where each is
 * looked for. Neither one resets the other.
 */
export function FeedFilterBar({
  filters,
  chips,
  sort,
  onSortChange,
}: {
  filters: FeedFilters;
  chips: FeedChannelChip[];
  sort: "recent" | "popular";
  onSortChange: (sort: "recent" | "popular") => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { brandOf } = usePlatformBrand();
  const styleOf = usePlatformStyleResolver();
  const [term, setTerm] = useState(filters.q);
  // The URL is the source of truth for what the feed is filtered on, while the
  // box holds what the user is typing. When the committed term changes from
  // outside — Clear all, a Back press, a link — the box follows it, and this
  // render-phase adjustment is React's own recommended way to resync on a prop
  // change rather than an effect that re-renders twice.
  const [committed, setCommitted] = useState(filters.q);
  if (filters.q !== committed) {
    setCommitted(filters.q);
    setTerm(filters.q);
  }

  // Debounce the term into the URL. `replace` rather than `push`, so typing a
  // query does not fill the history stack with one entry per keystroke.
  useEffect(() => {
    if (term === filters.q) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (term.trim()) next.set("q", term.trim());
      else next.delete("q");
      router.replace(`?${next.toString()}`, { scroll: false });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term, filters.q, router, searchParams]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const clearAll = () => {
    setTerm("");
    // The entry-post marker survives: clearing filters must not lose the card
    // the user was sent to look at.
    const next = new URLSearchParams();
    if (filters.post) next.set("post", filters.post);
    const query = next.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            aria-label="Search loaded posts"
            placeholder="Search loaded posts…"
            className="h-9 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-800 shadow-xs placeholder:text-neutral-400 focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:outline-none"
          />
        </div>

        <label className="sr-only" htmlFor="feed-sort">
          Sort
        </label>
        <select
          id="feed-sort"
          value={sort}
          onChange={(event) =>
            onSortChange(event.target.value as "recent" | "popular")
          }
          className="h-9 rounded-lg border border-neutral-200 bg-white px-2.5 text-sm text-neutral-700 shadow-xs focus-visible:border-primary-500 focus-visible:outline-none"
        >
          <option value="recent">Most recent</option>
          <option value="popular">Most engagement</option>
        </select>

        {hasActiveFilters(filters) && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
          >
            <X className="size-3.5" />
            Clear all
          </button>
        )}
      </div>

      {chips.length > 1 && (
        <div
          role="group"
          aria-label="Filter by channel"
          className="flex flex-wrap items-center gap-1.5"
        >
          <Chip
            active={!filters.channel}
            onClick={() => setParam("channel", "")}
            label="All channels"
          />
          {chips.map((chip) => {
            const style = styleOf(chip.platform);
            return (
              <Chip
                key={chip.value}
                active={filters.channel === chip.value}
                onClick={() => setParam("channel", chip.value)}
                label={chip.label}
                glyph={
                  <PlatformGlyph
                    platform={brandOf(chip.platform)}
                    size="sm"
                    solid
                    className={cn("shrink-0", style.color)}
                  />
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  glyph,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  glyph?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
        active
          ? "border-primary-300 bg-primary-50 text-primary-700"
          : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
      )}
    >
      {glyph}
      {label}
    </button>
  );
}
