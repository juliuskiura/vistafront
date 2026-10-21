"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "@/lib/icons";
import type { Company, Contact, Deal, Pipeline, PipelineStage } from "@/lib/api";
import { useToast } from "@/lib/context";
import { moveDealAction } from "@/app/(app)/[workspace]/dashboard/pipeline/deal-actions";
import { DealCard } from "./_components/deal-card";
import { DealForm } from "./_components/deal-form";
import { PipelineForm } from "./_components/pipeline-form";

interface Props {
  pipeline: Pipeline;
  pipelines: Pipeline[];
  deals: Deal[];
  companies: Company[];
  contacts: Contact[];
  workspaceDomain: string;
}

/**
 * The pipeline board.
 *
 * Each pipeline stage is a column; each deal is a card. The board offers
 * two ways to move a deal: drag it (the mouse path) and the "Move" menu
 * on the card (the keyboard path). The menu is the source of truth — the
 * drag is layered on top, and a failed drag leaves the card where it
 * was.
 */
export function PipelineBoard({
  pipeline,
  pipelines,
  deals,
  companies,
  contacts,
  workspaceDomain,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [dealDialogOpen, setDealDialogOpen] = useState(false);
  const [pipelineDialogOpen, setPipelineDialogOpen] = useState(false);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [newDealStage, setNewDealStage] = useState<string | undefined>();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const stages = [...pipeline.stages].sort((a, b) => a.order - b.order);
  const pipelineDeals = deals.filter((d) => d.stage);

  const handleDragStart = (event: DragStartEvent) => {
    const deal = pipelineDeals.find((d) => d.nanoid === event.active.id);
    setActiveDeal(deal ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const deal = pipelineDeals.find((d) => d.nanoid === active.id);
    const targetStage = stages.find((s) => s.name === over.id);
    if (!deal || !targetStage) return;
    if (deal.stage === targetStage.name) return;

    const result = await moveDealAction({
      workspaceDomain,
      nanoid: deal.nanoid,
      stage: targetStage.name,
    });
    if (result.status === "success") {
      toast.push({
        variant: "success",
        message: `Moved to ${targetStage.name}.`,
      });
      router.refresh();
    } else {
      toast.push({
        variant: "error",
        message: result.message ?? "Could not move the deal.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {pipelines.length > 1 ? (
            <form method="get">
              <label
                className="sr-only"
                htmlFor="pipeline-switcher"
              >
                Pipeline
              </label>
              <select
                id="pipeline-switcher"
                name="pipeline"
                defaultValue={pipeline.nanoid}
                className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                {pipelines.map((p) => (
                  <option key={p.nanoid} value={p.nanoid}>
                    {p.name}
                  </option>
                ))}
              </select>
            </form>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setPipelineDialogOpen(true)}
          >
            New pipeline
          </Button>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setNewDealStage(undefined);
            setDealDialogOpen(true);
          }}
        >
          <Plus className="mr-1.5 size-4" aria-hidden="true" />
          New deal
        </Button>
      </div>

      {pipeline.description ? (
        <p className="text-sm text-muted-foreground">{pipeline.description}</p>
      ) : null}

      {stages.length === 0 ? (
        <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          This pipeline has no stages yet. Add one to start tracking deals.
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto pb-4">
            {stages.map((stage) => (
              <StageColumn
                key={stage.nanoid}
                stage={stage}
                deals={pipelineDeals.filter((d) => d.stage === stage.name)}
                stages={stages}
                workspaceDomain={workspaceDomain}
                onAddDeal={() => {
                  setNewDealStage(stage.name);
                  setDealDialogOpen(true);
                }}
              />
            ))}
          </div>
          <DragOverlay>
            {activeDeal ? (
              <div className="rounded-lg border bg-background p-2 text-sm shadow-lg">
                <p className="truncate font-medium">{activeDeal.title}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <DealForm
        open={dealDialogOpen}
        onOpenChange={setDealDialogOpen}
        workspaceDomain={workspaceDomain}
        pipelineNanoid={pipeline.nanoid}
        stages={stages}
        companies={companies}
        contacts={contacts}
        defaultStage={newDealStage}
      />

      <PipelineForm
        open={pipelineDialogOpen}
        onOpenChange={setPipelineDialogOpen}
        workspaceDomain={workspaceDomain}
      />
    </div>
  );
}

/** One column of the board. */
function StageColumn({
  stage,
  deals,
  stages,
  workspaceDomain,
  onAddDeal,
}: {
  stage: PipelineStage;
  deals: Deal[];
  stages: PipelineStage[];
  workspaceDomain: string;
  onAddDeal: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.name });
  const total = deals.reduce((sum, d) => sum + (d.value ?? 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col gap-2 rounded-xl border bg-card p-3 transition-colors ${
        isOver ? "border-primary bg-primary/5" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{stage.name}</h3>
        <span className="text-xs text-muted-foreground">{deals.length}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {total > 0 ? formatCurrency(total) : "No value yet"}
      </p>
      <div className="space-y-2">
        {deals.length === 0 ? (
          <p className="rounded-lg border border-dashed py-4 text-center text-xs text-muted-foreground">
            Empty
          </p>
        ) : (
          deals.map((d) => (
            <DealCard
              key={d.nanoid}
              deal={d}
              stages={stages}
              workspaceDomain={workspaceDomain}
            />
          ))
        )}
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onAddDeal}
        aria-label={`Add a deal to ${stage.name}`}
      >
        <Plus className="mr-1.5 size-4" aria-hidden="true" />
        Add deal
      </Button>
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
