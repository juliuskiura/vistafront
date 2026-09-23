"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { ChevronsLeft, ChevronsRight, Lock, Menu, X } from "lucide-react";
import { ChatIcon, ShoppingCart } from "@/lib/icons";
import { ChatWidget } from "@/components/workspace/chat-widget";

import { Button } from "@/components/ui/button";
import { Fab } from "@/components/ui/fab";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { resolveIcon } from "@/lib/nav-icons";
import type { NavItem, SubscriptionState, Workspace } from "@/lib/api";
import { SubscriptionProvider } from "@/lib/context";
import { navItemPath } from "@/lib/features/routes";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { UserAccountMenu } from "@/components/workspace/user-account-menu";
import { ThemeToggle } from "@/components/workspace/theme-toggle";

interface Props {
  workspace: Pick<Workspace, "nanoid" | "name" | "domain">;
  workspaces: Array<Pick<Workspace, "nanoid" | "name" | "domain">>;
  nav: NavItem[];
  subscription: SubscriptionState;
  user: {
    firstName: string | null;
    lastName?: string | null;
    email: string | null;
    isAdmin: boolean;
  };
  hasActiveChat?: boolean;
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
  workspaceDomain,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
  workspaceDomain: string;
}) {
  const pathname = usePathname();
  // The backend issues nav items by registry `id` — never a URL. The route
  // registry translates the id to its default route relative to the
  // workspace root (e.g. "/dashboard/socialmanager"). Strip the workspace
  // prefix so the active match is meaningful and works for both the
  // workspace root (pathname === "/{workspace}" with end=true) and nested
  // routes.
  const trimmed = pathname.replace(/^\/[^/]+/, "") || "/";
  const target = navItemPath(item.id);
  const active =
    item.end === true
      ? trimmed === target || trimmed === target.replace(/\/$/, "")
      : trimmed === target || trimmed.startsWith(`${target}/`);
  const Icon = resolveIcon(item.icon) as IconComponent;

  // Scope the registry-derived relative target under the active workspace so
  // Next.js routes it through the [workspace] segment (and its
  // requireWorkspace guard) instead of escaping to a sibling app route.
  const scopedHref = `/${workspaceDomain}${target}`;

  // Locked items (owned features on an inactive subscription) navigate to
  // the access page instead of the feature; Django owns the gate, the UI
  // just points the customer at the reason.
  const accessHref =
    item.feature_keys && item.feature_keys.length > 0
      ? `/${workspaceDomain}/dashboard/subscription/access?mode=locked&feature=${encodeURIComponent(item.feature_keys[0])}`
      : `/${workspaceDomain}/dashboard/subscription/access?mode=locked`;
  const href = item.locked ? accessHref : scopedHref;

  const className = [
    "sidebar-item",
    active ? "is-active" : "",
    collapsed ? "is-collapsed" : "",
    item.locked ? "is-locked" : "",
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
  const lockBadge = item.locked ? (
    <span
      aria-hidden
      className={`sidebar-lock${collapsed ? " is-collapsed" : ""}`}
      title="Subscription locked — renew to keep using this"
    >
      <Lock size={14} />
    </span>
  ) : null;
  const tooltip = collapsed ? (
    <span className="sidebar-tooltip" role="tooltip">
      {item.label}
    </span>
  ) : null;

  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        aria-current={active ? "page" : undefined}
        className={className}
      >
        {icon}
        {label}
        {lockBadge}
        {tooltip}
      </Link>
    </li>
  );
}

function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/onboarding"
      className="flex h-16 shrink-0 cursor-pointer items-center gap-2.5 overflow-hidden border-b border-sidebar-divider px-5"
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
  );
}

function SidebarBody({
  nav,
  collapsed,
  onNavigate,
  workspaceDomain,
}: {
  nav: NavItem[];
  collapsed: boolean;
  onNavigate?: () => void;
  workspaceDomain: string;
}) {
  return (
    <>
      <nav
        className="scrollbar-premium min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4"
        aria-label="Primary"
      >
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
                key={item.id}
                item={item}
                collapsed={collapsed}
                onNavigate={onNavigate}
                workspaceDomain={workspaceDomain}
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
  subscription,
  user,
  hasActiveChat = false,
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
    const target = navItemPath(item.id);
    const trimmed = pathname.replace(/^\/[^/]+/, "") || "/";
    return item.end
      ? trimmed === target || trimmed === target.replace(/\/$/, "")
      : trimmed === target || trimmed.startsWith(`${target}/`);
  });
  const pageTitle = currentNav?.label ?? "Dashboard";

  return (
    <SubscriptionProvider state={subscription}>
      <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={`sidebar-surface relative hidden h-full shrink-0 flex-col border-r border-sidebar-divider transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:flex ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10" />
        <SidebarLogo collapsed={collapsed} />
        <SidebarBody nav={nav} collapsed={collapsed} workspaceDomain={workspace.domain} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4 md:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              asChild
              className="md:hidden"
            >
              <Fab
                type="button"
                variant="outline"
                size="sm"
                aria-label="Open navigation"
                title="Open navigation"
              >
                <Menu className="size-5" />
              </Fab>
            </SheetTrigger>
            <SheetContent
              side="left"
              showCloseButton={false}
              className="w-72 max-w-[85vw] gap-0"
            >
              <SheetHeader className="flex-row items-center justify-between gap-2 border-b border-sidebar-divider px-3">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Link
                  href="/onboarding"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={FULL_LOGO}
                    alt="Vistasolve"
                    className="h-6 w-auto opacity-95"
                  />
                </Link>
                <SheetClose asChild>
                  <Fab
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Close navigation"
                    title="Close"
                  >
                    <X className="size-5" />
                  </Fab>
                </SheetClose>
              </SheetHeader>
              <SidebarBody
                nav={nav}
                collapsed={false}
                onNavigate={() => setMobileOpen(false)}
                workspaceDomain={workspace.domain}
              />
            </SheetContent>
          </Sheet>
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
            <ThemeToggle />
            <Link
              href={`/${workspace.domain}/dashboard/orders`}
              title="Your orders"
              aria-label="Your orders"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-input/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <ShoppingCart className="size-4" />
            </Link>
            {user.isAdmin ? (
              <Link
                href={`/${workspace.domain}/dashboard/livechat`}
                className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                title="Live Chat"
              >
                <span className="relative flex">
                  <ChatIcon size={18} />
                  {hasActiveChat && (
                    <span
                      aria-label="Active chat"
                      className="absolute -right-1.5 -top-1.4 h-4 w-4 animate-pulse rounded-full border-2 border-background bg-destructive-600"
                    />
                  )}
                </span>
                <span className="hidden sm:inline">Chat</span>
              </Link>
            ) : (
              null
            )}
            <WorkspaceSwitcher active={workspace} workspaces={workspaces} />
            <UserAccountMenu user={user} />
          </div>
        </header>

        <main className="scrollbar-premium min-h-0 flex-1 overflow-y-auto p-4 animate-in fade-in duration-300 md:p-6">
          {children}
        </main>
      </div>

      {!user.isAdmin && <ChatWidget userName={user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null} />}
      </div>
    </SubscriptionProvider>
  );
}
