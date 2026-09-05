"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

export interface InnerNavItem {
  label: string;
  /** Path fragment after `basePath`. Empty string means the section home. */
  href: string;
  icon: LucideIcon;
  /** Exact-match basePath (used for the section home item). */
  end?: boolean;
}

export interface InnerNavGroup {
  label: string;
  icon: LucideIcon;
  items: InnerNavItem[];
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
}

export function WorkspaceInnerNav({
  basePath,
  brandLabel,
  brandIcon: BrandIcon,
  groups,
  items,
  trailing,
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

  const mobileTriggerLabel =
    activeGroup?.label ?? activeItem?.label ?? brandLabel;
  const MobileTriggerIcon =
    (activeGroup ? activeGroup.icon : undefined) ?? activeItem?.icon ?? BrandIcon;

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
        <Link
          href={basePath}
          className="flex shrink-0 items-center gap-2 pr-1 text-sm font-bold tracking-tight text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
        >
          <BrandIcon className="h-4 w-4 text-indigo-500" />
          {brandLabel}
        </Link>

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
            return (
              <div key={group.label} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroup((prev) => (prev === group.label ? null : group.label))
                  }
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    groupActive
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  <group.icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{group.label}</span>
                  <svg
                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="absolute left-0 right-0 z-30 mt-1 min-w-[12rem] rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                    {group.items.map((item) => {
                      const active = itemActive(item);
                      return (
                        <Link
                          key={item.href || item.label}
                          href={itemHref(item)}
                          onClick={() => setOpenGroup(null)}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                            active
                              ? "bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
                              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                          }`}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1">{item.label}</span>
                        </Link>
                      );
                    })}
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
              {flatItems.map((item) => {
                const active = itemActive(item);
                return (
                  <Link
                    key={item.href || item.label}
                    href={itemHref(item)}
                    onClick={() => setMobileOpen(false)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                );
              })}
              {groupItems.map((group) => {
                if (group.items.length === 0) return null;
                return (
                  <div key={group.label}>
                    <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {group.label}
                    </p>
                    {group.items.map((item) => {
                      const active = itemActive(item);
                      return (
                        <Link
                          key={item.href || item.label}
                          href={itemHref(item)}
                          onClick={() => setMobileOpen(false)}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                            active
                              ? "bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
                              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                          }`}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1">{item.label}</span>
                        </Link>
                      );
                    })}
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