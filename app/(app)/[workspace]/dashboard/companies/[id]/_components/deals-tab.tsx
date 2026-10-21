"use client";

import Link from "next/link";

import type { Deal } from "@/lib/api";
import { formatMediumDate } from "@/lib/dates";
import { EmptyTab, TabCard } from "./record-list";

interface Props {
  company: { nanoid: string; name: string };
  workspaceDomain: string;
  deals: Deal[];
}

/**
 * The deals tab.
 *
 * The deals on this company, each linking to its detail view.
 */
export function DealsTab({ workspaceDomain, deals }: Props) {
  if (deals.length === 0) {
    return (
      <EmptyTab
        title="No deals yet"
        description="Create a deal from the Pipeline board to link it to this company."
      />
    );
  }

  return (
    <TabCard title="Deals" description={`${deals.length} in pipeline`}>
      {deals.map((d) => (
        <div key={d.nanoid} className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <Link
              href={`/${workspaceDomain}/dashboard/deals/${d.nanoid}`}
              className="truncate text-sm font-medium hover:underline"
            >
              {d.title}
            </Link>
            <p className="text-xs text-muted-foreground">
              {d.stage}
              {d.expected_close_date
                ? ` · closes ${formatMediumDate(d.expected_close_date)}`
                : ""}
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold">
            {d.value > 0 ? formatCurrency(d.value) : "—"}
          </span>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
            {d.status}
          </span>
        </div>
      ))}
    </TabCard>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
