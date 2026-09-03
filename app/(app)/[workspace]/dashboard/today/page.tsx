import { requireWorkspace } from "@/lib/auth/server";
import { LiveServerData } from "@/components/data/live-server-data";
import { getTodaySummary } from "@/lib/api";
import { TodayBoard } from "./today-board";

/**
 * Today page (Server Component shell).
 *
 * The four-bucket "what needs my attention" summary. Backed by
 * `/apis/schedules/today/`. Every entry is a link into the workspace's
 * Projects / Deliverables detail page.
 *
 * Pattern: server prefetches via `<LiveServerData>` and dehydrates the
 * TanStack Query cache; the `<TodayBoard>` Client island picks the same
 * queryKey up via `useQuery` and refreshes every 60s while the tab is
 * open. First paint ships with real data; subsequent updates are
 * client-side. See AGENTS.md §5 for the full pattern.
 */
export default async function TodayPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const activeDomain = active.domain.toLowerCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Today</h1>
      </div>
      <LiveServerData
        queryKey={["today", activeDomain]}
        queryFn={() => getTodaySummary(activeDomain)}
      >
        <TodayBoard workspace={activeDomain} />
      </LiveServerData>
    </div>
  );
}