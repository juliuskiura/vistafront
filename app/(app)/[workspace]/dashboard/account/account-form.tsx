"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/context";
import {
  initialAccountState,
  updateAccountAction,
  type AccountActionState,
} from "@/app/(app)/[workspace]/dashboard/account/actions";
import type { PersonalDetails } from "@/lib/api";

interface Props {
  details: PersonalDetails;
}

function initialsOf(d: PersonalDetails): string {
  const base = `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim();
  if (base) {
    return base
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return (d.email ?? "?").slice(0, 1).toUpperCase();
}

function fullName(d: PersonalDetails): string {
  const base = `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim();
  return base || d.email;
}

/**
 * Account → Personal details form (Client Component island).
 *
 * The form posts to `updateAccountAction` and reflects the resulting state
 * via `useActionState`. Toast feedback is shown for non-field errors.
 */
export function AccountForm({ details }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [state, formAction, pending] = useActionState<AccountActionState, FormData>(
    updateAccountAction,
    initialAccountState,
  );

  useEffect(() => {
    if (state.status === "success") {
      toast.push({ variant: "success", message: state.message ?? "Saved." });
      router.refresh();
    } else if (state.status === "error" && !state.fieldErrors) {
      toast.push({
        variant: "error",
        message: state.message ?? "Could not save your changes.",
      });
    }
  }, [state, toast, router]);

  const errors = state.fieldErrors ?? {};
  const formError =
    state.status === "error" && Object.keys(errors).length === 0
      ? state.message
      : null;

  return (
    <div className="glass-surface rounded-xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
            {initialsOf(details)}
          </span>
          <div className="min-w-0">
            <CardTitle>{fullName(details)}</CardTitle>
            <p className="text-xs text-muted-foreground">{details.email}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account-first-name">First name</Label>
              <Input
                id="account-first-name"
                name="first_name"
                defaultValue={details.first_name ?? ""}
                required
                aria-invalid={!!errors.first_name}
              />
              {errors.first_name?.[0] ? (
                <p className="text-xs text-destructive">{errors.first_name[0]}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-last-name">Last name</Label>
              <Input
                id="account-last-name"
                name="last_name"
                defaultValue={details.last_name ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-email">Email</Label>
            <Input
              id="account-email"
              name="email"
              type="email"
              defaultValue={details.email}
              required
              aria-invalid={!!errors.email}
            />
            {errors.email?.[0] ? (
              <p className="text-xs text-destructive">{errors.email[0]}</p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="account-phone-country">Phone country</Label>
              <Input
                id="account-phone-country"
                name="phone_country_code"
                defaultValue={details.phone_country_code}
                placeholder="+254"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="account-phone">Phone number</Label>
              <Input
                id="account-phone"
                name="phone_number"
                defaultValue={details.phone_number}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account-country">Country</Label>
              <Input
                id="account-country"
                name="country"
                defaultValue={details.country}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-city">City</Label>
              <Input
                id="account-city"
                name="city"
                defaultValue={details.city}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-location">Location</Label>
            <Input
              id="account-location"
              name="location"
              defaultValue={details.location}
            />
          </div>

          {formError ? (
            <div
              role="alert"
              className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {formError}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            {state.status === "success" && state.message ? (
              <p className="text-xs text-emerald-600">{state.message}</p>
            ) : null}
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </div>
  );
}