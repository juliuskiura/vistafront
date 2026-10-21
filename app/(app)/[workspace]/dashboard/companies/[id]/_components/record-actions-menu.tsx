"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Archive,
  MoreVertical,
  Pencil,
  RotateCcw,
  Trash2,
  UserPlus,
} from "@/lib/icons";
import type { Company } from "@/lib/api";
import { useToast } from "@/lib/context";
import {
  archiveCompanyAction,
  deleteCompanyAction,
  unarchiveCompanyAction,
} from "@/app/(app)/[workspace]/dashboard/companies/record-actions";
import { AddContactDialog } from "./add-contact-dialog";

interface Props {
  company: Company;
  workspaceDomain: string;
  /** The tab the record is showing — the edit toggle keeps it. */
  activeTab: string;
  /** Whether the record is currently in edit mode. */
  editing: boolean;
}

/**
 * The company record's overflow menu.
 *
 * The same pattern the Social Manager uses on a post: one small button in
 * the header, and every record action behind it — edit, add contact,
 * archive, delete. The menu sits at the end of the CRM nav strip, right
 * after the "Deals" pill, so the record actions live where the app's
 * section switcher is rather than in a row of their own.
 */
export function RecordActionsMenu({
  company,
  workspaceDomain,
  activeTab,
  editing,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const toggleEdit = () => {
    const params = new URLSearchParams();
    params.set("tab", activeTab);
    if (editing) params.delete("edit");
    else params.set("edit", "1");
    router.push(
      `/${workspaceDomain}/dashboard/companies/${company.nanoid}?${params.toString()}`,
    );
  };

  const confirmArchive = () => {
    startTransition(async () => {
      const result = await archiveCompanyAction(company.nanoid, workspaceDomain);
      if (result.status === "success") {
        toast.push({
          variant: "success",
          message: result.message ?? "Company archived.",
        });
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not archive the company.",
        });
        setArchiveOpen(false);
      }
    });
  };

  const confirmUnarchive = () => {
    startTransition(async () => {
      const result = await unarchiveCompanyAction(
        company.nanoid,
        workspaceDomain,
      );
      if (result.status === "success") {
        toast.push({
          variant: "success",
          message: result.message ?? "Company restored.",
        });
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not restore the company.",
        });
      }
    });
  };

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

  const items = [
    {
      label: editing ? "Done editing" : "Edit record",
      icon: Pencil,
      onSelect: toggleEdit,
    },
    {
      label: "Add contact",
      icon: UserPlus,
      onSelect: () => setAddContactOpen(true),
    },
    company.archived
      ? {
          label: "Restore from archive",
          icon: RotateCcw,
          onSelect: confirmUnarchive,
        }
      : {
          label: "Archive company",
          icon: Archive,
          onSelect: () => setArchiveOpen(true),
        },
    {
      label: "Delete company",
      icon: Trash2,
      onSelect: () => setDeleteOpen(true),
      danger: true,
    },
  ];

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/40 bg-white/15 px-3 text-sm font-medium text-white transition-colors hover:bg-white/25"
        >
          Actions
          <MoreVertical className="size-3.5" aria-hidden="true" />
        </button>
        {open ? (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <div
              role="menu"
              className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg"
            >
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                  className={`flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                    item.danger ? "text-destructive" : ""
                  }`}
                >
                  <item.icon className="size-4" aria-hidden="true" />
                  {item.label}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>

      <AddContactDialog
        open={addContactOpen}
        onOpenChange={setAddContactOpen}
        workspaceDomain={workspaceDomain}
        companyNanoid={company.nanoid}
        companyName={company.name}
      />

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archive company?"
        description={`${company.name} and every record that belongs to it — contacts, observations, activities, leads and deals — will leave the working lists. Nothing is deleted, and you can restore it at any time.`}
        confirmLabel="Archive"
        confirming={pending}
        onConfirm={confirmArchive}
      />

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
    </>
  );
}
