import Link from "next/link";

import { listDeals, listPipelines, type Deal, type Pipeline } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Card } from "@/components/ui/card";

/**
 * Pipeline Kanban (Server Component).
 *
 * Read-only board: each pipeline column shows the deals in each of its
 * stages. No drag-and-drop yet — that needs `useOptimistic` plus a
 * `moveDeal` Server Action, which is a follow-up.
 *
 * If no pipeline exists yet, an empty-state prompts the user to create
 * one (no UI for that yet, so just link back to the CRM).
 */
export default async function PipelinePage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{ pipeline?: string }>;
}) {
  const { workspace: slug } = await params;
  const { pipeline: selectedNanoid } = await searchParams;
  const active = await requireWorkspace(slug);

  const [pipelines, deals] = await Promise.all([
    listPipelines(active.domain).catch(() => [] as Pipeline[]),
    listDeals({ workspace: active.domain }).catch(() => [] as Deal[]),
  ]);

  const active_pipeline: Pipeline | undefined =
    pipelines.find((p) => p.nanoid === selectedNanoid) ??
    pipelines.find((p) => p.is_default) ??
    pipelines[0];

  if (pipelines.length === 0) {
    return (
      <div className="max-w-3xl space-y-2">
        <h1 className="text-xl font-semibold">Pipeline</h1>
        <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          No pipelines yet. Create one from the CRM to track deals.
        </Card>
      </div>
    );
  }

  const stages = active_pipeline?.stages ?? [];
  const pipelineDeals = active_pipeline
    ? deals.filter((d) => d.pipeline === active_pipeline.nanoid)
    : deals;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Deals by stage across your sales pipelines.
          </p>
        </div>
        {pipelines.length > 1 ? (
          <form className="flex items-center gap-2" method="get">
            <label className="text-xs text-muted-foreground" htmlFor="pipeline">
              Pipeline
            </label>
            <select
              id="pipeline"
              name="pipeline"
              defaultValue={active_pipeline?.nanoid ?? ""}
              className="flex h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              {pipelines.map((p) => (
                <option key={p.nanoid} value={p.nanoid}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-lg border bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground"
            >
              Switch
            </button>
          </form>
        ) : null}
      </div>

      {active_pipeline ? (
        <p className="text-sm text-muted-foreground">
          Viewing <strong>{active_pipeline.name}</strong>
          {active_pipeline.description ? ` — ${active_pipeline.description}` : ""}
        </p>
      ) : null}

      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.length === 0 ? (
          <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            This pipeline has no stages configured.
          </Card>
        ) : (
          stages.map((stage) => {
            const stageDeals = pipelineDeals.filter((d) => d.stage === stage);
            const total = stageDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
            return (
              <div
                key={stage}
                className="flex w-72 shrink-0 flex-col gap-2 rounded-xl border bg-card p-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{stage}</h3>
                  <span className="text-xs text-muted-foreground">
                    {stageDeals.length}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {total > 0 ? formatCurrency(total) : "No value yet"}
                </p>
                <div className="space-y-2">
                  {stageDeals.length === 0 ? (
                    <p className="rounded-lg border border-dashed py-4 text-center text-xs text-muted-foreground">
                      Empty
                    </p>
                  ) : (
                    stageDeals.map((d) => (
                      <DealCard
                        key={d.nanoid}
                        deal={d}
                        workspaceDomain={active.domain}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function DealCard({
  deal,
  workspaceDomain,
}: {
  deal: Deal;
  workspaceDomain: string;
}) {
  return (
    <Link
      href={`/${workspaceDomain}/dashboard/pipeline/${deal.nanoid}`}
      className="block rounded-lg border bg-background p-2 text-sm transition-colors hover:bg-muted"
    >
      <p className="truncate font-medium">{deal.title}</p>
      {deal.company_name ? (
        <p className="truncate text-xs text-muted-foreground">
          {deal.company_name}
        </p>
      ) : null}
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{deal.status}</span>
        <span className="font-semibold">
          {deal.value > 0 ? formatCurrency(deal.value) : "—"}
        </span>
      </div>
    </Link>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}