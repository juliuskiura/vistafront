import type { MetricSnapshot } from "@/lib/api/types";
import { Card } from "@/components/ui/card";
import { formatMediumDate } from "@/lib/dates";

/** Mini inline SVG area chart — no extra dependency. */
function SparkAreaChart({ data }: { data: number[] }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const width = 600;
  const height = 160;
  const padding = 24;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  const step = chartW / (data.length - 1 || 1);

  const points = data
    .map((v, i) => {
      const x = padding + i * step;
      const y = padding + chartH - (v / max) * chartH;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPath = `M${padding},${padding + chartH} L${points.split(" ").join(" L")} L${padding + chartW},${padding + chartH} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="size-full w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.25} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGrad)" className="text-primary-500" />
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        points={points}
        className="text-primary-600"
      />
      {data.map((v, i) => {
        const x = padding + i * step;
        const y = padding + chartH - (v / max) * chartH;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={3}
            className="fill-white stroke-primary-600 stroke-2"
          />
        );
      })}
    </svg>
  );
}

/** Impressions-over-time chart, scoped to the channels this post reached. */
export function MetricChart({
  metrics,
  channelNames,
  omittedChannels,
}: {
  metrics: MetricSnapshot[];
  channelNames: string[];
  omittedChannels: number;
}) {
  const impressions = metrics
    .filter((m) => m.metric.toLowerCase().includes("impression"))
    .sort((a, b) => new Date(a.end_time).getTime() - new Date(b.end_time).getTime());

  const values = impressions.map((m) => m.value);
  const scope = [
    channelNames.join(", "),
    omittedChannels > 0 ? `${omittedChannels} more` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  if (!impressions.length) {
    return (
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-neutral-900">
          Impressions over time
        </h3>
        <p className="mt-0.5 text-xs text-neutral-500">
          Channel{channelNames.length === 1 ? "" : "s"}: {scope}
        </p>
        <div className="mt-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
          No impressions reported for these channels yet.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">
          Impressions over time
        </h3>
        <span className="text-xs text-neutral-500">
          {values.length} point{values.length === 1 ? "" : "s"}
        </span>
      </div>
      <p className="mb-3 text-xs text-neutral-500">
        Impressions across {scope} — page-level daily reports, not per-post
        figures.
      </p>
      <div className="relative h-40 w-full">
        <SparkAreaChart data={values} />
      </div>
    </Card>
  );
}
