"use client";

import { useEffect, useState } from "react";
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
import { updateAccountEmailAction } from "../../actions";

interface AccountEmailDialogProps {
  /** The owning account's nanoid (the email is stored on the account, not the channel). */
  accountNanoid: string;
  workspaceDomain: string;
  /**
   * Display name of the platform whose sign-in dialog the user went through
   * (the channel's `auth_dialog`) — the one that declined to share an email,
   * e.g. "Facebook" for an Instagram-via-Facebook connection.
   */
  dialogName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountEmailDialog({
  accountNanoid,
  workspaceDomain,
  dialogName,
  open,
  onOpenChange,
}: AccountEmailDialogProps) {
  const ws = workspaceDomain.toLowerCase();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset each time the dialog opens so a previous error/value never lingers.
  useEffect(() => {
    if (open) {
      setEmail("");
      setError(null);
      setSaving(false);
    }
  }, [open]);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const result = await updateAccountEmailAction(accountNanoid, email.trim(), ws);
      if (result.status === "error") {
        setError(result.message ?? "Enter a valid email address.");
        return;
      }
      onOpenChange(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Add account email</DialogTitle>
          <DialogDescription>
            {dialogName} didn&apos;t share an email for this account. Add it so
            your workspace can tell which account owns this connection, and so
            we can reach out if we notice any unusual activity on your
            connected pages or account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="account-email">Email address</Label>
          <Input
            id="account-email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSave();
              }
            }}
            aria-invalid={!!error}
          />
          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving…" : "Save email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
