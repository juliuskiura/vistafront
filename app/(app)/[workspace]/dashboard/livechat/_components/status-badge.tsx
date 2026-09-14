"use client";

import { CheckCircle2, XCircle } from "lucide-react";

export interface StatusBadgeProps {
  isActive: boolean;
  icon?: boolean;
}

export function StatusBadge({ isActive, icon = true }: StatusBadgeProps) {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">
        {icon ? <CheckCircle2 className="h-3 w-3" /> : null}
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-500">
      {icon ? <XCircle className="h-3 w-3" /> : null}
      Closed
    </span>
  );
}
