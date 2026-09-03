import { DealDetailView } from "@/app/(app)/[workspace]/dashboard/pipeline/deal-detail-view";

/**
 * Alias route for `/dashboard/deals/[id]` → reuses the pipeline deal view.
 * Some inbound links in the old SPA point to this path directly.
 */
export default async function DealDetailAliasPage({
  params,
}: {
  params: Promise<{ workspace: string; id: string }>;
}) {
  const { workspace, id } = await params;
  return DealDetailView({ workspace, dealNanoid: id });
}