"use client";

type PriorityLevel = "low" | "medium" | "high" | "critical";

interface PriorityConfig {
  level: PriorityLevel;
  label: string;
  className: string;
  dotClassName: string;
}

const PRIORITY_BY_COUNT: PriorityConfig[] = [
  { level: "critical", label: "Critical", className: "bg-red-100 text-red-700", dotClassName: "bg-red-500" },
  { level: "high", label: "High", className: "bg-orange-100 text-orange-700", dotClassName: "bg-orange-500" },
  { level: "medium", label: "Medium", className: "bg-amber-100 text-amber-700", dotClassName: "bg-amber-500" },
  { level: "low", label: "Low", className: "bg-slate-100 text-slate-600", dotClassName: "bg-slate-400" },
];

function derivePriority(unreadCount: number): PriorityConfig {
  if (unreadCount >= 10) return PRIORITY_BY_COUNT[0];
  if (unreadCount >= 5) return PRIORITY_BY_COUNT[1];
  if (unreadCount >= 1) return PRIORITY_BY_COUNT[2];
  return PRIORITY_BY_COUNT[3];
}

export interface PriorityBadgeProps {
  unreadCount: number;
  icon?: boolean;
}

export function PriorityBadge({ unreadCount, icon = true }: PriorityBadgeProps) {
  const config = derivePriority(unreadCount);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {icon ? <span className={`h-1.5 w-1.5 rounded-full ${config.dotClassName}`} /> : null}
      {config.label}
    </span>
  );
}

export { derivePriority, PRIORITY_BY_COUNT };
export type { PriorityLevel };
