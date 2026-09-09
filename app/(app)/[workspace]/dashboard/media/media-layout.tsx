"use client";

import { usePathname } from "next/navigation";
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
import { Banner } from "@/components/banner";

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

  const basePath = `/${workspaceDomain}/dashboard/media`;

  const isHome = pathname === basePath;

  return (
    <div className="flex min-h-full flex-col">
      {isHome && (
        <Banner
          title="Welcome to Media Library"
          description="Centralized digital asset repository. Manage images, videos, documents, collections, and folders in one place."
          actions={[
            { label: "Upload", icon: Upload, href: `${basePath}/upload` },
            { label: "Browse Assets", icon: Images, href: `${basePath}/browser`, variant: "secondary" },
          ]}
        >
          <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-[#4d7fff]/60 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-[#00e5ff]/40 blur-3xl" />
          <div className="absolute -bottom-20 left-1/4 h-72 w-72 rounded-full bg-[#7a5cff]/50 blur-3xl" />
          <div className="absolute -right-8 -bottom-8 h-56 w-56 rounded-full bg-[#19e664]/30 blur-3xl" />
        </Banner>
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
