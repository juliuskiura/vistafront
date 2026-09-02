"use client";

import { useState, useRef, useEffect } from "react";
import { LogOut, UserRound, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/context";
import { logoutAction } from "@/app/(auth)/logout/action";

interface Props {
  user: { firstName: string | null; lastName?: string | null; email: string | null };
  /**
   * Path (relative to the current workspace) the "Account settings" item
   * navigates to. Pass `null` to hide that item.
   */
  settingsHref?: string | null;
}

function initials(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
) {
  return [firstName, lastName]
    .filter(Boolean)
    .map((n) => n?.[0])
    .join("")
    .toUpperCase();
}

function fullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
) {
  if (firstName) return `${firstName} ${lastName ?? ""}`.trim();
  return "User";
}

/**
 * Top-navbar user account menu.
 *
 * The trigger is an avatar circle (initials) with a chevron — matching
 * the original UserAccountMenu. The popover shows the user's full name
 * and email as a label, an "Account settings" row (when a settings path
 * is provided), and a "Sign out" row that calls the logout Server
 * Action.
 */
export function UserAccountMenu({ user, settingsHref }: Props) {
  const router = useRouter();
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
        aria-label="Open account menu"
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {initials(user.firstName, user.lastName ?? null) || "?"}
        </span>
        <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <div className="flex flex-col gap-0.5 px-2 py-1.5">
            <span className="truncate text-sm font-semibold">
              {fullName(user.firstName, user.lastName ?? null)}
            </span>
            {user.email && (
              <span className="truncate text-xs font-normal text-muted-foreground">
                {user.email}
              </span>
            )}
          </div>
          <div className="my-1 h-px bg-border" />
          {settingsHref ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                router.push(settingsHref);
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
            >
              <UserRound className="size-4" />
              Account settings
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 focus-visible:bg-destructive/10"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
