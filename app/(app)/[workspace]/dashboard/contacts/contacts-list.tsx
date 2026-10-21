"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Trash2, UserPlus } from "@/lib/icons";
import type { Company, Contact } from "@/lib/api";
import { useToast } from "@/lib/context";
import { deleteContactAction } from "@/app/(app)/[workspace]/dashboard/contacts/actions";
import { ContactForm } from "./_components/contact-form";

interface Props {
  contacts: Contact[];
  companies: Company[];
  workspaceDomain: string;
  search: string;
}

/**
 * The contacts list.
 *
 * The backend has no `?search=` for contacts, so the page fetches every
 * contact and filters in memory — the list is capped and labelled so it
 * is obvious when the result set was truncated. A real fix needs a
 * backend query parameter, which is out of scope for the frontend.
 */
export function ContactsList({ contacts, companies, workspaceDomain, search }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const confirmDelete = () => {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteContactAction({
        workspaceDomain,
        nanoid: deleting,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            {contacts.length} contact{contacts.length === 1 ? "" : "s"} in this
            workspace.
          </p>
        </div>
        <Button type="button" onClick={() => setAddOpen(true)}>
          <UserPlus className="mr-1.5 size-4" aria-hidden="true" />
          Add contact
        </Button>
      </div>

      <form className="flex flex-wrap gap-2" method="get" role="search">
        <label htmlFor="contact-search" className="sr-only">
          Search contacts
        </label>
        <input
          id="contact-search"
          type="search"
          name="search"
          defaultValue={search}
          placeholder="Search contacts…"
          className="flex h-9 w-full max-w-sm rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        />
        <Button type="submit" size="sm" variant="outline">
          Search
        </Button>
        {search ? (
          <Link
            href={`/${workspaceDomain}/dashboard/contacts`}
            className="inline-flex h-9 items-center text-xs text-muted-foreground hover:underline"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <p className="text-xs text-muted-foreground">
        The backend has no server-side search for contacts, so this page
        loads every contact and filters in the browser.
      </p>

      {contacts.length === 0 ? (
        <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          {search
            ? `No contacts match “${search}”.`
            : "No contacts yet. Add one from the CRM."}
        </Card>
      ) : (
        <Card className="divide-y rounded-xl border bg-card">
          {contacts.map((c) => {
            const fullName = `${c.first_name} ${c.last_name}`.trim();
            return (
              <div
                key={c.nanoid}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Link
                  href={`/${workspaceDomain}/dashboard/contacts/${c.nanoid}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {(c.first_name[0] ?? c.email[0] ?? "?").toUpperCase()}
                    {(c.last_name?.[0] ?? "").toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {fullName || c.email}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {c.position ? `${c.position} · ` : ""}
                      {c.company_name}
                      {c.email ? ` · ${c.email}` : ""}
                    </span>
                  </span>
                </Link>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                  {c.status}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setDeleting(c.nanoid)}
                  disabled={pending}
                  aria-label={`Delete contact ${fullName || c.email}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            );
          })}
        </Card>
      )}

      <ContactForm
        open={addOpen}
        onOpenChange={setAddOpen}
        workspaceDomain={workspaceDomain}
        companies={companies}
      />

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
