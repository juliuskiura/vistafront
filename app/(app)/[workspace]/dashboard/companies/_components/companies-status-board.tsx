"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BOARD_STATUSES,
  PROSPECT_LABELS,
  STATUS_COLORS,
} from "@/lib/crm/constants";
import type { CompanyStatusBreakdown, ProspectStatus } from "@/lib/api";

interface Props {
  breakdown: CompanyStatusBreakdown;
  /** The currently selected status, if any. */
  activeStatus: string;
  onStatusToggle: (status: ProspectStatus) => void;
}

/**
 * The per-stage company counts.
 *
 * The numbers come from the backend's `status_breakdown` endpoint, which
 * counts against the *same* filters as the list but ignores the status
 * filter itself — so the cards stay stable while the user narrows the
 * table.
 */
export function CompaniesStatusBoard({
  breakdown,
  activeStatus,
  onStatusToggle,
}: Props) {
  const totalCount = breakdown.total;
  const selected = activeStatus ? activeStatus.split(",") : [];

  return (
    <section aria-label="Status breakdown" className="space-y-2">
      <h2 className="sr-only">Companies by status</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {BOARD_STATUSES.map((s) => {
          const count = breakdown.counts[s] ?? 0;
          const pct = totalCount ? Math.round((count / totalCount) * 100) : 0;
          const isActive = selected.includes(s);
          return (
            <Card
              key={s}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              onClick={() => onStatusToggle(s)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onStatusToggle(s);
                }
              }}
              className={`cursor-pointer transition-colors ${
                isActive
                  ? "border-primary bg-primary/10 ring-2 ring-primary/40"
                  : "hover:bg-muted/40"
              }`}
            >
              <CardHeader>
                <CardTitle className="capitalize">
                  {PROSPECT_LABELS[s]}
                </CardTitle>
                <CardAction>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[s]}`}
                  >
                    {pct}%
                  </span>
                </CardAction>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-bold">{count}</span>
                <p className="mt-1 text-xs text-muted-foreground">
                  {count === 1 ? "company" : "companies"}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
