"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Check, ChevronRight } from "@/lib/icons";
import { PROSPECT_FLOW, PROSPECT_LABELS } from "@/lib/crm/constants";
import type { ProspectStatus } from "@/lib/api";
import { useToast } from "@/lib/context";
import { advanceCompanyAction } from "@/app/(app)/[workspace]/dashboard/companies/record-actions";

interface Props {
  status: ProspectStatus;
  workspaceDomain: string;
  companyNanoid: string;
}

/**
 * The prospecting flow ribbon.
 *
 * The seven stages of the flow, with the current one marked. "Advance
 * stage" moves the company one step forward — the backend owns the
 * transition, so the ribbon cannot drift from what the server considers
 * the next stage.
 */
export function ProspectFlow({ status, workspaceDomain, companyNanoid }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  // A lost company is off the flow entirely; so is a company that has
  // already reached the last stage.
  const currentIndex = PROSPECT_FLOW.indexOf(status);
  const isOffFlow = currentIndex === -1;
  const isLastStage = currentIndex === PROSPECT_FLOW.length - 1;

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
    <div className="space-y-3">
      <ol className="flex flex-wrap items-center gap-1" aria-label="Prospecting stages">
        {PROSPECT_FLOW.map((stage, index) => {
          const isDone = !isOffFlow && index < currentIndex;
          const isCurrent = stage === status;
          return (
            <li key={stage} className="flex items-center gap-1">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isDone
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? (
                  <Check className="size-3" aria-hidden="true" />
                ) : null}
                {PROSPECT_LABELS[stage]}
              </span>
              {index < PROSPECT_FLOW.length - 1 ? (
                <ChevronRight
                  className="size-3 text-muted-foreground"
                  aria-hidden="true"
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={advance}
          disabled={pending || isLastStage || isOffFlow}
        >
          {pending ? "Advancing…" : "Advance stage"}
        </Button>
        {isOffFlow ? (
          <p className="text-xs text-muted-foreground">
            This company is marked &ldquo;{PROSPECT_LABELS[status] ?? status}&rdquo;,
            which is off the prospecting flow.
          </p>
        ) : null}
        {isLastStage && !isOffFlow ? (
          <p className="text-xs text-muted-foreground">
            Already at the final stage.
          </p>
        ) : null}
      </div>
    </div>
  );
}
