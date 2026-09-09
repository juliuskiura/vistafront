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
import type { ClientBusiness } from "@/lib/api";

interface Props {
  org: ClientBusiness;
  workspaceDomain: string;
}

function initialsOf(d: ClientBusiness): string {
  const base = d.legal_name ?? "";
  if (base) {
    return base
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return (d.business_email ?? "?").slice(0, 1).toUpperCase();
}

function fullName(d: ClientBusiness): string {
  return d.legal_name ?? d.business_email ?? "";
}

/**
 * Account → Organization details form (Client Component island).
 *
 * The form posts to `updateAccountAction` and reflects the resulting state
 * via `useActionState`. Toast feedback is shown for non-field errors.
 */
export function AccountForm({ org, workspaceDomain }: Props) {
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
            {initialsOf(org)}
          </span>
          <div className="min-w-0">
            <CardTitle>{fullName(org)}</CardTitle>
            <p className="text-xs text-muted-foreground">{org.business_email}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="org_nanoid" value={org.nanoid} />
          <input type="hidden" name="workspace_domain" value={workspaceDomain} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account-legal-name">Organization name</Label>
              <Input
                id="account-legal-name"
                name="legal_name"
                defaultValue={org.legal_name ?? ""}
                required
                aria-invalid={!!errors.legal_name}
              />
              {errors.legal_name?.[0] ? (
                <p className="text-xs text-destructive">{errors.legal_name[0]}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-registration">Registration number</Label>
              <Input
                id="account-registration"
                name="registration_number"
                defaultValue={org.registration_number ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-email">Business email</Label>
            <Input
              id="account-email"
              name="business_email"
              type="email"
              defaultValue={org.business_email}
              required
              aria-invalid={!!errors.business_email}
            />
            {errors.business_email?.[0] ? (
              <p className="text-xs text-destructive">{errors.business_email[0]}</p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="account-phone-country">Phone country</Label>
              <Input
                id="account-phone-country"
                name="phone_country_code"
                defaultValue={org.phone_country_code}
                placeholder="+254"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="account-phone">Phone number</Label>
              <Input
                id="account-phone"
                name="phone_number"
                defaultValue={org.phone_number}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account-country">Country</Label>
              <Input
                id="account-country"
                name="country"
                defaultValue={org.country}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-city">City</Label>
              <Input
                id="account-city"
                name="city"
                defaultValue={org.city}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-location">Location</Label>
            <Input
              id="account-location"
              name="location"
              defaultValue={org.location}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account-tax">Tax ID</Label>
              <Input
                id="account-tax"
                name="tax_id"
                defaultValue={org.tax_id}
              />
            </div>
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