"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { ChevronsLeft, ChevronsRight, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { resolveIcon } from "@/lib/nav-icons";
import type { NavItem, Workspace } from "@/lib/api";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { UserAccountMenu } from "@/components/workspace/user-account-menu";

interface Props {
  workspace: Pick<Workspace, "nanoid" | "name" | "domain">;
  workspaces: Array<Pick<Workspace, "nanoid" | "name" | "domain">>;
  nav: NavItem[];
  user: {
    firstName: string | null;
    lastName?: string | null;
    email: string | null;
  };
  children: React.ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = "vs:sidebar:collapsed";
const FULL_LOGO =
  "https://vsregmedia.s3.amazonaws.com/branding/logo_5MuHLkV.svg";
const ICON_LOGO =
  "https://vsregmedia.s3.amazonaws.com/branding/icon_tn0FNHi.svg";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

function NavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  // The backend issues nav targets relative to the workspace root
  // (e.g. "/dashboard", "/crm/companies"), but the URL is prefixed with
  // /{workspace} ("/acme/dashboard"). Strip the workspace prefix so the
  // active match is meaningful and works for both the workspace root
  // (pathname === "/{workspace}" with end=true) and nested routes.
  const trimmed = pathname.replace(/^\/[^/]+/, "") || "/";
  const target = item.to.startsWith("/") ? item.to : `/${item.to}`;
  const active =
    item.end === true
      ? trimmed === target || trimmed === target.replace(/\/$/, "")
      : trimmed === target || trimmed.startsWith(`${target}/`);
  const Icon = resolveIcon(item.icon) as IconComponent;

  const className = [
    "sidebar-item",
    active ? "is-active" : "",
    collapsed ? "is-collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const icon = (
    <span aria-hidden className="sidebar-icon">
      <Icon size={18} />
    </span>
  );
  const label = (
    <span className={`sidebar-label${collapsed ? " is-collapsed" : ""}`}>
      {item.label}
    </span>
  );
  const tooltip = collapsed ? (
    <span className="sidebar-tooltip" role="tooltip">
      {item.label}
    </span>
  ) : null;

  return (
    <li>
      <Link
        href={item.to}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        aria-current={active ? "page" : undefined}
        className={className}
      >
        {icon}
        {label}
        {tooltip}
      </Link>
    </li>
  );
}

function SidebarBody({
  nav,
  collapsed,
  onNavigate,
}: {
  nav: NavItem[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-divider px-5">
        <Link
          href="/onboarding"
          className="flex cursor-pointer items-center gap-2.5 overflow-hidden"
          title="Vistasolve"
        >
          {collapsed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ICON_LOGO} alt="" className="size-8 shrink-0" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={FULL_LOGO}
              alt="Vistasolve"
              className="h-6 w-auto opacity-95 transition-opacity duration-300"
            />
          )}
        </Link>
      </div>
      <nav
        className="scrollbar-premium min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4"
        aria-label="Primary"
      >
        <p className="sidebar-section-label">Menu</p>
        <ul className="sidebar-nav-list">
          {nav.length === 0 ? (
            <li>
              <p className="px-3 py-4 text-xs text-sidebar-muted-foreground">
                No navigation items yet.
              </p>
            </li>
          ) : (
            nav.map((item) => (
              <NavLink
                key={item.to}
                item={item}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))
          )}
        </ul>
      </nav>
    </>
  );
}

export function WorkspaceShell({
  workspace,
  workspaces,
  nav,
  user,
  children,
}: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persist the desktop collapsed preference.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored === "true") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        SIDEBAR_COLLAPSED_KEY,
        collapsed ? "true" : "false",
      );
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  // Contain all scrolling inside the dashboard shell (sidebar + main) so
  // modal dialogs (which toggle <body> overflow via react-remove-scroll) never
  // introduce a document-level scrollbar. Scoped to the dashboard route so
  // auth/login pages keep their own natural scrolling.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close the mobile sheet on navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const currentNav = nav.find((item) => {
    const target = item.to.startsWith("/") ? item.to : `/${item.to}`;
    const trimmed = pathname.replace(/^\/[^/]+/, "") || "/";
    return item.end
      ? trimmed === target || trimmed === target.replace(/\/$/, "")
      : trimmed === target || trimmed.startsWith(`${target}/`);
  });
  const pageTitle = currentNav?.label ?? "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={`sidebar-surface relative hidden h-full shrink-0 flex-col border-r border-sidebar-divider transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:flex ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10" />
        <SidebarBody nav={nav} collapsed={collapsed} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4 md:px-6">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            title="Open navigation"
          >
            <Menu className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden size-9 md:inline-flex"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronsRight className="size-4 text-primary-400" />
            ) : (
              <ChevronsLeft className="size-4 text-primary-400" />
            )}
          </Button>
          <h1 className="text-lg font-semibold">{pageTitle}</h1>
          <div className="ml-auto flex items-center gap-2">
            <WorkspaceSwitcher active={workspace} workspaces={workspaces} />
            <UserAccountMenu user={user} />
          </div>
        </header>

        <main className="scrollbar-premium min-h-0 flex-1 overflow-y-auto p-4 animate-in fade-in duration-300 md:p-6">
          {children}
        </main>
      </div>

      {/* Mobile navigation drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-foreground/40 transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`sidebar-surface absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-sidebar-divider transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-14 items-center justify-between border-b border-sidebar-divider px-3">
            <Link
              href="/onboarding"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={FULL_LOGO}
                alt="Vistasolve"
                className="h-6 w-auto opacity-95"
              />
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              title="Close"
            >
              <X className="size-4" />
            </Button>
          </div>
          <SidebarBody
            nav={nav}
            collapsed={false}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}
