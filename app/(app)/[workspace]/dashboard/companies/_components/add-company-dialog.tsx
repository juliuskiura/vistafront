"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2 } from "@/lib/icons";
import type {
  Country,
  Industry,
  TierClassification,
} from "@/lib/api";
import { useToast } from "@/lib/context";
import { createCompanyAction } from "@/app/(app)/[workspace]/dashboard/companies/actions";
import {
  initialCreateCompanyState,
  type CreateCompanyActionState,
} from "@/app/(app)/[workspace]/dashboard/companies/action-state";
import {
  PhoneNumbersField,
  SocialLinksField,
} from "./company-list-fields";
import { CompanyFormFields } from "./company-form-fields";
import { IndustrySelect } from "./industry-select";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: { nanoid: string; name: string; domain: string };
  industries: Industry[];
  tierClassifications: TierClassification[];
  countries: Country[];
}

/**
 * The "New Company" dialog.
 *
 * Posts the whole record at once through `createCompanyAction`; the phone
 * numbers and social links are repeatable fields, so they are collected in
 * local state and appended to the `FormData` as repeated values.
 */
export function AddCompanyDialog({
  open,
  onOpenChange,
  workspace,
  industries,
  tierClassifications,
  countries,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [state, formAction, pending] = useActionState<
    CreateCompanyActionState,
    FormData
  >(createCompanyAction, initialCreateCompanyState);
  const [phoneEntries, setPhoneEntries] = useState<string[]>([""]);
  const [socialEntries, setSocialEntries] = useState<
    { url: string; name: string }[]
  >([{ url: "", name: "" }]);

  useEffect(() => {
    if (state.status === "success") {
      toast.push({
        variant: "success",
        message: state.message ?? "Company created.",
      });
      onOpenChange(false);
      router.refresh();
    } else if (state.status === "error" && !state.fieldErrors) {
      toast.push({
        variant: "error",
        message: state.message ?? "Could not create company.",
      });
    }
  }, [state, toast, onOpenChange, router]);

  // Reset the repeatable fields when the dialog closes so the next open
  // starts from a blank slate. Done in the close handler (an event, not an
  // effect) to avoid calling setState inside an effect.
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPhoneEntries([""]);
      setSocialEntries([{ url: "", name: "" }]);
    }
    onOpenChange(next);
  };

  const errors = state.fieldErrors ?? {};
  const formError =
    state.status === "error" && Object.keys(errors).length === 0
      ? state.message
      : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-lg"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader className="bg-primary px-5 py-4 text-primary-foreground">
          <DialogTitle className="text-primary-foreground">
            <Building2 className="mr-2 inline-block size-4" />
            New Company
          </DialogTitle>
          <DialogDescription className="text-primary-foreground/80">
            Add a company to {workspace.name}&apos;s CRM.
          </DialogDescription>
        </DialogHeader>

        <form
          action={(submitted) => {
            submitted.set("workspace_domain", workspace.domain);
            const cleanPhones = phoneEntries
              .map((p) => p.trim())
              .filter(Boolean);
            submitted.delete("phone_numbers");
            cleanPhones.forEach((p) => submitted.append("phone_numbers", p));
            const cleanSocials = socialEntries
              .map((s) => ({ url: s.url.trim(), name: s.name.trim() || undefined }))
              .filter((s) => s.url);
            submitted.delete("social_links");
            cleanSocials.forEach((s) =>
              submitted.append("social_links", JSON.stringify(s)),
            );
            formAction(submitted);
          }}
          className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4"
        >
          <input type="hidden" name="workspace_domain" value={workspace.domain} />

          <div className="space-y-1.5">
            <Label htmlFor="company-name">Name *</Label>
            <Input
              id="company-name"
              name="name"
              required
              aria-invalid={!!errors.name}
            />
            {errors.name?.[0] ? (
              <p className="text-xs text-destructive">{errors.name[0]}</p>
            ) : null}
          </div>

          <CompanyFormFields
            industries={industries}
            tierClassifications={tierClassifications}
            countries={countries}
            workspaceDomain={workspace.domain}
            errors={errors}
          />

          <PhoneNumbersField
            entries={phoneEntries}
            onChange={setPhoneEntries}
          />

          <SocialLinksField
            entries={socialEntries}
            onChange={setSocialEntries}
          />

          <div className="space-y-1.5">
            <Label htmlFor="company-about">About</Label>
            <textarea
              id="company-about"
              name="about"
              rows={3}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="verified"
              className="size-4 rounded border-input"
            />
            Verified
          </label>

          {formError ? (
            <div
              role="alert"
              className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {formError}
            </div>
          ) : null}

          <DialogFooter className="px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create Company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
