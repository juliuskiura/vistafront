"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/features/accounts/lib/auth";
import { parseApiError } from "@/lib/apiErrors";

function VSButton({
  className,
  appearance = "solid",
  variant = "primary",
  ...props
}: React.ComponentProps<"button"> & {
  appearance?: "solid" | "ghost" | "outline" | "threeD";
  variant?: "primary" | "secondary";
}) {
  return (
    <Button
      className={cn(
        "h-11 rounded-xl px-4 font-medium",
        appearance === "threeD" &&
          "bg-primary text-primary-foreground shadow-[0_4px_0_0_var(--primary-700)] transition-all hover:translate-y-[1px] hover:shadow-[0_3px_0_0_var(--primary-700)] active:translate-y-[4px] active:shadow-none",
        appearance === "outline" &&
          variant === "primary" &&
          "border border-primary/30 bg-transparent text-primary hover:bg-primary/5",
        appearance === "ghost" && "bg-transparent shadow-none",
        className,
      )}
      {...props}
    />
  );
}

const LOGO_URL = "https://vsregmedia.s3.amazonaws.com/branding/logo_5MuHLkV.svg";

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(parseApiError(err) || "Sign in failed");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col">
      <div className="w-full border-none bg-white/60 p-8">
        <div className="mb-6 flex flex-col items-center gap-3">
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

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                className="bg-white/70 pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a
                href="/password/reset"
                className="text-xs font-medium text-primary hover:underline underline-offset-4"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="bg-white/70 pl-10 pr-10"
              />
              <VSButton
                type="button"
                appearance="ghost"
                className="absolute right-0 top-0 h-full w-11 rounded-none border-transparent p-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
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
          </div>

          {error && (
            <div
              id="login-error"
              role="alert"
              className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <VSButton
            type="submit"
            appearance="threeD"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </VSButton>
        </form>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/40 bg-white/50 p-4 backdrop-blur-xl sm:flex-row sm:items-center">
        <Button
          asChild
          variant="secondary"
          size="sm"
          className="flex-1 shrink gap-1.5"
        >
          <a href="/signup">Create your account</a>
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
    </div>
  );
}
