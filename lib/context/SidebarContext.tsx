"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface SidebarContextValue {
  isOpen: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  /**
   * Auto-collapse on small viewports when the page first mounts.
   * Defaults to `true` for the mobile-first layout.
   */
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = "vs:sidebar:open";
const MOBILE_BREAKPOINT = 768;

function readStoredPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "0") return false;
    if (stored === "1") return true;
  } catch {
    /* localStorage may be unavailable */
  }
  return true;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Render open by default; the effect below will reconcile with the stored
  // preference and viewport size on the client.
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      const narrow = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(narrow);
      if (narrow) {
        setIsOpen(false);
      } else {
        setIsOpen(readStoredPreference());
      }
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const setOpen = useCallback((open: boolean) => {
    setIsOpen(open);
    if (typeof window !== "undefined" && window.innerWidth >= MOBILE_BREAKPOINT) {
      try {
        window.localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
      } catch {
        /* ignore */
      }
    }
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (typeof window !== "undefined" && window.innerWidth >= MOBILE_BREAKPOINT) {
        try {
          window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  }, []);

  const value = useMemo<SidebarContextValue>(
    () => ({ isOpen, toggle, setOpen, isMobile }),
    [isOpen, isMobile, toggle, setOpen],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
