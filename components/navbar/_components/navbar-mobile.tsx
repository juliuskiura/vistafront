"use client";

import { useState } from "react";

import { ChevronDown, LayoutGrid, X } from "@/lib/icons";
import { Fab } from "@/components/ui/fab";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { NavbarItem } from "@/lib/api/navbar";

const LOGO_URL =
  "https://vsregmedia.s3.amazonaws.com/branding/logo_5MuHLkV.svg";

function isExternal(url: string): boolean {
  try {
    const host = new URL(url).host;
    return host !== "vistasolve.com" && host !== "www.vistasolve.com";
  } catch {
    return true;
  }
}

export interface NavbarMobileProps {
  items: NavbarItem[];
}

export function NavbarMobileLauncher({ items }: NavbarMobileProps) {
  const [open, setOpen] = useState(false);
  const navLinks = items.filter((i) => !i.is_cta);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Fab
            variant="outline"
            size="sm"
            aria-label="Open main menu"
          >
            <LayoutGrid className="size-5" />
          </Fab>
        </SheetTrigger>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:max-w-[85vw]"
        >
          <SheetHeader className="flex-row items-center justify-between gap-2 border-b border-border px-3 py-3">
            <SheetTitle className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_URL} alt="Vistasolve" className="h-8 w-auto" />
            </SheetTitle>
            <SheetClose asChild>
              <button
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="size-5" />
                <span className="sr-only">Close</span>
              </button>
            </SheetClose>
          </SheetHeader>
          <nav className="px-6 py-4 overflow-y-auto flex-1 space-y-2">
            {navLinks.map((item) => {
              if (!item.has_children) {
                return (
                  <MobileLink
                    key={item.id}
                    item={item}
                    isExternal={isExternal}
                  />
                );
              }
              return (
                <MobileDropdown
                  key={item.id}
                  item={item}
                  isExternal={isExternal}
                />
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}

function MobileLink({
  item,
  isExternal,
}: {
  item: NavbarItem;
  isExternal: (url: string) => boolean;
}) {
  if (isExternal(item.url)) {
    return (
      <a
        key={item.id}
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        {item.title}
      </a>
    );
  }
  return (
    <a
      key={item.id}
      href={item.url}
      className="block px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
    >
      {item.title}
    </a>
  );
}

function MobileDropdown({
  item,
  isExternal,
}: {
  item: NavbarItem;
  isExternal: (url: string) => boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div key={item.id} className="overflow-hidden rounded-md border border-border">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-1 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        aria-expanded={isOpen}
      >
        {item.title}
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="px-2 py-1.5 space-y-0.5">
          {item.children.map((child) => {
            if (isExternal(child.url)) {
              return (
                <a
                  key={child.id}
                  href={child.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {child.title}
                </a>
              );
            }
            return (
              <a
                key={child.id}
                href={child.url}
                className="block px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {child.title}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
