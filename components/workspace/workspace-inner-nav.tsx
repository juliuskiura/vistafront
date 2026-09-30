"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { InnerNavItemLink } from "./inner-nav-item-link";

export interface InnerNavItem {
  label: string;
  /** Path fragment after `basePath`. Empty string means the section home. */
  href: string;
  icon: LucideIcon;
  /** Exact-match basePath (used for the section home item). */
  end?: boolean;
  /**
   * Supporting line under the label in menus. Omit it and the row stays one
   * line tall, so a menu can mix plain navigation with described actions.
   */
  description?: string;
  /** Tinted badge behind the icon in menus. Supplied with `iconColor`. */
  iconBg?: string;
  /** Accent for the icon inside that badge. Supplied with `iconBg`. */
  iconColor?: string;
}

export interface InnerNavGroup {
  label: string;
  icon: LucideIcon;
  items: InnerNavItem[];
  /**
   * Paint the trigger as a primary action rather than a nav section. Used for
   * menus that hold shortcuts ("Quick Actions") instead of sub-pages, so the
   * header says which one is a shortcut before it is opened.
   */
  accent?: boolean;
}

interface WorkspaceInnerNavProps {
  basePath: string;
  brandLabel: string;
  brandIcon: LucideIcon;
  /** Grouped nav — desktop dropdowns + grouped mobile menu. */
  groups?: InnerNavGroup[];
  /** Flat nav — desktop pills + simple mobile menu. */
  items?: InnerNavItem[];
  /** Right-aligned slot for desktop. Hide on mobile from the caller. */
  trailing?: React.ReactNode;
  /** Hide the brand/home link (used when the section has its own home item). */
  hideBrand?: boolean;
}

export function WorkspaceInnerNav({
  basePath,
  brandLabel,
  brandIcon: BrandIcon,
  groups,
  items,
  trailing,
  hideBrand = false,
}: WorkspaceInnerNavProps) {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  function itemHref(item: InnerNavItem): string {
    return item.href ? `${basePath}${item.href}` : basePath;
  }

  function itemActive(item: InnerNavItem): boolean {
    const full = itemHref(item);
    if (item.end) return pathname === full;
    return pathname === full || pathname.startsWith(full + "/");
  }

  const groupItems = groups ?? [];
  const flatItems = items ?? [];

  const activeGroup = groupItems.find((g) => g.items.some(itemActive));
  const activeItem = flatItems.find(itemActive);

  // A flat item is a primary section, so it wins the mobile trigger's label: a
  // section whose name also appears in a shortcut menu (Social Manager's
  // "Calendar") should still read as "Calendar" in the collapsed control, not
  // as the name of the menu that happens to contain it.
  const mobileTriggerLabel =
    activeItem?.label ?? activeGroup?.label ?? brandLabel;
  const MobileTriggerIcon =
    activeItem?.icon ?? (activeGroup ? activeGroup.icon : undefined) ?? BrandIcon;

  const anyOpen = mobileOpen || openGroup !== null;

  return (
    <>
      {anyOpen && (
        <div
          className="fixed inset-0 z-10"
          aria-hidden
          onClick={() => {
            setOpenGroup(null);
            setMobileOpen(false);
          }}
        />
      )}

      <nav className="sticky -top-4 z-20 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:-top-6 md:px-6">
        {hideBrand ? null : (
          <Link
            href={basePath}
            className="flex shrink-0 items-center gap-2 pr-1 text-sm font-bold tracking-tight text-slate-900 hover:text-primary-600 dark:text-slate-100 dark:hover:text-primary-400"
          >
            <BrandIcon className="h-4 w-4 text-primary-500" />
            {brandLabel}
          </Link>
        )}

        <div className="hidden flex-1 flex-wrap items-center gap-1 md:flex" aria-label={brandLabel}>
          {flatItems.map((item) => {
            const active = itemActive(item);
            return (
              <Link
                key={item.href || item.label}
                href={itemHref(item)}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
          {groupItems.map((group) => {
            const isOpen = openGroup === group.label;
            const groupActive = group.items.some(itemActive);
            // Described items make the menu wider than its trigger, so it hangs
            // off the trigger's right edge instead of stretching to match it.
            // Plain sub-sections keep the original stretch-to-trigger width.
            const described = group.items.some((item) => item.description);
            return (
              <div key={group.label} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroup((prev) => (prev === group.label ? null : group.label))
                  }
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    group.accent
                      ? "bg-primary-600 text-white shadow-sm hover:bg-primary-500"
                      : groupActive
                        ? "bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
                  )}
                >
                  <group.icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{group.label}</span>
                  <svg
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 transition-transform",
                      isOpen && "rotate-180",
                      group.accent && "text-white/80",
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div
                    className={cn(
                      "absolute z-30 mt-1 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900",
                      described ? "right-0 min-w-[16rem]" : "left-0 right-0 min-w-[12rem]",
                    )}
                  >
                    {group.items.map((item) => (
                      <InnerNavItemLink
                        key={item.href || item.label}
                        item={item}
                        href={itemHref(item)}
                        active={itemActive(item)}
                        onNavigate={() => setOpenGroup(null)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="relative flex-1 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={mobileOpen}
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <span className="flex items-center gap-2 truncate">
              <MobileTriggerIcon className="h-4 w-4 shrink-0" />
              {mobileTriggerLabel}
            </span>
            <svg
              className={`h-4 w-4 shrink-0 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {mobileOpen && (
            <div className="absolute left-0 right-0 z-30 mt-1 max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              {flatItems.map((item) => (
                <InnerNavItemLink
                  key={item.href || item.label}
                  item={item}
                  href={itemHref(item)}
                  active={itemActive(item)}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
              {groupItems.map((group) => {
                if (group.items.length === 0) return null;
                return (
                  <div key={group.label}>
                    <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {group.label}
                    </p>
                    {group.items.map((item) => (
                      <InnerNavItemLink
                        key={item.href || item.label}
                        item={item}
                        href={itemHref(item)}
                        active={itemActive(item)}
                        onNavigate={() => setMobileOpen(false)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {trailing}
      </nav>
    </>
  );
}