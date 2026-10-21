"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus } from "@/lib/icons";
import { useToast } from "@/lib/context";
import type { Contact } from "@/lib/api";
import { deleteContactAction } from "@/app/(app)/[workspace]/dashboard/companies/[id]/record-contact-actions";
import { DeleteRowButton, EmptyTab, TabCard } from "./record-list";

interface Props {
  company: { nanoid: string; name: string };
  workspaceDomain: string;
  contacts: Contact[];
}

/**
 * The contacts tab.
 *
 * Each contact links to its own record, where the full profile, the
 * activities and the deals live.
 */
export function ContactsTab({ company, workspaceDomain, contacts }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<string | null>(null);

  const confirmDelete = () => {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteContactAction({
        workspaceDomain,
        nanoid: deleting,
        company: company.nanoid,
      });
      if (result.status === "success") {
        toast.push({ variant: "success", message: "Contact deleted." });
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not delete the contact.",
        });
      }
      setDeleting(null);
    });
  };

  if (contacts.length === 0) {
    return (
      <EmptyTab
        title="No contacts yet"
        description="Add the people you talk to at this company."
      />
    );
  }

  return (
    <div className="space-y-3">
      <TabCard
        title="Contacts"
        description={`${contacts.length} people`}
      >
        {contacts.map((c) => {
          const fullName = `${c.first_name} ${c.last_name}`.trim();
          return (
            <div key={c.nanoid} className="flex items-center gap-3 px-4 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {(c.first_name[0] ?? c.email[0] ?? "?").toUpperCase()}
                {(c.last_name?.[0] ?? "").toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/${workspaceDomain}/dashboard/contacts/${c.nanoid}`}
                  className="truncate text-sm font-medium hover:underline"
                >
                  {fullName || c.email}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {c.position ? `${c.position} · ` : ""}
                  {c.email}
                </p>
              </div>
              <DeleteRowButton
                onDelete={() => setDeleting(c.nanoid)}
                label={`Delete contact ${fullName || c.email}`}
                pending={pending}
              />
            </div>
          );
        })}
      </TabCard>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete contact?"
        description="This contact will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        confirming={pending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
