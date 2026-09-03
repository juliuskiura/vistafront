import { requireWorkspace } from "@/lib/auth/server";
import { listPages, listCampaigns } from "@/lib/api";
import { BulkUploadClient } from "./bulk-upload-client";

/**
 * Bulk Upload (Server Component).
 * Fetches pages and campaigns for the bulk upload form.
 * The interactive upload flow is a Client Component.
 */
export default async function BulkUploadPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const [pages, campaigns] = await Promise.all([
    listPages({ workspace: ws }).catch(() => []),
    listCampaigns(ws).catch(() => []),
  ]);

  return (
    <BulkUploadClient pages={pages} campaigns={campaigns} workspaceDomain={ws} />
  );
}
