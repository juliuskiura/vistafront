"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  HardDrive,
  Images,
  Trash2,
  FolderOpen,
  Sparkles,
  Folder,
  Search,
  Upload,
  Wrench,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Library",
    icon: "Images",
    children: [
      { label: "All Library Assets", icon: "Images", to: "/dashboard/media/browser" },
      { label: "Trash Bin", icon: "Trash2", to: "/dashboard/media/trash" },
    ],
  },
  {
    label: "Collections",
    icon: "FolderOpen",
    children: [{ label: "Collections", icon: "FolderOpen", to: "/dashboard/media/collections" }],
  },
  {
    label: "Smart Rules",
    icon: "Sparkles",
    children: [{ label: "Smart Collections", icon: "Sparkles", to: "/dashboard/media/smart-collections" }],
  },
  {
    label: "Tools",
    icon: "Wrench",
    children: [
      { label: "Folders", icon: "Folder", to: "/dashboard/media/folders" },
      { label: "Advanced Search", icon: "Search", to: "/dashboard/media/search" },
      { label: "Upload", icon: "Upload", to: "/dashboard/media/upload" },
    ],
  },
];

const INNER_ICONS: Record<string, typeof Images> = {
  Images,
  Trash2,
  FolderOpen,
  Sparkles,
  Folder,
  Search,
  Upload,
  Wrench,
};

interface MediaLayoutProps {
  children: React.ReactNode;
  workspaceDomain: string;
}

export function MediaLayout({
  children,
  workspaceDomain,
}: MediaLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const basePath = `/${workspaceDomain}/dashboard/media`;

  function isActive(to: string): boolean {
    const full = `${basePath}${to}`;
    return pathname === full || pathname.startsWith(full + "/");
  }

  const isHome = pathname === basePath;

  const activeGroup = NAV_GROUPS.find((g) =>
    (g.children ?? []).some((c) => isActive(c.to)),
  );
  const ActiveIcon = activeGroup ? INNER_ICONS[activeGroup.icon] ?? Images : Images;

  function handleGroupToggle(groupLabel: string) {
    setOpenGroup((prev) => (prev === groupLabel ? null : groupLabel));
  }

  return (
    <div className="flex min-h-full flex-col">
      {(openGroup || mobileOpen) && (
        <div
          className="fixed inset-0 z-10"
          aria-hidden
          onClick={() => {
            setOpenGroup(null);
            setMobileOpen(false);
          }}
        />
      )}

      {isHome && (
        <div className="-mx-4 -mt-4 flex flex-col justify-between gap-4 bg-gradient-to-r from-primary-600 to-secondary-600 p-6 text-white md:-mx-6 md:-mt-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome to Media Library</h2>
            <p className="max-w-xl text-xs text-primary-100 leading-relaxed">
              Centralized digital asset repository. Manage images, videos, documents, collections, and folders in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push(`${basePath}/upload`)}
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-primary-700 transition-all hover:bg-primary-50"
            >
              <Upload className="size-4" /> Upload
            </button>
            <button
              type="button"
              onClick={() => router.push(`${basePath}/browser`)}
              className="inline-flex items-center gap-2 rounded-md border border-primary-300 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary-900/90 hover:border-white hover:text-white"
            >
              <Images className="size-4" /> Browse Assets
            </button>
          </div>
        </div>
      )}

      <nav className="sticky -top-4 z-20 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:-top-6 md:px-6">
          <button
            type="button"
            onClick={() => router.push(basePath)}
            className="flex shrink-0 items-center gap-2 pr-1 text-sm font-bold tracking-tight text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
          >
            <Images className="h-4 w-4 text-indigo-500" />
            Media Library
          </button>

          <nav className="hidden flex-1 flex-wrap items-center gap-1 md:flex" aria-label="Media Library">
            {NAV_GROUPS.map((group) => {
              const items = group.children ?? [];
              if (items.length === 0) {
                return (
                  <span
                    key={group.label}
                    className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                  >
                    {group.label}
                  </span>
                );
              }
              const GroupIcon = INNER_ICONS[group.icon] ?? Images;
              const isOpen = openGroup === group.label;
              const groupActive = items.some((c) => isActive(c.to));
              return (
                <div key={group.label} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => handleGroupToggle(group.label)}
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      groupActive
                        ? "bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    <GroupIcon className="h-4 w-4 shrink-0" />
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
                      {items.map((item) => {
                        const Icon = INNER_ICONS[item.icon] ?? Images;
                        const active = isActive(item.to);
                        return (
                          <button
                            key={item.to}
                            type="button"
                            onClick={() => {
                              router.push(`${basePath}${item.to}`);
                              setOpenGroup(null);
                            }}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                              active
                                ? "bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
                                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="relative flex-1 md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-haspopup="listbox"
              aria-expanded={mobileOpen}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <span className="flex items-center gap-2 truncate">
                <ActiveIcon className="h-4 w-4 shrink-0" />
                {activeGroup ? activeGroup.label : "Media Library"}
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
                {NAV_GROUPS.map((group) => {
                  const items = group.children ?? [];
                  if (items.length === 0) return null;
                  return (
                    <div key={group.label}>
                      <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {group.label}
                      </p>
                      {items.map((item) => {
                        const Icon = INNER_ICONS[item.icon] ?? Images;
                        const active = isActive(item.to);
                        return (
                          <button
                            key={item.to}
                            type="button"
                            onClick={() => {
                              router.push(`${basePath}${item.to}`);
                              setMobileOpen(false);
                            }}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                              active
                                ? "bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
                                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden shrink-0 items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 dark:bg-slate-800 md:flex">
            <HardDrive className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Storage</span>
            <span className="text-xs font-medium">~</span>
          </div>
        </nav>

      <div className="flex-1 p-4 md:p-6">{children}</div>
    </div>
  );
}