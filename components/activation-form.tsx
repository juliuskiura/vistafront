"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { AuthCard } from "@/components/auth/auth-card";
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

  const heading = pending
    ? "Activating your account…"
    : state.status === "ok"
      ? "Activating your account…"
      : "We could not activate your account";

  return (
    <AuthShell>
      <AuthCard className="text-center">
        <h1 className="text-xl font-semibold">{heading}</h1>
        {state.status === "error" && (
          <p className="mt-2 text-sm text-destructive">{state.message}</p>
        )}
        {state.status === "ok" && (
          <p className="mt-2 text-sm text-muted-foreground">
            This will only take a moment.
          </p>
        )}

        <form ref={formRef} action={formAction} className="sr-only">
          <input type="hidden" name="uid" value={uid} />
          <input type="hidden" name="token" value={token} />
          <button type="submit" aria-label="Activate" />
        </form>

        {state.status === "error" && (
          <div className="mt-6 flex flex-col gap-2 text-sm">
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        )}
      </AuthCard>
    </AuthShell>
  );
}
