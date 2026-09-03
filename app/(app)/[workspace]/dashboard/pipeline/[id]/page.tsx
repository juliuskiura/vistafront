import { DealDetailView } from "@/app/(app)/[workspace]/dashboard/pipeline/deal-detail-view";

/**
 * Pipeline deal detail (Server Component).
 * Delegates to the shared `DealDetailView` so the same render path is
 * used for `/dashboard/pipeline/[id]` and `/dashboard/deals/[id]`.
 */
export default async function PipelineDealDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; id: string }>;
}) {
  const { workspace, id } = await params;
  return DealDetailView({ workspace, dealNanoid: id });
}