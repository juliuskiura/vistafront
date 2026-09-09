"use client";

import { useActionState, useState } from "react";
import { useToast } from "@/lib/context";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "./actions";
import type { AccountActionState } from "./actions";

export default function AccountSecurityPage() {
  const toast = useToast();
  const [state, formAction, pending] = useActionState<AccountActionState, FormData>(
    changePasswordAction,
    { status: "idle" },
  );
  const [showPassword, setShowPassword] = useState(false);

  const errors = state.fieldErrors ?? {};
  const formError =
    state.status === "error" && Object.keys(errors).length === 0
      ? state.message
      : null;

  return (
    <div className="glass-surface rounded-xl">
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <p className="text-sm text-muted-foreground">
          Change your password and manage authentication settings.
        </p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              name="current_password"
              type={showPassword ? "text" : "password"}
              required
              aria-invalid={!!errors.current_password}
            />
            {errors.current_password?.[0] ? (
              <p className="text-xs text-destructive">{errors.current_password[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              name="new_password"
              type={showPassword ? "text" : "password"}
              required
              aria-invalid={!!errors.new_password}
            />
            {errors.new_password?.[0] ? (
              <p className="text-xs text-destructive">{errors.new_password[0]}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <input
              id="show-password"
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              className="rounded"
            />
            <Label htmlFor="show-password" className="text-sm">
              Show passwords
            </Label>
          </div>
          {formError ? (
            <div
              role="alert"
              className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {formError}
            </div>
          ) : null}
          {state.status === "success" && state.message ? (
            <p className="text-xs text-emerald-600">{state.message}</p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Change password"}
          </Button>
        </form>
      </CardContent>
    </div>
  );
}
