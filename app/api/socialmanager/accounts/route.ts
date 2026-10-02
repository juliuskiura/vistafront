import { listAccounts } from "@/lib/api";
import { apiErrorResponse } from "@/lib/api/route-errors";

/**
 * Client-component bridge used to *reconcile* a finished OAuth handshake.
 *
 * The popup normally reports its own outcome through `postMessage`, but that
 * channel can silently fail: the popup navigates through a third-party provider
 * before landing back on this app's origin, and any of a severed `window.opener`,
 * a `targetOrigin` that does not match the host the user is actually on, or a
 * message dropped in transit leaves the parent tab with no answer — even though
 * the backend completed the connect and wrote the account.
 *
 * So the modal asks this route what the backend actually holds. The response is
 * deliberately thin (`platform`, `updated_at`) because the only question asked
 * is "did anything change just now", never "give me the tokens".
 *
 * The workspace arrives as a query param because this route sits outside the
 * `[workspace]` segment and cannot read it from `params`.
 */
export async function GET(request: Request) {
  const workspace = new URL(request.url).searchParams.get("workspace") ?? "";
  if (!workspace) {
    return Response.json({ error: "Missing workspace" }, { status: 400 });
  }

  try {
    const accounts = await listAccounts(workspace);
    return Response.json(
      {
        accounts: accounts.map((account) => ({
          nanoid: account.nanoid,
          platform: account.platform,
          updated_at: account.updated_at || account.created_at,
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    // Never degrade to an empty list here: "no accounts" is exactly the signal
    // the caller reads as "the connect did not happen", so a dead session (or
    // any backend hiccup) must surface as an error instead of a silent false
    // negative that the modal would render as "we couldn't confirm".
    return await apiErrorResponse(error, { message: "Failed to load accounts." });
  }
}
