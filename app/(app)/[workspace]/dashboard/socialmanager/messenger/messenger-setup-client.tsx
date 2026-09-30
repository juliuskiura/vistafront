"use client";

import { useCallback, useState, useTransition } from "react";
import { MessageSquare } from "@/lib/icons";
import { Card } from "@/components/ui/card";
import { useConnectAccount } from "@/lib/context";
import type {
  ManagedChannel,
  MessengerHealth,
  ReconnectPageResult,
  SocialMediaPlatform,
} from "@/lib/api/types";

import { resubscribePageAction } from "./actions";
import { PageReadinessList } from "./_components/page-readiness-list";
import { ProblemWorkspaces } from "./_components/problem-workspaces";
import { SetupChecklist } from "./_components/setup-checklist";

interface Props {
  workspace: string;
  platform: SocialMediaPlatform | null;
  /** How many platform rows came back at all, to tell "no Facebook" from "no catalogue". */
  platformCount: number;
  pages: ManagedChannel[];
  /** Cross-tenant health. Only ever non-empty on the console workspace. */
  health: MessengerHealth;
}

/**
 * The Messenger setup panel.
 *
 * Owns exactly one piece of state: the last probe answer per page. That is the
 * whole reason this is a client component rather than a Server Component — the
 * probe is a mutation, and its answer is the thing the operator is here to read,
 * so it must survive the click without a revalidation wiping it back to
 * "Not checked".
 *
 * Everything else is rendered on the server and arrives as props: the platform
 * row (callback URL, App ID, scope list) and the connected pages. Neither
 * changes while this screen is open, so there is nothing to poll and no query
 * cache to keep in sync.
 */
export function MessengerSetupClient({
  workspace,
  platform,
  platformCount,
  pages,
  health,
}: Props) {
  const { open: openConnectAccount } = useConnectAccount();
  const [probes, setProbes] = useState<Record<string, ReconnectPageResult | null>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleResubscribe = useCallback(
    (nanoid: string) => {
      setPendingId(nanoid);
      setError(null);
      startTransition(async () => {
        const result = await resubscribePageAction({ nanoid, workspace });
        // A platform-level refusal arrives as a *successful* result whose probe
        // says why — that is the useful case, and it must be stored so the row
        // can say "not registered" rather than silently doing nothing. Only a
        // failure to reach our own server is an error.
        if (result.status === "success") {
          setProbes((prev) => ({ ...prev, [nanoid]: result.probe }));
        } else {
          setError(result.message);
          setProbes((prev) => ({ ...prev, [nanoid]: null }));
        }
        setPendingId(null);
      });
    },
    [workspace],
  );

  const handleReauthorize = useCallback(
    () =>
      openConnectAccount({
        preselectedPlatform: "facebook",
        rerequest: true,
      }),
    [openConnectAccount],
  );

  return (
    <div className="space-y-6">
      <SetupChecklist platform={platform} />

      {platformCount === 0 && (
        <Card className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-bold text-amber-900">
            The platform catalogue came back empty
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-800">
            No social platforms are configured for this workspace, so there is no
            Meta App to register a callback URL against. Configure Facebook in
            Platform configuration first.
          </p>
        </Card>
      )}

      <PageReadinessList
        pages={pages}
        probes={probes}
        pendingId={pendingId}
        onResubscribe={handleResubscribe}
        onReauthorize={handleReauthorize}
      />

      <ProblemWorkspaces health={health} />

      {error && (
        <Card className="rounded-3xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs leading-relaxed text-red-800">{error}</p>
        </Card>
      )}

      <Card className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
            <MessageSquare className="size-3.5" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">
              Still nothing after all four?
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Then Meta is not calling us at all, and the two log lines that
              distinguish the remaining causes are both written by the webhook
              receiver. An <span className="font-mono">invalid X-Hub-Signature-256</span>{" "}
              rejection means the App ID above is not the App that holds the
              callback URL. Complete silence in the log means the callback URL was
              saved on a different Meta App, or the address in lock 1 is no longer
              reachable.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
