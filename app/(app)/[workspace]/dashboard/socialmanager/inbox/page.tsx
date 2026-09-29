import { Suspense } from "react";

import { Banner } from "@/components/banner";
import { LiveServerData } from "@/components/data/live-server-data";
import { listConversations } from "@/lib/api/inbox";
import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";

import { InboxClient } from "./inbox-client";
import { InboxSkeleton } from "./_components/inbox-skeleton";

/**
 * Social Inbox (Server Component).
 *
 * Renders the shared Banner, then defers everything below it to a Client
 * island. The island's thread-list query is prefetched here so the first
 * paint ships with real conversations rather than a spinner — the client picks
 * the same queryKey up from the dehydrated cache and takes over polling.
 *
 * Only the list is prefetched. The thread-detail query is deliberately not:
 * reading a thread clears its unread badge server-side, so it must only be
 * fetched when the user actually opens one.
 */
export default async function InboxPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  await requireFeature(active, "socialmanager.inbox");
  const ws = active.domain;

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="Inbox"
        description="Messages people send to your connected pages, with replies sent back from here."
      />

      <div className="mt-6 flex-1">
        <LiveServerData
          queryKey={["socialmanager-inbox", ws]}
          queryFn={() => listConversations({ workspace: ws })}
        >
          {/* The island reads `useSearchParams` to keep the open thread
              linkable, which opts this boundary into client rendering, so it
              needs a real fallback rather than null. */}
          <Suspense fallback={<InboxSkeleton />}>
            <InboxClient workspace={ws} />
          </Suspense>
        </LiveServerData>
      </div>
    </div>
  );
}
