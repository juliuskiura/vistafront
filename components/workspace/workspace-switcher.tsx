"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Workspace } from "@/lib/api";

interface Props {
  active: Pick<Workspace, "nanoid" | "name" | "domain">;
  workspaces: Array<Pick<Workspace, "nanoid" | "name" | "domain">>;
}

/**
 * Top-navbar workspace switcher.
 *
 * Opens a popover listing the workspaces the signed-in user belongs to.
 * Picking a workspace navigates to `/{domain}/dashboard` (the [workspace]
 * layout's `requireWorkspace` guard re-validates on the server).
 */
export function WorkspaceSwitcher({ active, workspaces }: Props) {
  const router = useRouter();
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

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="gap-2"
      >
        <span className="flex min-w-0 flex-col items-start leading-tight">
          <span className="truncate text-xs font-semibold">{active.name}</span>
          <span className="truncate text-[10px] font-normal text-muted-foreground">
            /{active.domain}
          </span>
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </Button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          <ul className="max-h-64 space-y-0.5 overflow-y-auto scrollbar-premium">
            {workspaces.map((ws) => {
              const isActive = ws.nanoid === active.nanoid;
              return (
                <li key={ws.nanoid}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      setOpen(false);
                      if (!isActive) router.push(`/${ws.domain}/dashboard`);
                    }}
                    className="sidebar-item w-full text-left"
                  >
                    <span aria-hidden className="sidebar-icon">
                      <span className="text-xs font-semibold">
                        {ws.name.slice(0, 1).toUpperCase()}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1 truncate">{ws.name}</span>
                    {isActive && <Check className="size-4 shrink-0" />}
                  </button>
                </li>
              );
            })}
            {workspaces.length <= 1 && (
              <li className="px-3 py-2 text-[11px] text-muted-foreground">
                You only belong to this workspace.
              </li>
            )}
          </ul>
          <div className="sidebar-divider mx-2 my-1" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/onboarding");
            }}
            className="sidebar-item w-full text-left"
          >
            <span aria-hidden className="sidebar-icon">
              <Plus className="size-4" />
            </span>
            <span className="truncate">Add or join a workspace</span>
          </button>
        </div>
      )}
    </div>
  );
}
