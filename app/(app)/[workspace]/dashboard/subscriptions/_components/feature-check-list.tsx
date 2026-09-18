"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { RegistryFeature } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  /** Registered features shown as rows. */
  options: RegistryFeature[];
  /**
   * Feature keys already on the plan. They render with a checkmark and no
   * checkbox, so they can never be submitted again.
   */
  addedKeys: string[];
  /** Currently selected (checkbox-on) keys. */
  selected: string[];
  onToggle: (key: string) => void;
  invalid?: boolean;
}

/**
 * Multi-select checklist over the registered subscription features.
 *
 * Rows already on the plan (in `addedKeys`) are read-only: they show a
 * checkmark instead of a checkbox. Every other row carries a checkbox; the
 * parent controls single- vs multi-select semantics through `onToggle`.
 */
export function FeatureCheckList({
  options,
  addedKeys,
  selected,
  onToggle,
  invalid,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.key.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q),
    );
  }, [options, search]);

  return (
    <div aria-invalid={invalid}>
      {options.length > 6 ? (
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search features…"
            className="h-8 pl-7 text-xs"
          />
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="px-2 py-6 text-center text-xs text-muted-foreground">
          {options.length === 0
            ? "No features are registered."
            : "No features match your search."}
        </p>
      ) : (
        <div className="max-h-[40vh] overflow-y-auto rounded-md border">
          <div className="space-y-0.5 p-1">
            {filtered.map((option) => {
              const alreadyAdded = addedKeys.includes(option.key);
              const checked = selected.includes(option.key);
              return (
                <label
                  key={option.key}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-2 transition-colors",
                    alreadyAdded
                      ? "cursor-default opacity-60 hover:bg-transparent"
                      : "hover:bg-muted",
                  )}
                >
                  {alreadyAdded ? (
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                      <Check className="size-4 text-emerald-600" />
                    </span>
                  ) : (
                    <input
                      type="checkbox"
                      name="feature"
                      value={option.key}
                      checked={checked}
                      onChange={() => onToggle(option.key)}
                      className="mt-0.5 size-4 shrink-0 rounded border-input"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-medium">
                        {option.label}
                      </span>
                      {option.app_key ? (
                        <Badge
                          variant="outline"
                          className="px-1.5 py-0 text-[10px] font-normal"
                        >
                          {option.app_key}
                        </Badge>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[11px] text-muted-foreground">
                      {option.key}
                    </span>
                    {option.description ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    ) : null}
                    {alreadyAdded ? (
                      <span className="mt-0.5 block text-[11px] font-medium text-emerald-600">
                        Already on this plan
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}