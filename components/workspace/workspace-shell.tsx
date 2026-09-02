"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LogOut, Check, LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSidebar, useToast } from "@/lib/context";
import { resolveIcon } from "@/lib/nav-icons";
import { logoutAction } from "@/app/(auth)/logout/action";
import type { NavItem, Workspace } from "@/lib/api";

interface Props {
  workspace: Pick<Workspace, "nanoid" | "name" | "domain">;
  workspaces: Array<Pick<Workspace, "nanoid" | "name" | "domain">>;
  nav: NavItem[];
  user: { firstName: string | null; email: string | null };
  children: React.ReactNode;
}

function initials(name: string | null | undefined, email: string | null | undefined) {
  const source = (name || email || "?").trim();
  if (!source) return "?";
  const parts = source.split(/\s+|@/).filter(Boolean);
  const first = parts[0]?.[0] ?? source[0];
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase();
}

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active =
    item.end === true
      ? pathname === item.to
      : pathname === item.to || pathname.startsWith(`${item.to}/`);
  const Icon = resolveIcon(item.icon);

  return (
    <Link
      href={item.to}
      className={`sidebar-item${active ? " is-active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <span aria-hidden className="sidebar-icon">
        <Icon className="size-4" />
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function WorkspaceShell({
  workspace,
  workspaces,
  nav,
  user,
  children,
}: Props) {
  const { isOpen, toggle } = useSidebar();
  const router = useRouter();
  const toast = useToast();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  async function handleLogout() {
    try {
      await logoutAction();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not sign out.";
      toast.push({ variant: "error", message });
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside
        data-open={isOpen}
        className={`sidebar-surface scrollbar-premium fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-sidebar-border ${
          isOpen
            ? "translate-x-0"
            : "-translate-x-full md:w-0 md:overflow-hidden md:border-0"
        } md:relative md:translate-x-0`}
      >
        <div className="px-3 pt-4 pb-2">
          <button
            type="button"
            onClick={() => setSwitcherOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={switcherOpen}
            className="sidebar-item is-active w-full"
          >
            <span aria-hidden className="sidebar-icon">
              <LayoutGrid className="size-4" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col items-start leading-tight">
              <span className="truncate text-sm">{workspace.name}</span>
              <span className="truncate text-[11px] font-normal opacity-80">
                /{workspace.domain}
              </span>
            </span>
            <ChevronDown
              className={`size-4 shrink-0 transition-transform ${
                switcherOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {switcherOpen && (
          <div className="px-3 pb-2">
            <div className="sidebar-divider" />
            <p className="sidebar-section-label pt-2">Switch workspace</p>
            <ul role="listbox" className="sidebar-nav-list">
              {workspaces.map((ws) => {
                const active = ws.nanoid === workspace.nanoid;
                return (
                  <li key={ws.nanoid}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        setSwitcherOpen(false);
                        if (!active) router.push(`/${ws.domain}/dashboard`);
                      }}
                      className={`sidebar-item w-full text-left${
                        active ? " is-active" : ""
                      }`}
                    >
                      <span aria-hidden className="sidebar-icon">
                        <span className="text-[11px] font-semibold">
                          {ws.name.slice(0, 1).toUpperCase()}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1 truncate">{ws.name}</span>
                      {active && <Check className="size-4 shrink-0" />}
                    </button>
                  </li>
                );
              })}
              {workspaces.length <= 1 && (
                <li className="px-3 py-2 text-[11px] text-sidebar-muted-foreground">
                  You only belong to this workspace.
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="sidebar-divider mx-3" />

        <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-premium">
          {nav.length === 0 ? (
            <p className="px-3 py-4 text-xs text-sidebar-muted-foreground">
              No navigation items yet.
            </p>
          ) : (
            <ul className="sidebar-nav-list">
              {nav.map((item) => (
                <li key={item.to}>
                  <NavLink item={item} />
                </li>
              ))}
            </ul>
          )}
        </nav>

        <div className="sidebar-divider mx-3" />

        <div className="px-3 py-3">
          <div className="sidebar-item">
            <span
              aria-hidden
              className="sidebar-icon text-sm font-semibold"
            >
              {initials(user.firstName, user.email)}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm">
                {user.firstName ?? user.email ?? "You"}
              </p>
              {user.firstName && user.email && (
                <p className="truncate text-[11px] font-normal opacity-80">
                  {user.email}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Log out"
              className="size-8"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b bg-card/50 px-4 py-3 md:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggle}
            aria-label="Toggle navigation"
          >
            Menu
          </Button>
          <span className="truncate text-sm font-semibold">{workspace.name}</span>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
