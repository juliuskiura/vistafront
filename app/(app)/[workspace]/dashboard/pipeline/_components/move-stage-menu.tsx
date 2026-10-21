"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "@/lib/icons";
import type { PipelineStage } from "@/lib/api";
import { useToast } from "@/lib/context";
import { moveDealAction } from "@/app/(app)/[workspace]/dashboard/pipeline/deal-actions";

interface Props {
  dealNanoid: string;
  dealTitle: string;
  currentStage: string;
  stages: PipelineStage[];
  workspaceDomain: string;
  /** Called after a successful move, so the board can refresh. */
  onMoved?: (stage: string) => void;
}

/**
 * The "Move to stage" menu.
 *
 * This is the accessible path for moving a deal — it works with the
 * keyboard, and it works without JavaScript's drag-and-drop. The
 * drag-and-drop is layered on top of it, not instead of it.
 */
export function MoveStageMenu({
  dealNanoid,
  dealTitle,
  currentStage,
  stages,
  workspaceDomain,
  onMoved,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const move = (stage: string) => {
    if (stage === currentStage) return;
    startTransition(async () => {
      const result = await moveDealAction({
        workspaceDomain,
        nanoid: dealNanoid,
        stage,
      });
      if (result.status === "success") {
        toast.push({ variant: "success", message: `Moved to ${stage}.` });
        onMoved?.(stage);
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not move the deal.",
        });
      }
    });
  };

  const others = stages.filter((s) => s.name !== currentStage);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending || others.length === 0}
          aria-label={`Move ${dealTitle} to another stage`}
        >
          Move
          <ChevronDown className="ml-1 size-3.5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Move to stage</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {others.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">
            This pipeline has no other stages.
          </p>
        ) : (
          others.map((s) => (
            <DropdownMenuItem
              key={s.nanoid}
              onSelect={() => move(s.name)}
            >
              {s.name}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
