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
import { UserPlus } from "@/lib/icons";
import { useToast } from "@/lib/context";
import type { Company } from "@/lib/api";
import { createContactAction } from "@/app/(app)/[workspace]/dashboard/contacts/actions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceDomain: string;
  companies: Company[];
  /** Pre-selects a company — used from a company record. */
  defaultCompany?: string;
}

/**
 * The "New contact" dialog.
 */
export function ContactForm({
  open,
  onOpenChange,
  workspaceDomain,
  companies,
  defaultCompany,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [company, setCompany] = useState(defaultCompany ?? "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");

  const submit = () => {
    startTransition(async () => {
      const result = await createContactAction({
        workspaceDomain,
        company,
        first_name: firstName,
        last_name: lastName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        position: position || undefined,
      });
      if (result.status === "success") {
        toast.push({ variant: "success", message: "Contact created." });
        onOpenChange(false);
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
        setPosition("");
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not create the contact.",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <UserPlus className="mr-2 inline-block size-4" />
            New contact
          </DialogTitle>
          <DialogDescription>
            A contact always belongs to one company.
          </DialogDescription>
        </DialogHeader>

        <form
          action={() => {
            submit();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="contact-company">Company *</Label>
            <select
              id="contact-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <option value="">Choose a company…</option>
              {companies.map((c) => (
                <option key={c.nanoid} value={c.nanoid}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-contact-first">First name *</Label>
              <Input
                id="new-contact-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-contact-last">Last name</Label>
              <Input
                id="new-contact-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-contact-email">Email</Label>
            <Input
              id="new-contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-contact-phone">Phone</Label>
              <Input
                id="new-contact-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-contact-position">Position</Label>
              <Input
                id="new-contact-position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
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
              disabled={pending || !company || !firstName.trim()}
            >
              {pending ? "Creating…" : "Create contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
