"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { resolveIcon } from "@/lib/nav-icons";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardError } from "@/components/dashboard/dashboard-error";
import type {
  DashboardActionData,
  DashboardRecentData,
  DashboardStatData,
  DashboardWidget,
} from "@/lib/api";

/**
 * What the dashboard page passes down. `widgets` is the success path
 * (an array — possibly empty). `error` is the failure path with a
 * developer-friendly message. We never collapse an error into `widgets=[]`
 * because that would silently render the "empty" state when the API
 * actually failed.
 */
type DashboardData =
  | { kind: "ok"; widgets: DashboardWidget[] }
  | { kind: "error"; title: string; message: string; hint?: string };

interface Props {
  data: DashboardData;
}

function StatWidgetCard({ widget }: { widget: DashboardWidget }) {
  const router = useRouter();
  const Icon = resolveIcon(widget.icon);
  const data = widget.data as DashboardStatData;

  return (
    <StatCard
      title={widget.label}
      value={data.value}
      icon={<Icon size={20} />}
      accent={widget.accent}
      hint={data.subtitle ?? undefined}
      onClick={widget.to ? () => router.push(widget.to!) : undefined}
    />
  );
}

function RecentWidgetCard({ widget }: { widget: DashboardWidget }) {
  const router = useRouter();
  const data = widget.data as DashboardRecentData;
  return (
    <Card className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
      <h2 className="mb-1 text-base font-semibold">{data.title || widget.label}</h2>
      {data.items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Nothing here yet.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {data.items.map((item, i) => (
            <div
              key={`${widget.id}-${i}`}
              role="button"
              tabIndex={0}
              onClick={() => router.push(item.to)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(item.to);
                }
              }}
              className="flex cursor-pointer items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ActionWidgetCard({
  widget,
  actions,
}: {
  widget: DashboardWidget;
  actions: DashboardActionData["items"];
}) {
  const router = useRouter();
  return (
    <Card className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1 bg-accent" />
      <h2 className="mb-1 text-base font-semibold">
        {widget.data && (widget.data as DashboardActionData).title
          ? (widget.data as DashboardActionData).title
          : widget.label}
      </h2>
      <div className="mt-3 space-y-2">
        {actions.map((item, i) => (
          <Button
            key={`${item.label}-${i}`}
            type="button"
            variant={
              (item.variant as
                | "default"
                | "secondary"
                | "outline"
                | "ghost"
                | "destructive"
                | "link") ?? "default"
            }
            className={cn("w-full justify-start rounded-lg text-sm font-medium")}
            onClick={() => router.push(item.to)}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="rounded-xl border bg-card p-10 text-center shadow-sm">
      <h2 className="text-lg font-semibold">Your dashboard is empty</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Add an app from the workspace app catalog to start tracking your
        business from here.
      </p>
    </Card>
  );
}

export function DashboardWidgets({ data }: Props) {
  if (data.kind === "error") {
    return (
      <DashboardError
        title={data.title}
        message={data.message}
        hint={data.hint}
      />
    );
  }

  const ordered = useMemo(
    () => [...data.widgets].sort((a, b) => a.order - b.order),
    [data.widgets],
  );

  if (ordered.length === 0) {
    return <EmptyState />;
  }

  const stats = ordered.filter((w) => w.kind === "stat");
  const recents = ordered.filter((w) => w.kind === "recent");
  const actions = ordered.filter((w) => w.kind === "actions");
  const allActionItems = actions.flatMap(
    (w) => (w.data as DashboardActionData).items,
  );

  return (
    <div className="space-y-6">
      {stats.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((w) => (
            <StatWidgetCard key={w.id} widget={w} />
          ))}
        </div>
      )}

      {(recents.length > 0 || actions.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {recents.map((w) => (
            <RecentWidgetCard key={w.id} widget={w} />
          ))}
          {actions.length > 0 && (
            <ActionWidgetCard
              widget={actions[0]}
              actions={allActionItems}
            />
          )}
        </div>
      )}
    </div>
  );
}
