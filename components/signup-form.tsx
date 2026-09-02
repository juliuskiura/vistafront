"use client";

import { useActionState, useState } from "react";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthCard } from "@/components/auth/auth-card";
import { initialAuthState } from "@/lib/auth/action-state";
import { signupAction } from "@/app/(auth)/signup/actions";

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

const LOGO_URL = "https://vsregmedia.s3.amazonaws.com/branding/logo_5MuHLkV.svg";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(
    signupAction,
    initialAuthState,
  );
  const [showPassword, setShowPassword] = useState(false);
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const formError = state.status === "error" ? state.message : null;

  return (
    <AuthShell>
      <AuthCard>
        <div className="mb-6 flex animate-in fade-in slide-in-from-bottom-2 flex-col items-center gap-3 duration-500 delay-75">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_URL} alt="Vistasolve" className="h-8" />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-primary">
              Create your account
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;ll send a confirmation link to your email.
            </p>
          </div>
        </div>

        <form
          action={formAction}
          className="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-500 delay-150"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 z-10 h-4 w-4 text-muted-foreground" />
                <Input
                  id="first_name"
                  name="first_name"
                  required
                  autoComplete="given-name"
                  className="glass-input pl-10"
                />
              </div>
              {errors.first_name?.[0] && (
                <p className="text-xs text-destructive">
                  {errors.first_name[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input
                id="last_name"
                name="last_name"
                autoComplete="family-name"
                className="glass-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 z-10 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="glass-input pl-10"
              />
            </div>
            {errors.email?.[0] && (
              <p className="text-xs text-destructive">{errors.email[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 z-10 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                className="glass-input pl-10 pr-10"
              />
              <VSButton
                type="button"
                appearance="ghost"
                className="absolute right-0 top-0 z-10 h-full w-11 rounded-none border-transparent p-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </VSButton>
            </div>
            {errors.password?.[0] && (
              <p className="text-xs text-destructive">
                {errors.password[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="re_password">Confirm password</Label>
            <Input
              id="re_password"
              name="re_password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              className="glass-input"
            />
            {errors.re_password?.[0] && (
              <p className="text-xs text-destructive">
                {errors.re_password[0]}
              </p>
            )}
          </div>

          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              id="agree_terms"
              name="agree_terms"
              type="checkbox"
              required
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span>
              I agree to the Vistasolve{" "}
              <Link href="/terms" className="text-primary hover:underline">
                terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                privacy policy
              </Link>
              .
            </span>
          </label>
          {errors.agree_terms?.[0] && (
            <p className="text-xs text-destructive">
              {errors.agree_terms[0]}
            </p>
          )}

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
            {pending ? "Creating your account…" : "Create account"}
          </VSButton>
        </form>
      </AuthCard>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
