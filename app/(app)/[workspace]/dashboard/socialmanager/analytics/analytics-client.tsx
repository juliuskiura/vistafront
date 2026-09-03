"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";

import type { ManagedChannel, MetricSnapshot } from "@/lib/api/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { syncAnalyticsAction, getAnalyticsSyncStatusAction } from "../actions";

const METRIC_LABELS: Record<string, string> = {
  impressions: "Impressions",
  reach: "Reach",
  likes: "Likes",
  comments: "Comments",
  shares: "Shares",
  saves: "Saves",
  follows: "New Follows",
  followers_count: "Followers",
  fan_count: "Fans",
  views: "Views",
  watch_time: "Watch Time",
};

interface SyncResult {
  created: number;
  updated: number;
  since: string;
  until: string;
  errors: { page: string; error: string }[];
}

interface Props {
  pages: ManagedChannel[];
  metrics: MetricSnapshot[];
  workspaceDomain: string;
}

export function AnalyticsClient({ pages, metrics, workspaceDomain }: Props) {
  const ws = workspaceDomain.toLowerCase();
  const router = useRouter();

  const [syncTaskId, setSyncTaskId] = useState<string | null>(null);
  const [isStartingSync, setIsStartingSync] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const syncing = isStartingSync || syncTaskId !== null;

  const handleSync = useCallback(async () => {
    setSyncResult(null);
    setIsStartingSync(true);
    try {
      const res = await syncAnalyticsAction({}, ws);
      if ("task_id" in res) setSyncTaskId(res.task_id);
    } finally {
      setIsStartingSync(false);
    }
  }, [ws]);

  useEffect(() => {
    if (!syncTaskId) return;
    const iv = setInterval(async () => {
      try {
        const status = await getAnalyticsSyncStatusAction(syncTaskId, ws);
        if (status.status === "SUCCESS" || status.status === "FAILURE") {
          if (status.result) setSyncResult(status.result);
          setSyncTaskId(null);
          clearInterval(iv);
          router.refresh();
        }
      } catch {
        /* ignore transient errors */
      }
    }, 2000);
    return () => clearInterval(iv);
  }, [syncTaskId, ws, router]);

  const pageByNanoid = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of pages) map[p.nanoid] = p.page_name;
    return map;
  }, [pages]);

  const totals = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const item of metrics) {
      acc[item.metric] = (acc[item.metric] || 0) + item.value;
    }
    return acc;
  }, [metrics]);

  const metricNames = Object.keys(totals).filter((m) => METRIC_LABELS[m]);

  const recent = useMemo(
    () =>
      [...metrics]
        .sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime())
        .slice(0, 20),
    [metrics],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Analytics</h2>
        <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing} className="gap-1.5">
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing…" : "Sync analytics"}
        </Button>
      </div>

      {syncResult && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>
              Sync complete — {syncResult.created} new data point{syncResult.created === 1 ? "" : "s"},{" "}
              {syncResult.updated} refreshed for {syncResult.since} → {syncResult.until}
              {syncResult.errors.length > 0 && `, ${syncResult.errors.length} page(s) failed`}.
            </span>
          </div>
          {syncResult.errors.map((err, i) => (
            <div key={i} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <span className="font-semibold">{err.page || "A channel"}</span> couldn't be read: {err.error}
            </div>
          ))}
        </div>
      )}

      {metrics.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <p>No analytics data available yet.</p>
          <p className="mt-1 text-xs">
            Analytics are collected nightly for every connected channel. Use <b>Sync analytics</b> to pull the last
            few days right now.
          </p>
        </Card>
      )}

      {metricNames.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metricNames.map((metric) => (
            <Card key={metric} className="p-4">
              <p className="text-xs text-muted-foreground">{METRIC_LABELS[metric]}</p>
              <p className="text-2xl font-semibold">{totals[metric].toLocaleString()}</p>
            </Card>
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-2">Recent Snapshots</h3>
          <div className="space-y-2">
            {recent.map((item: MetricSnapshot) => (
              <div
                key={item.nanoid}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{METRIC_LABELS[item.metric] || item.metric}</p>
                  <p className="text-xs text-muted-foreground">
                    {pageByNanoid[item.managed_page] || "Page"} · {item.period}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  <p className="text-sm font-semibold text-slate-900">{item.value.toLocaleString()}</p>
                  <p>{new Date(item.end_time).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}