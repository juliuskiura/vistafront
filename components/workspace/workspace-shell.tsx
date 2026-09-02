"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LogOut, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar, useToast } from "@/lib/context";
import { logoutAction } from "@/app/(auth)/logout/action";
import type { NavItem, Workspace } from "@/lib/api";

interface Props {
  workspace: Pick<Workspace, "nanoid" | "name" | "domain">;
  workspaces: Array<Pick<Workspace, "nanoid" | "name" | "domain">>;
  nav: NavItem[];
  user: { firstName: string | null; email: string | null };
}

const ICON_BG: Record<string, string> = {
  default: "bg-primary/10 text-primary",
  accent: "bg-amber-100 text-amber-900",
};

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

  return (
    <Link
      href={item.to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <span
        aria-hidden
        className="inline-flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-[10px] font-semibold text-primary"
      >
        {item.label.slice(0, 1).toUpperCase()}
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function WorkspaceShell({ workspace, workspaces, nav, user, children }: Props & { children: React.ReactNode }) {
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
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r bg-card transition-transform",
          "md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:w-0 md:overflow-hidden md:border-0",
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b p-4">
          <button
            type="button"
            onClick={() => setSwitcherOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={switcherOpen}
            className="flex flex-1 items-center justify-between rounded-lg border bg-background px-3 py-2 text-left hover:bg-accent"
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">{workspace.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                /{workspace.domain}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                switcherOpen && "rotate-180",
              )}
            />
          </button>
        </div>

        {switcherOpen && (
          <div className="border-b bg-card p-2">
            <ul role="listbox" className="max-h-64 space-y-1 overflow-auto">
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
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm",
                        active
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-accent",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {ws.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          /{ws.domain}
                        </span>
                      </span>
                      {active && <Check className="size-4 text-primary" />}
                    </button>
                  </li>
                );
              })}
              {workspaces.length <= 1 && (
                <li className="px-3 py-2 text-xs text-muted-foreground">
                  You only belong to this workspace.
                </li>
              )}
            </ul>
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.length === 0 ? (
            <p className="px-2 py-4 text-xs text-muted-foreground">
              No navigation items yet.
            </p>
          ) : (
            nav.map((item) => <NavLink key={item.to} item={item} />)
          )}
        </nav>

        <div className="border-t p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div
              aria-hidden
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
                ICON_BG.default,
              )}
            >
              {initials(user.firstName, user.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user.firstName ?? user.email ?? "You"}
              </p>
              {user.firstName && user.email && (
                <p className="truncate text-xs text-muted-foreground">
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
