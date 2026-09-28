"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSubscription } from "@/lib/context/SubscriptionContext";
import { useApiFetch } from "@/lib/context/SessionRefreshContext";
import ConnectAccountModal from "@/components/socialmanager/connect-account-modal";
import type { SocialMediaPlatform, SocialPlatform } from "@/lib/api/types";

/**
 * Optional per-call steering for the connect flow. Every field is optional, so
 * `open()` with no argument stays the plain "let me pick a platform" case.
 */
export interface ConnectIntent {
  /**
   * Start on this platform instead of the picker. Which step that means is
   * decided by the platform's `auth_destination`: a destination reachable
   * through several doors (Instagram, today) opens the "doors" step, everything
   * else opens the picker.
   */
  preselectedPlatform?: SocialPlatform;
  /**
   * True when re-authorising an account that already exists but had its token
   * revoked. Forwarded to the backend so it re-issues rather than 409s.
   */
  rerequest?: boolean;
}

interface ConnectAccountContextValue {
  /** Open the connect-account OAuth flow, optionally steering the first step. */
  open(intent?: ConnectIntent): void;
  /** False when the workspace lacks `socialmanager.posts`, or no provider. */
  canConnect: boolean;
}

const ConnectAccountContext = createContext<ConnectAccountContextValue | null>(
  null,
);

/**
 * Module-level constant so the fallback keeps a stable identity — a fresh
 * object literal per render would invalidate every consumer's memo deps.
 */
const INERT: ConnectAccountContextValue = { open: () => {}, canConnect: false };

/**
 * `open` is an `(intent?) => void` callback, so wiring it straight to `onClick`
 * hands it React's MouseEvent. A genuine intent is a plain bag carrying at
 * least one known key; anything else — an event, `undefined` — means "no
 * intent". Without this, a stray event would be spread into the modal's
 * `preselectedPlatform` / `rerequest` props.
 */
function isConnectIntent(value: unknown): value is ConnectIntent {
  if (typeof value !== "object" || value === null) return false;
  return "preselectedPlatform" in value || "rerequest" in value;
}

/**
 * Owns the app-wide "Connect Account" flow.
 *
 * `ConnectAccountModal` is a *controlled* Radix dialog (`open={isOpen}`), so it
 * cannot own its own visibility — some ancestor has to hold the flag. Mounting
 * the trigger inside `Banner` while keeping the modal out of it means that
 * ancestor is this provider, and the trigger talks to it through
 * `useConnectAccount()`. The payoff over putting the modal in `Banner` is that
 * there is exactly ONE modal instance for the whole app, so one `message`
 * listener and one closed-popup poll regardless of how many banners render.
 *
 * Every caller shares that one instance, so `open()` takes a `ConnectIntent`:
 * the channels page needs to preselect a platform and flag a re-authorisation,
 * while the banner and the composer just want the picker.
 *
 * Must be mounted *inside* `SubscriptionProvider` — it calls
 * `useSubscription()`, which throws outside one.
 */
export function ConnectAccountProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { canUseFeature } = useSubscription();
  const apiFetch = useApiFetch();
  const [isOpen, setIsOpen] = useState(false);
  const [intent, setIntent] = useState<ConnectIntent>({});
  // Bumped on every open and used as the modal's `key`. The modal keeps
  // `step`/`selectedPlatform` in `useState`, so a reused instance would open on
  // the previous caller's step — e.g. a Compose open left on "doors" would
  // hijack the next Reconnect. A remount per open is cheaper than syncing that
  // state back out through an effect.
  const [openSeq, setOpenSeq] = useState(0);

  // The provider sits above every server fetch, so the workspace slug is read
  // from the URL: every banner lives under /{workspace}/dashboard/...
  const workspaceDomain = pathname.split("/")[1] ?? "";

  const open = useCallback((next?: ConnectIntent) => {
    setIntent(isConnectIntent(next) ? next : {});
    setOpenSeq((seq) => seq + 1);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setIntent({});
  }, []);

  const value = useMemo<ConnectAccountContextValue>(
    () => ({
      open,
      // Route guards call requireFeature server-side; this is the matching
      // presentation gate so a workspace without the entitlement is never
      // offered a button that dead-ends in StepSelect's empty state.
      canConnect: canUseFeature("socialmanager.posts"),
    }),
    [open, canUseFeature],
  );

  // Lazy on purpose: `enabled` keeps every page that renders a Banner from
  // paying for a request it may never need. `workspaceDomain` is part of the
  // key so switching workspaces cannot serve another tenant's list.
  const { data: platforms } = useQuery<SocialMediaPlatform[]>({
    queryKey: ["socialmanager", "platforms", workspaceDomain],
    // `apiFetch` throws SessionExpiredError on a dead token (after kicking off
    // router.refresh()), so the query errors and TanStack retries it against
    // the refreshed session instead of caching a permanent empty list.
    queryFn: () =>
      apiFetch(
        `/api/socialmanager/platforms?workspace=${encodeURIComponent(workspaceDomain)}`,
      ).then((r) => r.json()),
    enabled: isOpen && Boolean(workspaceDomain),
    staleTime: 5 * 60_000,
  });

  return (
    <ConnectAccountContext.Provider value={value}>
      {children}
      <ConnectAccountModal
        key={openSeq}
        isOpen={isOpen}
        onClose={close}
        onConnected={() => {
          close();
          // The platform list and every channel list are Server Component
          // data. Without this the user closes the modal still looking at a
          // snapshot from before they connected.
          router.refresh();
        }}
        workspaceDomain={workspaceDomain}
        platforms={platforms ?? []}
        preselectedPlatform={intent.preselectedPlatform}
        rerequest={intent.rerequest}
      />
    </ConnectAccountContext.Provider>
  );
}

/**
 * Unlike `useSubscription`, this does NOT throw when the provider is absent.
 * `Banner` also renders outside the workspace shell (marketing, auth, billing
 * fallbacks), and a missing provider there must degrade to an inert button
 * rather than a white screen.
 */
export function useConnectAccount(): ConnectAccountContextValue {
  return useContext(ConnectAccountContext) ?? INERT;
}
