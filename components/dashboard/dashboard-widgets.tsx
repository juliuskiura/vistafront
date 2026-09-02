"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, ListChecks, Sparkles, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  DashboardActionData,
  DashboardRecentData,
  DashboardStatData,
  DashboardWidget,
} from "@/lib/api";

interface Props {
  widgets: DashboardWidget[];
}

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  ListChecks,
};

const ACCENT_BG: Record<string, string> = {
  default: "bg-primary/10 text-primary",
  amber: "bg-amber-100 text-amber-900",
  emerald: "bg-emerald-100 text-emerald-900",
  sky: "bg-sky-100 text-sky-900",
  rose: "bg-rose-100 text-rose-900",
};

function accentClass(accent: string) {
  return ACCENT_BG[accent] ?? ACCENT_BG.default;
}

function iconFor(name: string): LucideIcon {
  return ICON_MAP[name] ?? Sparkles;
}

function StatCard({ widget, data }: { widget: DashboardWidget; data: DashboardStatData }) {
  const Icon = iconFor(widget.icon);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={cn(
              "flex size-9 items-center justify-center rounded-lg",
              accentClass(widget.accent),
            )}
          >
            <Icon className="size-4" />
          </span>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {widget.label}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{data.value}</p>
        {data.subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{data.subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function RecentCard({ widget, data }: { widget: DashboardWidget; data: DashboardRecentData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.title || widget.label}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing recent.</p>
        ) : (
          <ul className="divide-y">
            {data.items.map((item) => (
              <li key={`${item.to}-${item.label}`}>
                <Link
                  href={item.to}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-primary"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{item.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.subtitle}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ActionsCard({ widget, data }: { widget: DashboardWidget; data: DashboardActionData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.title || widget.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {data.items.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              className="flex items-center justify-between rounded-lg border bg-background/60 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              <span className="truncate">{item.label}</span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WidgetCard({ widget }: { widget: DashboardWidget }) {
  switch (widget.kind) {
    case "stat":
      return <StatCard widget={widget} data={widget.data as DashboardStatData} />;
    case "recent":
      return <RecentCard widget={widget} data={widget.data as DashboardRecentData} />;
    case "actions":
      return <ActionsCard widget={widget} data={widget.data as DashboardActionData} />;
    default:
      return null;
  }
}

export function DashboardWidgets({ widgets }: Props) {
  const ordered = useMemo(
    () => [...widgets].sort((a, b) => a.order - b.order),
    [widgets],
  );

  if (ordered.length === 0) {
    return (
      <Card>
        <CardContent className="px-6 py-12 text-center">
          <p className="text-base font-medium">Your dashboard is getting ready</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Once your team starts using Vistasolve, you&apos;ll see live
            project, social, and pipeline insights here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ordered.map((widget) => (
        <WidgetCard key={widget.id} widget={widget} />
      ))}
    </div>
  );
}
