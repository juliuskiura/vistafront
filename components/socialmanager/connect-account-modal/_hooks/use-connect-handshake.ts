"use client";

import { useCallback, useEffect, useRef } from "react";
import { useApiFetch } from "@/lib/context/SessionRefreshContext";

/**
 * The OAuth popup handshake: open the popup, listen for the close page's
 * `postMessage`, and — when that message never arrives — *reconcile* against the
 * backend before declaring failure.
 *
 * ## Why reconciliation exists
 *
 * The popup hands its result back through `postMessage`, but that channel fails
 * silently all the time. The popup navigates through a third-party provider
 * (Facebook, Threads, …) before landing back on this app's origin, and a
 * provider that serves `Cross-Origin-Opener-Policy: same-origin` severs
 * `window.opener` on that hop. The close page then finds no opener and the
 * parent tab hears nothing at all — while the backend has already written the
 * account. A `targetOrigin` that does not match the host the user is actually
 * on drops the message just as quietly.
 *
 * The closed-popup poll used to answer that silence with "that didn't go
 * through", telling users a working connection had failed. It now asks the
 * backend what it actually holds: if an account appeared or was updated since
 * the flow started, the connect happened — message or no message.
 */

/** `nanoid -> updated_at`, or `null` when the snapshot could not be taken. */
export type AccountSnapshot = Record<string, string> | null;

/** The thin account shape `GET /api/socialmanager/accounts` returns. */
interface AccountProbe {
  nanoid: string;
  platform: string;
  updated_at: string;
}

/** How often the poll re-checks whether the popup is gone. */
const POLL_MS = 600;

const POPUP_FEATURES = "width=600,height=700,left=200,top=100";

const NO_POPUP =
  "We need a pop-up window to sign you in. Allow pop-ups for this site and try again.";

const UNCONFIRMED =
  "We couldn't confirm the connection — the window closed before the flow finished. Refresh to check whether the account connected anyway.";

function snapshotUrl(workspaceDomain: string): string {
  return `/api/socialmanager/accounts?workspace=${encodeURIComponent(workspaceDomain)}`;
}

/**
 * True when the backend's account list changed since `baseline` was taken: a
 * brand new account, or an existing one whose row was written again (which is
 * what a re-authorisation does).
 */
function isConnectedSince(accounts: AccountProbe[], baseline: AccountSnapshot): boolean {
  if (!baseline) return false;
  return accounts.some((account) => baseline[account.nanoid] !== account.updated_at);
}

export interface ConnectHandshake {
  /**
   * Opens the provider popup and starts watching it. `baseline` is the account
   * snapshot taken *before* the popup opened, so the account this flow is about
   * to create cannot already be in it.
   */
  begin(authUrl: string, platform: string, baseline: AccountSnapshot): void;
  /** Closes the popup without an outcome — the user pressed Cancel. */
  cancel(): void;
  /**
   * Pre-flight account snapshot for `begin`. Resolves to `null` when the
   * backend cannot be asked, which disables reconciliation: an empty list would
   * otherwise make every pre-existing account look brand new.
   */
  takeBaseline: () => Promise<AccountSnapshot>;
}

export function useConnectHandshake({
  workspaceDomain,
  onSuccess,
  onFailure,
}: {
  workspaceDomain: string;
  onSuccess: (platform: string) => void;
  onFailure: (message: string) => void;
}): ConnectHandshake {
  const apiFetch = useApiFetch();
  const popupRef = useRef<Window | null>(null);
  const listenerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const pollRef = useRef<number | null>(null);
  const platformRef = useRef("");
  const baselineRef = useRef<AccountSnapshot>(null);
  // Guards against answering twice: the message and the closed-popup poll can
  // both observe the same finished flow.
  const settledRef = useRef(false);

  const stopWatching = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (listenerRef.current) {
      window.removeEventListener("message", listenerRef.current);
      listenerRef.current = null;
    }
  }, []);

  const closePopup = useCallback(() => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;
  }, []);

  const readAccounts = useCallback(async (): Promise<AccountProbe[] | null> => {
    try {
      const response = await apiFetch(snapshotUrl(workspaceDomain));
      if (!response.ok) return null;
      const body = (await response.json()) as { accounts?: AccountProbe[] };
      return body.accounts ?? [];
    } catch {
      // SessionExpiredError lands here too: the refresh it kicks off is a page
      // concern, and by the time that lands this poll is long over.
      return null;
    }
  }, [apiFetch, workspaceDomain]);

  const takeBaseline = useCallback(async (): Promise<AccountSnapshot> => {
    const accounts = await readAccounts();
    if (!accounts) return null;
    return Object.fromEntries(
      accounts.map((account) => [account.nanoid, account.updated_at]),
    );
  }, [readAccounts]);

  // The modal is keyed per open, so a close remounts it: a reconcile still in
  // flight must not report into the unmounted instance.
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      stopWatching();
      closePopup();
    };
  }, [stopWatching, closePopup]);

  const begin = useCallback(
    (authUrl: string, platform: string, baseline: AccountSnapshot) => {
      settledRef.current = false;
      platformRef.current = platform;
      baselineRef.current = baseline;
      // The listener goes on before the popup exists, so a flow that finishes
      // in under a second cannot post its result into nothing.
      stopWatching();

      const settle = (report: () => void) => {
        if (settledRef.current || !aliveRef.current) return;
        settledRef.current = true;
        stopWatching();
        closePopup();
        report();
      };

      const handleMessage = (event: MessageEvent) => {
        // Only trust the window this hook opened, and only from this app's own
        // origin: a foreign window must never be able to claim a connection.
        // The runtime origin is used deliberately — a build-time NEXT_PUBLIC_*
        // constant is frozen at build and silently rots when the deploy target
        // changes, which once made this check reject every genuine success.
        if (event.source !== popupRef.current) return;
        if (event.origin !== window.location.origin) return;

        const data = event.data;
        if (!data || typeof data !== "object") return;
        if (!("success" in data && "platform" in data)) return;

        const { success, platform: reported, error } = data as {
          success: boolean;
          platform: string;
          error?: string;
        };

        if (success) {
          settle(() => onSuccess(reported));
        } else {
          settle(() => onFailure(error || "The sign-in was interrupted. Please try again."));
        }
      };

      listenerRef.current = handleMessage;
      window.addEventListener("message", handleMessage);

      const popup = window.open(authUrl, "oauth-popup", POPUP_FEATURES);
      if (!popup) {
        // Nothing started, so there is nothing to reconcile.
        settle(() => onFailure(NO_POPUP));
        return;
      }
      popupRef.current = popup;

      pollRef.current = window.setInterval(() => {
        if (settledRef.current) return;
        const popup = popupRef.current;
        if (!popup || !popup.closed) return;
        popupRef.current = null;
        // The window is gone and nothing was posted: ask the backend whether the
        // connect landed before calling it a failure.
        void readAccounts().then((accounts) => {
          if (accounts && isConnectedSince(accounts, baselineRef.current)) {
            // The popup never reported, so the platform comes from the door the
            // user picked rather than from the message.
            settle(() => onSuccess(platformRef.current));
          } else {
            settle(() => onFailure(UNCONFIRMED));
          }
        });
      }, POLL_MS);
    },
    [readAccounts, stopWatching, closePopup, onSuccess, onFailure],
  );

  const cancel = useCallback(() => {
    // Marked settled as well as stopped: a reconcile fetch may already be in
    // flight, and cancelling must not let it report an outcome afterwards.
    settledRef.current = true;
    stopWatching();
    closePopup();
  }, [stopWatching, closePopup]);

  return { begin, cancel, takeBaseline };
}
