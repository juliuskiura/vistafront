"use client";

import { usePathname, useRouter } from "next/navigation";
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
import {
  WorkspaceInnerNav,
  type InnerNavGroup,
} from "@/components/workspace/workspace-inner-nav";

const NAV_GROUPS: InnerNavGroup[] = [
  {
    label: "Library",
    icon: Images,
    items: [
      { label: "All Library Assets", href: "/browser", icon: Images },
      { label: "Trash Bin", href: "/trash", icon: Trash2 },
    ],
  },
  {
    label: "Collections",
    icon: FolderOpen,
    items: [{ label: "Collections", href: "/collections", icon: FolderOpen }],
  },
  {
    label: "Smart Rules",
    icon: Sparkles,
    items: [{ label: "Smart Collections", href: "/smart-collections", icon: Sparkles }],
  },
  {
    label: "Tools",
    icon: Wrench,
    items: [
      { label: "Folders", href: "/folders", icon: Folder },
      { label: "Advanced Search", href: "/search", icon: Search },
      { label: "Upload", href: "/upload", icon: Upload },
    ],
  },
];

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

  const basePath = `/${workspaceDomain}/dashboard/media`;

  const isHome = pathname === basePath;

  return (
    <div className="flex min-h-full flex-col">
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

      <WorkspaceInnerNav
        basePath={basePath}
        brandLabel="Media Library"
        brandIcon={Images}
        groups={NAV_GROUPS}
        trailing={
          <div className="hidden shrink-0 items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 dark:bg-slate-800 md:flex">
            <HardDrive className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Storage</span>
            <span className="text-xs font-medium">~</span>
          </div>
        }
      />

      <div className="flex-1 p-4 md:p-6">{children}</div>
    </div>
  );
}