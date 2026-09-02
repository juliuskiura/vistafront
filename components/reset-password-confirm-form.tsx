"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Lock, Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { initialAuthState } from "@/lib/auth/action-state";
import { confirmPasswordResetAction } from "@/app/(auth)/password/reset/confirm/actions";

const LOGO_URL = "https://vsregmedia.s3.amazonaws.com/branding/logo_5MuHLkV.svg";

interface Props {
  uid: string;
  token: string;
}

function VSButton({
  className,
  appearance = "solid",
  ...props
}: React.ComponentProps<"button"> & {
  appearance?: "solid" | "ghost" | "outline" | "threeD";
}) {
  return (
    <Button
      className={cn(
        "h-11 rounded-xl px-4 font-medium",
        appearance === "threeD" &&
          "bg-primary text-primary-foreground shadow-[0_4px_0_0_var(--primary-700)] transition-all hover:translate-y-[1px] hover:shadow-[0_3px_0_0_var(--primary-700)] active:translate-y-[4px] active:shadow-none",
        className,
      )}
      {...props}
    />
  );
}

export function ResetPasswordConfirmForm({ uid, token }: Props) {
  const [state, formAction, pending] = useActionState(
    confirmPasswordResetAction,
    initialAuthState,
  );
  const [show, setShow] = useState(false);
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const formError = state.status === "error" ? state.message : null;

  return (
    <Card className="w-full max-w-md border-none bg-white/60 p-8">
      <div className="mb-6 flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_URL} alt="Vistasolve" className="h-8" />
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          Choose a new password
        </h1>
        <p className="text-sm text-muted-foreground">
          At least 8 characters.
        </p>
      </div>

      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="uid" value={uid} />
        <input type="hidden" name="token" value={token} />

        <div className="space-y-2">
          <Label htmlFor="new_password">New password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="new_password"
              name="new_password"
              type={show ? "text" : "password"}
              required
              autoComplete="new-password"
              minLength={8}
              className="bg-white/70 pl-10 pr-10"
            />
            <VSButton
              type="button"
              appearance="ghost"
              className="absolute right-0 top-0 h-full w-11 rounded-none border-transparent p-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </VSButton>
          </div>
          {errors.new_password?.[0] && (
            <p className="text-xs text-destructive">
              {errors.new_password[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="re_new_password">Confirm new password</Label>
          <Input
            id="re_new_password"
            name="re_new_password"
            type={show ? "text" : "password"}
            required
            autoComplete="new-password"
            minLength={8}
            className="bg-white/70"
          />
          {errors.re_new_password?.[0] && (
            <p className="text-xs text-destructive">
              {errors.re_new_password[0]}
            </p>
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
          {pending ? "Saving…" : "Save new password"}
        </VSButton>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </Card>
  );
}
