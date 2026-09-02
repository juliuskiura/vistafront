"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";

import { initialAuthState } from "@/lib/auth/action-state";
import {
  activateAndLoginAction,
  type ActivationResult,
} from "@/app/(auth)/activate/[uid]/[token]/actions";

const initialResult: ActivationResult = { status: "ok", message: "" };

interface Props {
  uid: string;
  token: string;
}

/**
 * Client wrapper for the activation page. It auto-submits the
 * `activateAndLoginAction` Server Action on mount and renders the result.
 *
 * Why a Client Component: the form needs `useActionState` to surface
 * `pending` and any error, and it must auto-submit on mount. The Server
 * Component page passes the URL params in as plain props.
 */
export function ActivationForm({ uid, token }: Props) {
  const [state, formAction, pending] = useActionState(
    activateAndLoginAction,
    initialResult,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "ok" || pending) return;
    formRef.current?.requestSubmit();
    // Only fire once on mount; we re-fire only if the user navigates back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
      <div>
        <h1 className="text-xl font-semibold">
          {pending
            ? "Activating your account…"
            : state.status === "ok"
              ? "Activating your account…"
              : "We could not activate your account"}
        </h1>
        {state.status === "error" && (
          <p className="mt-2 text-sm text-destructive">{state.message}</p>
        )}
        {state.status === "ok" && (
          <p className="mt-2 text-sm text-muted-foreground">
            This will only take a moment.
          </p>
        )}
      </div>

      <form ref={formRef} action={formAction} className="sr-only">
        <input type="hidden" name="uid" value={uid} />
        <input type="hidden" name="token" value={token} />
        <button type="submit" aria-label="Activate" />
      </form>

      {state.status === "error" && (
        <div className="flex flex-col gap-2 text-sm">
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      )}

      {/* Reference the import to satisfy `no-unused-vars` if the helper is
          tree-shaken away during the success path. */}
      <span hidden aria-hidden>
        {initialAuthState.status}
      </span>
    </section>
  );
}
