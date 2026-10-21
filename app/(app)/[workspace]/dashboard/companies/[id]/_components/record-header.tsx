"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pencil, Trash2, UserPlus } from "@/lib/icons";
import { PROSPECT_LABELS, STATUS_COLORS } from "@/lib/crm/constants";
import { resolveSocialIcon } from "@/lib/crm/social-icon-map";
import type { Company, CompanySocialLink } from "@/lib/api";
import { useToast } from "@/lib/context";
import { deleteCompanyAction } from "@/app/(app)/[workspace]/dashboard/companies/record-actions";

interface Props {
  company: Company;
  workspaceDomain: string;
  editing: boolean;
  onToggleEdit: () => void;
  onAddContact: () => void;
}

/**
 * The company record header.
 *
 * Shows the name, the current prospect stage, the social links as network
 * badges (the primary one starred), and the record actions: edit toggle,
 * add contact, and delete.
 */
export function RecordHeader({
  company,
  workspaceDomain,
  editing,
  onToggleEdit,
  onAddContact,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const confirmDelete = () => {
    startTransition(async () => {
      const result = await deleteCompanyAction(company.nanoid, workspaceDomain);
      if (result.status === "success") {
        toast.push({ variant: "success", message: "Company deleted." });
        router.push(`/${workspaceDomain}/dashboard/companies`);
      } else {
        // The backend answers 409 with the exact reason — surface it.
        toast.push({
          variant: "error",
          message: result.message ?? "Could not delete the company.",
        });
        setDeleteOpen(false);
      }
    });
  };

  return (
    <div className="space-y-4">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link
          href={`/${workspaceDomain}/dashboard/companies`}
          className="text-muted-foreground hover:underline"
        >
          ← Companies
        </Link>
        <span className="mx-2 text-muted-foreground" aria-hidden="true">
          /
        </span>
        <span className="font-medium">{company.name}</span>
      </nav>

      <div className="flex flex-wrap items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-base font-semibold uppercase">
          {company.name[0]?.toUpperCase() ?? "?"}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold">{company.name}</h1>
          <p className="text-sm text-muted-foreground">
            {company.industry ?? "—"}
            {company.domain ? ` · ${company.domain}` : ""}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            STATUS_COLORS[company.status] ?? ""
          }`}
        >
          {PROSPECT_LABELS[company.status]}
        </span>
      </div>

      {company.social_links && company.social_links.length > 0 ? (
        <SocialBadges links={company.social_links} />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={editing ? "default" : "outline"}
          size="sm"
          onClick={onToggleEdit}
          aria-pressed={editing}
        >
          <Pencil className="mr-1.5 size-3.5" aria-hidden="true" />
          {editing ? "Done editing" : "Edit"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onAddContact}>
          <UserPlus className="mr-1.5 size-3.5" aria-hidden="true" />
          Add contact
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-1.5 size-3.5" aria-hidden="true" />
          Delete company
        </Button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete company?"
        description={`This will permanently delete ${company.name}. If the company still has contacts or deals, the backend will refuse and tell you what to remove first.`}
        confirmLabel="Delete"
        variant="destructive"
        confirming={pending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

/**
 * The social links, rendered as network badges.
 *
 * A link's `name` is free text, so the icon lookup is forgiving (see
 * `lib/crm/social-icon-map`). The primary link — the one the backend
 * flagged with `is_primary` — is starred.
 */
function SocialBadges({ links }: { links: CompanySocialLink[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Social links">
      {links.map((link, i) => {
        const Icon = resolveSocialIcon(link.name);
        const isPrimary = link.is_primary === true;
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
              {isPrimary ? (
                <span aria-label="Primary link" className="text-amber-500">
                  ★
                </span>
              ) : null}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
