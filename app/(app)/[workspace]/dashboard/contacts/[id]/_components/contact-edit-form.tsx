"use client";

import { Button } from "@/components/ui/button";

interface Props {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  position: string;
  setPosition: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  status: "active" | "inactive" | "lead";
  setStatus: (v: "active" | "inactive" | "lead") => void;
  pending: boolean;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * The contact's editable fields.
 *
 * Split out of the record so the record itself stays readable and the
 * form can be reasoned about on its own.
 */
export function ContactEditForm(props: Props) {
  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    phone,
    setPhone,
    position,
    setPosition,
    notes,
    setNotes,
    status,
    setStatus,
    pending,
    onSave,
    onCancel,
  } = props;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldInput
          id="contact-first"
          label="First name"
          value={firstName}
          onChange={setFirstName}
        />
        <FieldInput
          id="contact-last"
          label="Last name"
          value={lastName}
          onChange={setLastName}
        />
        <FieldInput
          id="contact-email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
        />
        <FieldInput
          id="contact-phone"
          label="Phone"
          value={phone}
          onChange={setPhone}
        />
        <FieldInput
          id="contact-position"
          label="Position"
          value={position}
          onChange={setPosition}
        />
        <div className="space-y-1.5">
          <label
            htmlFor="contact-status"
            className="text-xs text-muted-foreground"
          >
            Status
          </label>
          <select
            id="contact-status"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "active" | "inactive" | "lead")
            }
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <option value="active">Active</option>
            <option value="lead">Lead</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <label
          htmlFor="contact-notes"
          className="text-xs text-muted-foreground"
        >
          Notes
        </label>
        <textarea
          id="contact-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={onSave} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function FieldInput({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
      />
    </div>
  );
}
