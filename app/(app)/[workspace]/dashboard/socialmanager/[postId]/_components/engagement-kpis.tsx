import type { MetricSnapshot, PostComment, ScheduledPost } from "@/lib/api/types";
import { Heart, MessageCircle } from "@/lib/icons";

/** KPIs summarising a post's audience reach across its delivered channels. */
export function EngagementKPIs({
  post,
  comments,
  metrics,
}: {
  post: ScheduledPost;
  comments?: PostComment[];
  metrics: MetricSnapshot[];
}) {
  const reactions = post.reactions_count ?? 0;
  const commentCount = post.comment_count ?? comments?.length ?? 0;
  const shares = metrics
    .filter((m) => m.metric.toLowerCase().includes("share"))
    .reduce((s, m) => s + m.value, 0);
  const saves = metrics
    .filter((m) => m.metric.toLowerCase().includes("save"))
    .reduce((s, m) => s + m.value, 0);
  const clicks = metrics
    .filter((m) => m.metric.toLowerCase().includes("click"))
    .reduce((s, m) => s + m.value, 0);
  const impressions =
    metrics.find((m) => m.metric.toLowerCase().includes("impression"))?.value ?? 0;
  const reach =
    metrics.find((m) => m.metric.toLowerCase().includes("reach"))?.value ?? 0;
  const engagementRate =
    impressions > 0 ? ((reactions + commentCount + shares) / impressions) * 100 : 0;

  const kpis = [
    { label: "Impressions", value: impressions.toLocaleString() },
    { label: "Reach", value: reach.toLocaleString() },
    { label: "Reactions", value: reactions.toLocaleString(), icon: Heart },
    { label: "Comments", value: commentCount.toLocaleString(), icon: MessageCircle },
    { label: "Shares", value: shares.toLocaleString() },
    { label: "Saves", value: saves.toLocaleString() },
    { label: "Clicks", value: clicks.toLocaleString() },
    { label: "Engagement", value: `${engagementRate.toFixed(2)}%` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-xl border border-neutral-200 bg-white p-3"
        >
          <p className="text-xs text-neutral-500">{kpi.label}</p>
          <div className="mt-1 flex items-center gap-1.5">
            {kpi.icon && <kpi.icon className="size-3.5 text-neutral-400" />}
            <p className="text-lg font-semibold text-neutral-900">{kpi.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
