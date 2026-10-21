"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/lib/context";
import { BOARD_STATUSES, PROSPECT_LABELS } from "@/lib/crm/constants";
import type { ProspectStatus } from "@/lib/api";
import { updateCompanyFieldAction } from "@/app/(app)/[workspace]/dashboard/companies/record-actions";

interface Props {
  status: ProspectStatus;
  workspaceDomain: string;
  companyNanoid: string;
}

/**
 * The status drop-down.
 *
 * The escape hatch for moving a company backwards, or straight to
 * `lost` — the flow ribbon only ever moves forward.
 */
export function StatusSelect({ status, workspaceDomain, companyNanoid }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const change = (next: ProspectStatus) => {
    if (next === status) return;
    startTransition(async () => {
      const result = await updateCompanyFieldAction({
        workspaceDomain,
        nanoid: companyNanoid,
        field: "status",
        value: next,
      });
      if (result.status === "success") {
        toast.push({
          variant: "success",
          message: `Moved to ${PROSPECT_LABELS[next]}.`,
        });
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not change the status.",
        });
      }
    });
  };

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Stage</span>
      <select
        value={status}
        onChange={(e) => change(e.target.value as ProspectStatus)}
        disabled={pending}
        aria-label="Change prospect stage"
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        {BOARD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {PROSPECT_LABELS[s]}
          </option>
        ))}
      </select>
    </label>
  );
}
