"use client";

import { useActionState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { initialAuthState } from "@/lib/auth/action-state";
import { redeemInviteAction } from "@/app/(app)/onboarding/actions";

const LOGO_URL = "https://vsregmedia.s3.amazonaws.com/branding/logo_5MuHLkV.svg";

interface Props {
  initialCode: string;
}

import { VSButton } from "@/components/shared/components/customUi/VSButton";

export function JoinWorkspaceForm({ initialCode }: Props) {
  const [state, formAction, pending] = useActionState(
    redeemInviteAction,
    initialAuthState,
  );
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const formError = state.status === "error" ? state.message : null;

  return (
    <div className="flex w-full max-w-md flex-col">
      <Card className="border-none bg-white/60 p-8">
        <div className="mb-6 flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_URL} alt="Vistasolve" className="h-8" />
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Join a workspace
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            Paste the invite code or link you received.
          </p>
        </div>

        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="code">Invite code</Label>
            <Input
              id="code"
              name="code"
              required
              autoFocus
              defaultValue={initialCode}
              placeholder="e.g. a1b2c3d4"
              className="bg-white/70"
            />
            {errors.code?.[0] && (
              <p className="text-xs text-destructive">{errors.code[0]}</p>
            )}
          </div>

          {formError && (
            <div
              role="alert"
              className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {formError}
            </div>
          )}

          <VSButton
            type="submit"
            appearance="threeD"
            className="w-full"
            disabled={pending}
          >
            {pending ? "Joining…" : "Join"}
          </VSButton>
        </form>
      </Card>
    </div>
  );
}
