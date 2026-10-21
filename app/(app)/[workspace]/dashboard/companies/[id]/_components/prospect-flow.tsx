"use client";

import { Check, ChevronRight } from "@/lib/icons";
import { PROSPECT_FLOW, PROSPECT_LABELS } from "@/lib/crm/constants";
import type { ProspectStatus } from "@/lib/api";

interface Props {
  status: ProspectStatus;
}

/**
 * The prospecting flow ribbon.
 *
 * The seven stages of the flow, with the current one marked. Moving the
 * company forward is the "Advance stage" button in the header — the backend
 * owns the transition, so the ribbon cannot drift from what the server
 * considers the next stage.
 */
export function ProspectFlow({ status }: Props) {
  const currentIndex = PROSPECT_FLOW.indexOf(status);
  const isOffFlow = currentIndex === -1;
  const isLastStage = currentIndex === PROSPECT_FLOW.length - 1;

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
