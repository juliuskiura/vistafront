"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InviteSchema, type InviteInput } from "@/lib/schemas";

/** RHF-friendly input type. Zod v4's `.default()` makes fields optional
 * in the inferred *input* but required in the inferred *output*; for a
 * controlled form we want the resolved shape. */
type InviteFormValues = Required<InviteInput>;

interface InviteFormProps {
  /** Active workspace domain — passed as a hidden field so the action
   * receives it on form submit. */
  workspace: string;
  /** Server Action that performs the mutation. Wrapped with
   * `useTransition` so the submit button gets a pending state. */
  action: (input: InviteInput) => Promise<{ status: "success" | "error"; message?: string }>;
}

/**
 * Reference React Hook Form + Zod form.
 *
 * The same `InviteSchema` is used by both:
 *   - This Client Component, via `zodResolver(InviteSchema)`, for live
 *     field-level validation as the user types.
 *   - The Server Action that `action` calls, for the authoritative
 *     server-side validation (Zod also runs there).
 *
 * One schema = one contract. No drift between the client-side error map
 * and the server-side rejection.
 */
export function InviteForm({ workspace, action }: InviteFormProps) {
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(InviteSchema) as never,
    defaultValues: { workspace, role: "member", email: "", first_name: "", last_name: "" },
  });

  function onSubmit(values: InviteFormValues) {
    startTransition(async () => {
      const result = await action(values as InviteInput);
      if (result.status === "success") reset();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <input type="hidden" {...register("workspace")} />

      <div>
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email ? (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="invite-first">First name</Label>
          <Input
            id="invite-first"
            autoComplete="given-name"
            aria-invalid={!!errors.first_name}
            {...register("first_name")}
          />
          {errors.first_name ? (
            <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="invite-last">Last name</Label>
          <Input
            id="invite-last"
            autoComplete="family-name"
            aria-invalid={!!errors.last_name}
            {...register("last_name")}
          />
          {errors.last_name ? (
            <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>
          ) : null}
        </div>
      </div>

      <div>
        <Label htmlFor="invite-role">Role</Label>
        <select
          id="invite-role"
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          {...register("role")}
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <Button type="submit" disabled={isSubmitting || pending}>
        {isSubmitting || pending ? "Sending…" : "Send invite"}
      </Button>
    </form>
  );
}