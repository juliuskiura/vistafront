"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  User,
  Shield,
  Bell,
  KeyRound,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Profile", href: "", end: true, icon: User },
  { label: "Security", href: "security", icon: Shield },
  { label: "Notifications", href: "notifications", icon: Bell },
  { label: "API Keys", href: "api-keys", icon: KeyRound },
];

interface AccountLayoutProps {
  children: React.ReactNode;
  workspaceDomain: string;
}

export function AccountLayout({
  children,
  workspaceDomain,
}: AccountLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const basePath = `/${workspaceDomain}/dashboard/account`;

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
  const ActiveIcon = activeItem.icon;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col justify-between gap-4 bg-gradient-to-r from-primary-600 to-secondary-600 p-6 text-white md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Account Settings</h2>
          <p className="mt-1 max-w-xl text-sm text-primary-100">
            Manage your personal details, security preferences, and integrations.
          </p>
        </div>
      </div>

      <nav className="sticky -top-4 z-20 flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-white/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-white/80 md:-top-6 md:px-6">
        <button
          type="button"
          onClick={() => router.push(basePath)}
          className="flex shrink-0 items-center gap-2 pr-1 text-sm font-bold tracking-tight text-neutral-900 hover:text-primary-600"
        >
          <User className="h-4 w-4 text-primary-600" />
          Account
        </button>

        <div className="hidden flex-1 flex-wrap items-center gap-1 md:flex" aria-label="Account sections">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href || "profile"}
                href={item.href ? `${basePath}/${item.href}` : basePath}
                className={[
                  "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="relative flex-1 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={mobileOpen}
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700"
          >
            <span className="flex items-center gap-2 truncate">
              <ActiveIcon className="h-4 w-4 shrink-0" />
              {activeItem.label}
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
            <div className="absolute left-0 right-0 z-30 mt-1 max-h-[70vh] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1 shadow-lg">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <Link
                    key={item.href || "profile"}
                    href={item.href ? `${basePath}/${item.href}` : basePath}
                    onClick={() => setMobileOpen(false)}
                    className={[
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                      active
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-600 hover:bg-neutral-100",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="mt-6 flex-1">{children}</div>
    </div>
  );
}
