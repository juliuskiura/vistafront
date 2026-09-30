"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { InnerNavItem } from "./workspace-inner-nav";

/**
 * One row of an inner-nav menu — the desktop group dropdown and the mobile
 * sheet both render their items through here, so a group looks the same in
 * either place and a fix to the row lands in both at once.
 *
 * Two optional fields decide the row's shape, and both are omitted by the
 * plain navigation sections (Media's "Library", Live Chat's "Rooms"):
 *
 *  • `iconBg` + `iconColor` — the item carries its own accent and gets a
 *    tinted badge around the icon. This is what makes a "Quick Actions" menu
 *    read as a set of shortcuts rather than more navigation.
 *  • `description` — a supporting line under the label. Items without one stay
 *    on a single line, so a menu mixing both kinds keeps even row heights.
 */
export function InnerNavItemLink({
  item,
  href,
  active,
  onNavigate,
}: {
  item: InnerNavItem;
  href: string;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const tinted = Boolean(item.iconBg && item.iconColor);
  const described = Boolean(item.description);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
        described && "items-start",
        active
          ? "bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
      )}
    >
      {tinted ? (
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            described && "mt-0.5",
            item.iconBg,
            item.iconColor,
          )}
        >
          <Icon className="size-4" />
        </span>
      ) : (
        <Icon className={cn("h-4 w-4 shrink-0", described && "mt-1")} />
      )}

      <span className="min-w-0 flex-1">
        <span className="block truncate">{item.label}</span>
        {item.description && (
          <span className="mt-0.5 block text-xs font-normal text-slate-500 dark:text-slate-400">
            {item.description}
          </span>
        )}
      </span>
    </Link>
  );
}
