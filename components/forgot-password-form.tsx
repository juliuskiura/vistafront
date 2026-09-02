"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { initialAuthState } from "@/lib/auth/action-state";
import { requestPasswordResetAction } from "@/app/(auth)/password/reset/actions";

const LOGO_URL = "https://vsregmedia.s3.amazonaws.com/branding/logo_5MuHLkV.svg";

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

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialAuthState,
  );
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const formError = state.status === "error" ? state.message : null;

  if (state.status === "success") {
    return (
      <Card className="w-full max-w-md border-none bg-white/60 p-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_URL} alt="Vistasolve" className="mx-auto mb-4 h-8" />
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists for the address you entered, we&apos;ve sent a
          link to reset your password. The link expires in 30 minutes.
        </p>
        <div className="mt-6">
          <Link
            href="/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-none bg-white/60 p-8">
      <div className="mb-6 flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_URL} alt="Vistasolve" className="h-8" />
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          Reset your password
        </h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ll email you a link to choose a new one.
        </p>
      </div>

      <form action={formAction} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="bg-white/70 pl-10"
            />
          </div>
          {errors.email?.[0] && (
            <p className="text-xs text-destructive">{errors.email[0]}</p>
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
          {pending ? "Sending…" : "Send reset link"}
        </VSButton>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </p>

      <span hidden aria-hidden>
        <Lock />
        <Eye />
        <EyeOff />
      </span>
    </Card>
  );
}
