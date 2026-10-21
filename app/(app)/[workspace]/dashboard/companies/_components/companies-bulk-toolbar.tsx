"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface Props {
  selectedCount: number;
  selectedNanoids: string[];
  workspaceDomain: string;
  pending: boolean;
  onDelete: () => void;
  onClear: () => void;
}

/**
 * The bulk-action toolbar.
 *
 * "Edit" opens the company record with `?edit=1`, which is what puts the
 * record into edit mode — the same URL contract the legacy app used, and
 * the reason the button is a link rather than a mutation.
 */
export function CompaniesBulkToolbar({
  selectedCount,
  selectedNanoids,
  workspaceDomain,
  pending,
  onDelete,
  onClear,
}: Props) {
  const router = useRouter();
  const firstSelected = selectedNanoids[0];

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
      <span className="text-sm font-medium text-muted-foreground">
        {selectedCount} selected
      </span>
      <div className="ml-auto flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={selectedCount !== 1}
          onClick={() =>
            router.push(
              `/${workspaceDomain}/dashboard/companies/${firstSelected}`,
            )
          }
        >
          View
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={selectedCount !== 1}
          onClick={() =>
            router.push(
              `/${workspaceDomain}/dashboard/companies/${firstSelected}?tab=overview&edit=1`,
            )
          }
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onDelete}
          disabled={pending}
        >
          {pending ? "Deleting…" : "Delete"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
