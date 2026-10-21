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
import { createContactAction } from "@/app/(app)/[workspace]/dashboard/companies/[id]/record-contact-actions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceDomain: string;
  companyNanoid: string;
  companyName: string;
}

/**
 * The "Add contact" dialog.
 *
 * The company is pre-filled and hidden — a contact always belongs to
 * exactly one company, and the user reached this dialog from that
 * company's record.
 */
export function AddContactDialog({
  open,
  onOpenChange,
  workspaceDomain,
  companyNanoid,
  companyName,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");

  const submit = () => {
    startTransition(async () => {
      const result = await createContactAction({
        workspaceDomain,
        company: companyNanoid,
        first_name: firstName,
        last_name: lastName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        position: position || undefined,
      });
      if (result.status === "success") {
        toast.push({ variant: "success", message: "Contact added." });
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
          message: result.message ?? "Could not add the contact.",
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
            Add contact
          </DialogTitle>
          <DialogDescription>
            A new contact at {companyName}.
          </DialogDescription>
        </DialogHeader>

        <form
          action={(formData) => {
            void formData;
            submit();
          }}
          className="space-y-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contact-first-name">First name *</Label>
              <Input
                id="contact-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-last-name">Last name</Label>
              <Input
                id="contact-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contact-phone">Phone</Label>
              <Input
                id="contact-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-position">Position</Label>
              <Input
                id="contact-position"
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
            <Button type="submit" disabled={pending || !firstName.trim()}>
              {pending ? "Adding…" : "Add contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
