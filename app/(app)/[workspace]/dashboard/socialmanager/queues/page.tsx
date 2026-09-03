import { requireWorkspace } from "@/lib/auth/server";
import { listQueues, listQueueItems } from "@/lib/api";
import { QueueClient } from "./queue-client";

/**
 * Queue (Server Component).
 * Fetches all queues and their items.
 * Interactive queue management is in the Client Component.
 */
export default async function QueuePage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const queues = await listQueues(ws).catch(() => []);

  // Fetch items for each queue
  const queuesWithItems = await Promise.all(
    queues.map(async (queue) => {
      try {
        const items = await listQueueItems({ queue: queue.nanoid, workspace: ws });
        return { ...queue, items };
      } catch {
        return { ...queue, items: [] };
      }
    }),
  );

  return <QueueClient queues={queuesWithItems} workspaceDomain={ws} />;
}
