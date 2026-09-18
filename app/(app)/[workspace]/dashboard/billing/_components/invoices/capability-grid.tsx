"use client";

import { cn } from "@/lib/utils";
import {
  resolveCapabilityStyle,
} from "@/lib/icon-maps";

export interface CapabilityItem {
  description: string;
  detail?: string;
  featureKey?: string;
  code?: string;
}

/**
 * Split a list into evenly sized columns, preserving declaration order so the
 * backend's `PlanFeature.order` still reads top-to-bottom, column by column.
 *
 * With 6 items and 2 columns this yields 3 + 3; with 7 it yields 4 + 3. Empty
 * trailing columns are dropped by the caller, so a single capability falls back
 * to a full-width row instead of a stray table divider.
 */
export function splitIntoColumns<T>(items: T[], columnCount = 2): T[][] {
  if (columnCount < 2) return items.length ? [items] : [];
  const perColumn = Math.ceil(items.length / columnCount);
  if (perColumn === 0) return [];

  return Array.from({ length: columnCount }, (_, index) =>
    items.slice(index * perColumn, (index + 1) * perColumn),
  );
}

function CapabilityRow({ item }: { item: CapabilityItem }) {
  const { icon: Icon, iconBg, iconColor } = resolveCapabilityStyle(
    item.featureKey,
  );
  const title = item.description || item.featureKey || "Included capability";

  return (
    <div className="p-5 hover:bg-slate-50/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-xl mt-0.5", iconBg, iconColor)}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">{title}</h4>
          {item.detail ? (
            <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the "Included Package Capabilities" body: the incoming capabilities
 * laid out as two columns on `md+`, each column separated by the same
 * `divide-slate-100` rules the panel used when it was hardcoded.
 */
export function CapabilityGrid({ items }: { items: CapabilityItem[] }) {
  const columns = splitIntoColumns(items).filter(
    (column) => column.length > 0,
  );

  if (columns.length === 0) {
    return (
      <p className="p-6 text-xs text-slate-500">
        No capabilities are attached to this plan yet.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 divide-y divide-slate-100 md:divide-y-0",
        columns.length > 1 && "md:grid-cols-2 md:divide-x",
      )}
    >
      {columns.map((column, columnIndex) => (
        <div key={columnIndex} className="divide-y divide-slate-100">
          {column.map((item, itemIndex) => (
            <CapabilityRow
              key={item.code ?? item.featureKey ?? itemIndex}
              item={item}
            />
          ))}
        </div>
      ))}
    </div>
  );
}