import "server-only";

import { serverFetch } from "./server-fetch";
import type { BillingProfile } from "./types";

export async function listBillingProfiles({ workspace }: { workspace: string }): Promise<BillingProfile[]> {
  return serverFetch<BillingProfile[]>("/apis/workspaces/billing-profiles/", { headers: { 'X-Workspace': workspace } });
}
