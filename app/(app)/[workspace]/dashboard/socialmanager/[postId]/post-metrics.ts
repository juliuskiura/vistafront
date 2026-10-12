import type { MetricSnapshot, ScheduledPost } from "@/lib/api/types";
import { listMetrics } from "@/lib/api";

/** How many channels' metrics this page will ask for.
 *
 *  A ceiling on request count, not on correctness: snapshots are per-page daily
 *  rows, so three channels is at most three arrays to sum. The channels past the
 *  ceiling are still named in the label as *not* counted — a claim about a number
 *  has to be specific about whose number it is. */
const MAX_METRIC_CHANNELS = 3;

export interface PostMetricsResult {
  /** Daily snapshots for the channels covered, flattened. */
  snapshots: MetricSnapshot[];
  /** Channel nanoids the snapshots belong to, in request order. */
  channelNanoids: string[];
  /** Channels of this post that were left out, due to the ceiling above. */
  omittedChannels: number;
}

/**
 * The metrics a post can honestly claim, which is page-level, not post-level.
 *
 * `MetricSnapshot` is keyed to a channel, not to a post — so the only truthful
 * "this post's numbers" are the snapshots of the channels it was delivered to.
 * Asking without `managed_page` returns every snapshot in the workspace, which
 * is what used to show a whole week of the whole account under one post's
 * heading.
 *
 * A post with no recipients gets an empty result rather than a fallback to the
 * workspace: no chart is better than a chart that is wrong, and a post with
 * nothing delivered has nothing measured.
 */
export async function loadPostMetrics(
  post: ScheduledPost,
  workspace: string,
): Promise<PostMetricsResult> {
  const channels: string[] = [];
  for (const recipient of post.recipients) {
    if (recipient.managed_page && !channels.includes(recipient.managed_page)) {
      channels.push(recipient.managed_page);
    }
  }

  if (channels.length === 0) {
    return { snapshots: [], channelNanoids: [], omittedChannels: 0 };
  }

  const covered = channels.slice(0, MAX_METRIC_CHANNELS);

  const perChannel = await Promise.all(
    covered.map((managedPage) =>
      listMetrics({
        since: undefined,
        until: undefined,
        workspace,
        managed_page: managedPage,
        metric: undefined,
      }).catch(() => [] as MetricSnapshot[]),
    ),
  );

  return {
    snapshots: perChannel.flat(),
    channelNanoids: covered,
    omittedChannels: channels.length - covered.length,
  };
}
