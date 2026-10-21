"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ChevronRight } from "@/lib/icons";
import { PROSPECT_FLOW } from "@/lib/crm/constants";
import type { ProspectStatus } from "@/lib/api";
import { useToast } from "@/lib/context";
import { advanceCompanyAction } from "@/app/(app)/[workspace]/dashboard/companies/record-actions";

interface Props {
  status: ProspectStatus;
  workspaceDomain: string;
  companyNanoid: string;
}

/**
 * The "Advance stage" button.
 *
 * It sits in the CRM nav strip next to the section pills, so moving a
 * company one step along the prospecting flow is one click away from
 * anywhere on the record. The backend owns the transition — the button only
 * asks for it, and the server decides what "the next stage" is.
 */
export function AdvanceStageButton({
  status,
  workspaceDomain,
  companyNanoid,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  // A lost company is off the flow entirely; so is a company that has
  // already reached the last stage.
  const currentIndex = PROSPECT_FLOW.indexOf(status);
  const isOffFlow = currentIndex === -1;
  const isLastStage = currentIndex === PROSPECT_FLOW.length - 1;
  const disabled = pending || isLastStage || isOffFlow;

  const advance = () => {
    startTransition(async () => {
      const result = await advanceCompanyAction({
        workspaceDomain,
        nanoid: companyNanoid,
      });
      if (result.status === "success") {
        toast.push({
          variant: "success",
          message: result.message ?? "Advanced to the next stage.",
        });
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not advance the stage.",
        });
      }
    });
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={advance}
      disabled={disabled}
      title={
        isLastStage
          ? "Already at the final stage."
          : isOffFlow
            ? "This company is off the prospecting flow."
            : "Move the company one step along the prospecting flow."
      }
    >
      {pending ? "Advancing…" : "Advance stage"}
      <ChevronRight className="ml-1.5 size-3.5" aria-hidden="true" />
    </Button>
  );
}
