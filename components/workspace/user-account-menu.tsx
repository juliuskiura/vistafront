"use client";

import { useState, useRef, useEffect } from "react";
import { LogOut, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/context";
import { logoutAction } from "@/app/(auth)/logout/action";

interface Props {
  user: { firstName: string | null; email: string | null };
}

function initials(name: string | null | undefined, email: string | null | undefined) {
  const source = (name || email || "?").trim();
  if (!source) return "?";
  const parts = source.split(/\s+|@/).filter(Boolean);
  const first = parts[0]?.[0] ?? source[0];
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase();
}

/**
 * Top-navbar user menu. The sign-out action lives here (per the original
 * AppLayout: UserAccountMenu in the top-right of the navbar), not in the
 * sidebar footer.
 */
export function UserAccountMenu({ user }: Props) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    try {
      await logoutAction();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not sign out.";
      toast.push({ variant: "error", message });
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-full border bg-card/60 px-1.5 py-1 text-sm transition-colors hover:bg-accent"
      >
        <span
          aria-hidden
          className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
        >
          {initials(user.firstName, user.email)}
        </span>
        <span className="hidden text-left leading-tight md:flex md:flex-col">
          <span className="truncate text-xs font-semibold">
            {user.firstName ?? user.email ?? "You"}
          </span>
          {user.firstName && user.email && (
            <span className="truncate text-[10px] font-normal text-muted-foreground">
              {user.email}
            </span>
          )}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          <div className="px-3 py-2 text-xs text-muted-foreground">
            <p className="truncate text-sm font-semibold text-foreground">
              {user.firstName ?? user.email ?? "You"}
            </p>
            {user.email && (
              <p className="truncate text-xs">{user.email}</p>
            )}
          </div>
          <div className="sidebar-divider mx-2 my-1" />
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="sidebar-item w-full text-left"
          >
            <span aria-hidden className="sidebar-icon">
              <LogOut className="size-4" />
            </span>
            <span className="truncate">Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}
