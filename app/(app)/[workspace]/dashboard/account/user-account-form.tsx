"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/context";
import {
  initialUserState,
  updateUserProfileAction,
  type UserActionState,
} from "@/app/(app)/[workspace]/dashboard/account/actions";
import type { PersonalDetails } from "@/lib/api";

type PersonalDetailsPatch = Partial<
  Pick<
    PersonalDetails,
    | "first_name"
    | "last_name"
    | "email"
    | "country"
    | "city"
    | "location"
    | "phone_country_code"
    | "phone_number"
  >
>;

function initialsOf(d: PersonalDetails): string {
  const first = d.first_name ?? "";
  const last = d.last_name ?? "";
  if (first || last) {
    return (first + " " + last)
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return (d.email ?? "?").slice(0, 1).toUpperCase();
}

function fullName(d: PersonalDetails): string {
  return d.first_name ?? d.last_name ?? d.email ?? "";
}

/**
 * User → User account form (Client Component island).
 *
 * The form posts to `updateUserProfileAction` and reflects the resulting state
 * via `useActionState`. Toast feedback is shown for non-field errors.
 */
export function UserAccountForm({ personalDetails }: { personalDetails: PersonalDetails }) {
  const router = useRouter();
  const toast = useToast();
  const [state, formAction, pending] = useActionState<UserActionState, FormData>(
    updateUserProfileAction,
    initialUserState,
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
            {initialsOf(personalDetails)}
          </span>
          <div className="min-w-0">
            <CardTitle>{fullName(personalDetails)}</CardTitle>
            <p className="text-xs text-muted-foreground">{personalDetails.email}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="personal_details_nanoid" value={personalDetails.nanoid} />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-first-name">First name</Label>
              <Input
                id="user-first-name"
                name="first_name"
                defaultValue={personalDetails.first_name ?? ""}
              />
              {errors.first_name?.[0] ? (
                <p className="text-xs text-destructive">{errors.first_name[0]}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-last-name">Last name</Label>
              <Input
                id="user-last-name"
                name="last_name"
                defaultValue={personalDetails.last_name ?? ""}
              />
              {errors.last_name?.[0] ? (
                <p className="text-xs text-destructive">{errors.last_name[0]}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="user-phone-country">Phone country</Label>
              <Input
                id="user-phone-country"
                name="phone_country_code"
                defaultValue={personalDetails.phone_country_code}
                placeholder="+254"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="user-phone">Phone number</Label>
              <Input
                id="user-phone"
                name="phone_number"
                defaultValue={personalDetails.phone_number}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-country">Country</Label>
              <Input
                id="user-country"
                name="country"
                defaultValue={personalDetails.country}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-city">City</Label>
              <Input
                id="user-city"
                name="city"
                defaultValue={personalDetails.city}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-location">Location</Label>
              <Input
                id="user-location"
                name="location"
                defaultValue={personalDetails.location}
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