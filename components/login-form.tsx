"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ExternalLink } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthCard } from "@/components/auth/auth-card";
import type { AuthActionState } from "@/lib/auth/action-state";
import { loginAction } from "@/app/(auth)/login/actions";

import { VSButton } from "@/components/shared/components/customUi/VSButton";

const LOGO_URL = "https://vsregmedia.s3.amazonaws.com/branding/logo_5MuHLkV.svg";

interface Props {
  /** Initial Server Action state. Pages pass `initialAuthState`. */
  action: AuthActionState;
}

export function LoginForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(loginAction, action);
  const [showPassword, setShowPassword] = useState(false);
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const emailError = errors.email?.[0];
  const passwordError = errors.password?.[0];
  const formError = state.status === "error" ? state.message : null;

  return (
    <AuthShell>
      <AuthCard>
        <div className="mb-6 flex animate-in fade-in slide-in-from-bottom-2 flex-col items-center gap-3 duration-500 delay-75">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_URL} alt="Vistasolve" className="h-8" />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-primary">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your Vistasolve workspace
            </p>
          </div>
        </div>

        <form
          action={formAction}
          className="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-500 delay-150"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 z-10 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                autoComplete="email"
                autoFocus
                className="glass-input pl-10"
              />
            </div>
            {emailError && (
              <p className="text-xs text-destructive">{emailError}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/password/reset"
                className="text-xs font-medium text-primary hover:underline underline-offset-4"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 z-10 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
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
            {passwordError && (
              <p className="text-xs text-destructive">{passwordError}</p>
            )}
          </div>

          {formError && (
            <div
              id="login-error"
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
            {pending ? "Signing in…" : "Sign in"}
          </VSButton>
        </form>
      </AuthCard>

      <AuthCard
        motion="bottom"
        className="mt-4 rounded-2xl p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="flex-1 shrink gap-1.5"
          >
            <Link href="/signup">Create your account</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 shrink gap-1.5 border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
          >
            <a href="https://vistasolve.com">
              Vistasolve Home
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
