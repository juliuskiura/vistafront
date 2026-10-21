"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Check, GripVertical, X } from "@/lib/icons";
import type { Deal, PipelineStage } from "@/lib/api";
import { useToast } from "@/lib/context";
import { updateDealAction } from "@/app/(app)/[workspace]/dashboard/pipeline/deal-actions";
import { MoveStageMenu } from "./move-stage-menu";

interface Props {
  deal: Deal;
  stages: PipelineStage[];
  workspaceDomain: string;
}

/**
 * A deal card on the pipeline board.
 *
 * The card is draggable, but the drag is an *addition* to the controls,
 * not the only way to move a deal: the "Move" menu and the quick
 * win/lost buttons are both keyboard-operable.
 */
export function DealCard({ deal, stages, workspaceDomain }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.nanoid,
    data: { stage: deal.stage },
  });

  const setStatus = (status: "won" | "lost") => {
    startTransition(async () => {
      const result = await updateDealAction({
        workspaceDomain,
        nanoid: deal.nanoid,
        title: deal.title,
        status,
      });
      if (result.status === "success") {
        toast.push({
          variant: "success",
          message: status === "won" ? "Deal marked won." : "Deal marked lost.",
        });
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not update the deal.",
        });
      }
    });
  };

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border bg-background p-2 text-sm transition-shadow ${
        isDragging ? "opacity-60 shadow-lg" : ""
      }`}
    >
      <div className="flex items-start gap-1">
        <button
          type="button"
          {...listeners}
          {...attributes}
          aria-label={`Drag ${deal.title} to another stage`}
          className="mt-0.5 cursor-grab rounded p-0.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" aria-hidden="true" />
        </button>
        <Link
          href={`/${workspaceDomain}/dashboard/deals/${deal.nanoid}`}
          className="min-w-0 flex-1"
        >
          <p className="truncate font-medium hover:underline">{deal.title}</p>
          {deal.company_name ? (
            <p className="truncate text-xs text-muted-foreground">
              {deal.company_name}
            </p>
          ) : null}
        </Link>
      </div>

      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground capitalize">{deal.status}</span>
        <span className="font-semibold">
          {deal.value > 0 ? formatCurrency(deal.value) : "—"}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <MoveStageMenu
          dealNanoid={deal.nanoid}
          dealTitle={deal.title}
          currentStage={deal.stage}
          stages={stages}
          workspaceDomain={workspaceDomain}
        />
        {deal.status === "open" ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setStatus("won")}
              disabled={pending}
              aria-label={`Mark ${deal.title} as won`}
            >
              <Check className="size-3.5" aria-hidden="true" />
              Won
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setStatus("lost")}
              disabled={pending}
              aria-label={`Mark ${deal.title} as lost`}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="size-3.5" aria-hidden="true" />
              Lost
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
