import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatAccent =
  | "primary"
  | "secondary"
  | "accent"
  | "gold"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | string;

const ACCENT_MAP: Record<string, { bar: string; chip: string; icon: string }> = {
  primary: {
    bar: "bg-primary",
    chip: "bg-primary/10 text-primary",
    icon: "text-primary",
  },
  secondary: {
    bar: "bg-secondary",
    chip: "bg-secondary/10 text-secondary",
    icon: "text-secondary",
  },
  accent: {
    bar: "bg-primary",
    chip: "bg-primary/10 text-primary",
    icon: "text-primary",
  },
  gold: {
    bar: "bg-gold",
    chip: "bg-gold/10 text-gold-foreground",
    icon: "text-gold-foreground",
  },
  info: {
    bar: "bg-info",
    chip: "bg-info/10 text-info",
    icon: "text-info",
  },
  success: {
    bar: "bg-success",
    chip: "bg-success/10 text-success",
    icon: "text-success",
  },
  warning: {
    bar: "bg-warning",
    chip: "bg-warning/10 text-warning",
    icon: "text-warning",
  },
  danger: {
    bar: "bg-destructive",
    chip: "bg-destructive/10 text-destructive",
    icon: "text-destructive",
  },
};

const FALLBACK_ACCENT = ACCENT_MAP.primary;

export function resolveAccent(name: string | null | undefined) {
  if (!name) return FALLBACK_ACCENT;
  return ACCENT_MAP[name] ?? FALLBACK_ACCENT;
}

interface StatCardProps {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: StatAccent;
  hint?: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Premium stat card used on the workspace dashboard.
 *
 * 1px top accent bar (color comes from the accent), rounded-xl border,
 * 1px shadow, hover lift to -translate-y-0.5 + shadow-md. The icon lives
 * in a 10×10 rounded-xl chip whose colors track the same accent.
 */
export function StatCard({
  title,
  value,
  icon,
  accent = "primary",
  hint,
  onClick,
  className,
}: StatCardProps) {
  const a = resolveAccent(accent);
  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-1", a.bar)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1.5 text-3xl font-semibold tracking-tight">{value}</p>
          {hint && (
            <div className={cn("mt-1.5 text-xs font-medium", a.icon)}>{hint}</div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              a.chip,
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
