"use client";

import { useState, useTransition } from "react";
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
import { useToast } from "@/lib/context";
import type { Company, Contact, PipelineStage } from "@/lib/api";
import { createDealAction } from "@/app/(app)/[workspace]/dashboard/pipeline/deal-actions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceDomain: string;
  pipelineNanoid: string;
  stages: PipelineStage[];
  companies: Company[];
  contacts: Contact[];
  /** The stage the new deal starts in. */
  defaultStage?: string;
}

/**
 * The "New deal" dialog.
 *
 * The stage is fixed to the column the dialog was opened from, but it can
 * be changed — a deal that starts in the wrong column is a mistake the
 * user should be able to correct without closing the dialog.
 */
export function DealForm({
  open,
  onOpenChange,
  workspaceDomain,
  pipelineNanoid,
  stages,
  companies,
  contacts,
  defaultStage,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState(defaultStage ?? stages[0]?.name ?? "");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [closeDate, setCloseDate] = useState("");

  const submit = () => {
    startTransition(async () => {
      const result = await createDealAction({
        workspaceDomain,
        title,
        value: value ? Number(value) : undefined,
        pipeline: pipelineNanoid,
        stage,
        company: company || undefined,
        contact: contact || undefined,
        expected_close_date: closeDate || undefined,
      });
      if (result.status === "success") {
        toast.push({ variant: "success", message: "Deal created." });
        onOpenChange(false);
        setTitle("");
        setValue("");
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not create the deal.",
        });
      }
    });
  };

  // The contact list is filtered by the chosen company so the pairing
  // makes sense.
  const companyContacts = company
    ? contacts.filter((c) => c.company === company)
    : contacts;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New deal</DialogTitle>
          <DialogDescription>
            Add a deal to this pipeline.
          </DialogDescription>
        </DialogHeader>

        <form
          action={() => {
            submit();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="deal-title">Title *</Label>
            <Input
              id="deal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="deal-value">Value</Label>
              <Input
                id="deal-value"
                type="number"
                min={0}
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deal-stage">Stage *</Label>
              <select
                id="deal-stage"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                {stages.map((s) => (
                  <option key={s.nanoid} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deal-company">Company</Label>
            <select
              id="deal-company"
              value={company}
              onChange={(e) => {
                setCompany(e.target.value);
                setContact("");
              }}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <option value="">—</option>
              {companies.map((c) => (
                <option key={c.nanoid} value={c.nanoid}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deal-contact">Contact</Label>
            <select
              id="deal-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <option value="">—</option>
              {companyContacts.map((c) => (
                <option key={c.nanoid} value={c.nanoid}>
                  {`${c.first_name} ${c.last_name}`.trim() || c.email}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deal-close">Expected close</Label>
            <Input
              id="deal-close"
              type="date"
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || !title.trim() || !stage}
            >
              {pending ? "Creating…" : "Create deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
