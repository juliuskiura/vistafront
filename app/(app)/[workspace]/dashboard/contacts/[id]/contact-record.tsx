"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pencil, Trash2 } from "@/lib/icons";
import { formatMediumDate } from "@/lib/dates";
import { resolveSocialIcon } from "@/lib/crm/social-icon-map";
import type { Activity, Contact, Deal } from "@/lib/api";
import { useToast } from "@/lib/context";
import {
  deleteContactAction,
  updateContactAction,
} from "@/app/(app)/[workspace]/dashboard/contacts/actions";
import { ContactEditForm } from "./_components/contact-edit-form";

interface Props {
  contact: Contact;
  workspaceDomain: string;
  activities: Activity[];
  deals: Deal[];
}

/**
 * The contact record.
 *
 * Inline editing of the contact's own fields, plus the activities and
 * deals that reference it.
 */
export function ContactRecord({
  contact,
  workspaceDomain,
  activities,
  deals,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [firstName, setFirstName] = useState(contact.first_name);
  const [lastName, setLastName] = useState(contact.last_name);
  const [email, setEmail] = useState(contact.email);
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [position, setPosition] = useState(contact.position ?? "");
  const [notes, setNotes] = useState(contact.notes ?? "");
  const [status, setStatus] = useState(contact.status);

  const fullName = `${contact.first_name} ${contact.last_name}`.trim();

  const save = () => {
    startTransition(async () => {
      const result = await updateContactAction({
        workspaceDomain,
        nanoid: contact.nanoid,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        position,
        notes,
        status,
      });
      if (result.status === "success") {
        toast.push({ variant: "success", message: "Contact updated." });
        setEditing(false);
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not update the contact.",
        });
      }
    });
  };

  const confirmDelete = () => {
    startTransition(async () => {
      const result = await deleteContactAction({
        workspaceDomain,
        nanoid: contact.nanoid,
      });
      if (result.status === "success") {
        toast.push({ variant: "success", message: "Contact deleted." });
        router.push(`/${workspaceDomain}/dashboard/contacts`);
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not delete the contact.",
        });
        setDeleteOpen(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold">
            {fullName || contact.email}
          </h1>
          <p className="text-sm text-muted-foreground">
            {contact.position
              ? `${contact.position} at ${contact.company_name}`
              : contact.company_name}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={editing ? "default" : "outline"}
            onClick={() => setEditing((v) => !v)}
            aria-pressed={editing}
          >
            <Pencil className="mr-1.5 size-3.5" aria-hidden="true" />
            {editing ? "Done editing" : "Edit"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setDeleteOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1.5 size-3.5" aria-hidden="true" />
            Delete
          </Button>
        </div>
      </div>

      {contact.social_links && contact.social_links.length > 0 ? (
        <ul className="flex flex-wrap items-center gap-2" aria-label="Social links">
          {contact.social_links.map((link, i) => {
            const Icon = resolveSocialIcon(link.name);
            return (
              <li key={`${link.url}-${i}`}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  title={link.name ? `${link.name} — ${link.url}` : link.url}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {link.name ?? "Link"}
                </a>
              </li>
            );
          })}
        </ul>
      ) : null}

      <Card className="rounded-xl border bg-card">
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <ContactEditForm
              firstName={firstName}
              setFirstName={setFirstName}
              lastName={lastName}
              setLastName={setLastName}
              email={email}
              setEmail={setEmail}
              phone={phone}
              setPhone={setPhone}
              position={position}
              setPosition={setPosition}
              notes={notes}
              setNotes={setNotes}
              status={status}
              setStatus={setStatus}
              pending={pending}
              onSave={save}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Detail label="Email" value={contact.email} />
              <Detail label="Phone" value={contact.phone ?? ""} />
              <Detail
                label="Status"
                value={contact.status[0].toUpperCase() + contact.status.slice(1)}
              />
              <div>
                <dt className="text-xs text-muted-foreground">Company</dt>
                <dd className="font-medium">
                  <Link
                    href={`/${workspaceDomain}/dashboard/companies/${contact.company}`}
                    className="text-primary hover:underline"
                  >
                    {contact.company_name}
                  </Link>
                </dd>
              </div>
              {typeof contact.deal_count === "number" ? (
                <Detail label="Deals" value={String(contact.deal_count)} />
              ) : null}
              <Detail label="Added" value={formatMediumDate(contact.created_at)} />
            </dl>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl border bg-card">
        <CardHeader>
          <CardTitle>Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No activities for this contact yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {activities.map((a) => (
                <li key={a.nanoid} className="text-sm">
                  <p className="font-medium">{a.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.action_type_name}
                    {a.due_at ? ` · due ${formatMediumDate(a.due_at)}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl border bg-card">
        <CardHeader>
          <CardTitle>Deals</CardTitle>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No deals for this contact yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {deals.map((d) => (
                <li key={d.nanoid} className="text-sm">
                  <Link
                    href={`/${workspaceDomain}/dashboard/deals/${d.nanoid}`}
                    className="font-medium hover:underline"
                  >
                    {d.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {d.stage} · {d.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">
        {value || <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}
