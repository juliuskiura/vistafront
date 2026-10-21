import {
  listCompanies,
  listContacts,
  listDeals,
  listPipelines,
  type Company,
  type Contact,
  type Deal,
  type Pipeline,
} from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Banner } from "@/components/banner";
import { Card } from "@/components/ui/card";
import { PipelineBoard } from "@/app/(app)/[workspace]/dashboard/pipeline/pipeline-board";

/**
 * Pipeline Kanban (Server Component).
 *
 * Fetches the pipelines (each with its stages), the deals, and the
 * companies and contacts the deal form offers. The board itself is a
 * Client Component — it owns the drag-and-drop.
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

  const [pipelines, allDeals, companies, contacts] = await Promise.all([
    listPipelines(active.domain).catch(() => [] as Pipeline[]),
    listDeals({ workspace: active.domain }).catch(() => [] as Deal[]),
    listCompanies({ workspace: active.domain }).catch(() => [] as Company[]),
    listContacts({ workspace: active.domain }).catch(() => [] as Contact[]),
  ]);

  const activePipeline =
    pipelines.find((p) => p.nanoid === selectedNanoid) ??
    pipelines.find((p) => p.is_default) ??
    pipelines[0];

  if (!activePipeline) {
    return (
      <div className="flex min-h-full flex-col">
        <Banner
          title="Pipeline"
          description="Track the deals you are working, stage by stage."
        />
        <div className="mt-6 flex-1">
          <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No pipelines yet. Create one to start tracking deals.
          </Card>
        </div>
      </div>
    );
  }

  // The deal list endpoint's reduced serializer omits `pipeline`, so the
  // board's deals are matched by pipeline where the field is present and
  // fall back to showing everything otherwise.
  const deals = allDeals.filter(
    (d) => !d.pipeline || d.pipeline === activePipeline.nanoid,
  );

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="Pipeline"
        description="Track the deals you are working, stage by stage."
      />
      <div className="mt-6 flex-1">
        <PipelineBoard
          pipeline={activePipeline}
          pipelines={pipelines}
          deals={deals}
          companies={companies}
          contacts={contacts}
          workspaceDomain={active.domain}
        />
      </div>
    </div>
  );
}
