"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RegistryFeature } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  /** The selected registry key (what gets saved to the backend). */
  value: string;
  onChange: (key: string) => void;
  options: RegistryFeature[];
  invalid?: boolean;
  id?: string;
}

/**
 * Rich dropdown over the backend's registered subscription features.
 *
 * The user reads the human `label` + `description`, but the value emitted (and
 * therefore saved as `PlanFeature.feature`) is the registry `key`.
 */
export function FeaturePicker({
  value,
  onChange,
  options,
  invalid,
  id,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const current = useMemo(
    () => options.find((o) => o.key === value) ?? null,
    [options, value],
  );

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

  const select = (key: string) => {
    onChange(key);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-invalid={invalid}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            invalid && "border-destructive",
          )}
        >
          {current ? (
            <span className="min-w-0">
              <span className="block truncate font-medium">{current.label}</span>
              <span className="block truncate font-mono text-[11px] text-muted-foreground">
                {current.key}
              </span>
            </span>
          ) : value ? (
            <span className="min-w-0">
              <span className="block truncate font-medium">{value}</span>
              <span className="block truncate text-[11px] text-amber-600">
                Not in the current registry
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Select a feature…</span>
          )}
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

<PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-2"
        >
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
          <ScrollArea className="max-h-72">
            <div className="space-y-0.5">
              {filtered.map((option) => {
                const selected = option.key === value;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => select(option.key)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted",
                      selected && "bg-muted/60",
                    )}
                  >
                    <Check
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        selected ? "text-emerald-600" : "text-transparent",
                      )}
                    />
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
                    </span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}