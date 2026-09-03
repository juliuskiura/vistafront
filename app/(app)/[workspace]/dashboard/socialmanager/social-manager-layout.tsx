"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { PenLine, Plus, Share2 } from "lucide-react";

/* ──────────────────────────────────────────────────────────────────────
 * Social Manager Layout
 *
 * Wraps every /socialmanager/* route with:
 *  • A sticky horizontal inner-nav (desktop tabs → mobile dropdown)
 *  • The nav items come from the backend sidebar; we receive them as
 *    props from the workspace layout and filter to socialmanager ones.
 *
 * The `<slot>` renders the active child page.
 * ────────────────────────────────────────────────────────────────────── */

const NAV_ITEMS = [
  { label: "Overview", href: "", end: true },
  { label: "Channels", href: "channels" },
  { label: "Calendar", href: "calendar" },
  { label: "Compose", href: "compose" },
  { label: "Queues", href: "queues" },
  { label: "Bulk Upload", href: "bulk-upload" },
  { label: "Analytics", href: "analytics" },
];

interface SocialManagerLayoutProps {
  children: React.ReactNode;
  /** Active workspace domain, injected by the parent Server Component. */
  workspaceDomain: string;
}

export function SocialManagerLayout({
  children,
  workspaceDomain,
}: SocialManagerLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const basePath = `/${workspaceDomain}/dashboard/socialmanager`;

  function isActive(item: (typeof NAV_ITEMS)[number]): boolean {
    const itemPath = item.href ? `${basePath}/${item.href}` : basePath;
    if (item.end) return pathname === itemPath;
    return pathname.startsWith(itemPath + "/") || pathname === itemPath;
  }

  function handleNav(href: string) {
    const fullHref = href ? `${basePath}/${href}` : basePath;
    router.push(fullHref);
    setMobileOpen(false);
  }

  const activeItem = NAV_ITEMS.find((item) => isActive(item)) ?? NAV_ITEMS[0];
  const isHome = pathname === basePath;

  return (
    <div className="space-y-6">
      {isHome && (
        <div className="flex flex-col justify-between gap-4 bg-gradient-to-r from-primary-600 to-secondary-600 p-6 text-white md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome to Social Manager</h2>
            <p className="mt-1 text-sm text-primary-100">
              Plan, schedule, and publish across all your social channels from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`${basePath}/compose`}
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-primary-700 transition-all hover:bg-primary-50"
            >
              <PenLine className="size-4" /> New Post
            </Link>
            <Link
              href={`${basePath}/channels`}
              className="inline-flex items-center gap-2 rounded-md border border-primary-300 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary-900/90 hover:border-white hover:text-white"
            >
              <Plus className="size-4" /> Connect Account
            </Link>
          </div>
        </div>
      )}

      {/* ── Inner nav ── */}
      <nav className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex items-center gap-1 overflow-x-auto px-1 py-0.5">
          {/* Brand — links back to home */}
          <Link
            href={basePath}
            className="flex shrink-0 items-center gap-2 pr-1 text-sm font-bold tracking-tight text-neutral-900 hover:text-primary-600"
          >
            <Share2 className="h-4 w-4 text-primary-600" />
            Social Manager
          </Link>

          {/* Desktop tabs */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href || "overview"}
                  href={item.href ? `${basePath}/${item.href}` : basePath}
                  className={[
                    "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Spacer to push New Post to the right on desktop */}
          <div className="flex-1" />

          {/* New Post */}
          <Link
            href={`${basePath}/compose`}
            className="hidden shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:from-primary-500 hover:to-secondary-500 md:inline-flex"
          >
            <PenLine className="h-4 w-4" />
            New Post
          </Link>

          {/* Mobile dropdown trigger */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {activeItem.label}
              <svg
                className={`h-4 w-4 text-neutral-400 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className="border-t border-neutral-100 px-2 pb-2 pt-1 md:hidden">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              return (
                <button
                  key={item.href || "overview"}
                  type="button"
                  onClick={() => handleNav(item.href)}
                  className={[
                    "block w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                    active
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-600 hover:bg-neutral-100",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* ── Page content ── */}
      <div>{children}</div>
    </div>
  );
}
