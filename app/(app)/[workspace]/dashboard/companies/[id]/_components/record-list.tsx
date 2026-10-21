"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2 } from "@/lib/icons";

/**
 * The shared empty state for the record's data tabs.
 *
 * Every tab needs one, and they all read the same way — so there is one
 * component rather than six near-identical paragraphs.
 */
export function EmptyTab({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="rounded-xl border bg-card p-6 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}

/**
 * The delete button used by every tab's rows.
 *
 * Destructive actions always go through the shared `ConfirmDialog` — a
 * native `confirm()` is unstyled and blocks the event loop.
 */
export function DeleteRowButton({
  onDelete,
  label,
  pending,
}: {
  onDelete: () => void;
  label: string;
  pending?: boolean;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={onDelete}
      disabled={pending}
      aria-label={label}
      className="text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="size-4" aria-hidden="true" />
    </Button>
  );
}

/** A titled card wrapping a tab's list. */
export function TabCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="divide-y">{children}</div>
    </Card>
  );
}
