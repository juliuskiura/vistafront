"use client";

import { useState, useRef, useCallback } from "react";
import type { Campaign, ManagedChannel } from "@/lib/api/types";
import { createPostAction } from "../actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Send, Plus, Trash2 } from "lucide-react";

interface BulkPostRow {
  id: number;
  content: string;
  media_urls: string;
  scheduled_day: number;
}

interface Props {
  pages: ManagedChannel[];
  campaigns: Campaign[];
  workspaceDomain: string;
}

export function BulkUploadClient({ pages, campaigns, workspaceDomain }: Props) {
  const ws = workspaceDomain.toLowerCase();
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedPage, setSelectedPage] = useState("");
  const [intervalMinutes, setIntervalMinutes] = useState(1440);
  const [rows, setRows] = useState<BulkPostRow[]>([
    { id: 1, content: "", media_urls: "", scheduled_day: 1 },
  ]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const [error, setError] = useState("");
  const [lastImported, setLastImported] = useState<string | null>(null);

  const activePages = pages.filter((p) => p.is_active);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError("");
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        const lines = text.split("\n").filter((l) => l.trim());
        if (lines.length < 2) {
          setError("CSV must have a header row and at least one data row.");
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const contentIdx = headers.findIndex(
          (h) => h === "content" || h === "text",
        );
        const mediaIdx = headers.findIndex(
          (h) =>
            h === "media_url" || h === "media" || h === "media_urls",
        );
        const dayIdx = headers.findIndex(
          (h) =>
            h === "day" || h === "scheduled_day" || h === "position",
        );

        if (contentIdx === -1) {
          setError('CSV must have a "content" column.');
          return;
        }

        const parsed: BulkPostRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim());
          parsed.push({
            id: i,
            content: cols[contentIdx] || "",
            media_urls: mediaIdx >= 0 ? cols[mediaIdx] || "" : "",
            scheduled_day:
              dayIdx >= 0 ? Number(cols[dayIdx]) || 1 : i,
          });
        }

        setRows(parsed);
      };
      reader.readAsText(file);
    },
    [],
  );

  const handleImportAll = useCallback(async () => {
    if (!selectedPage) {
      setError("Select a recipient page first.");
      return;
    }
    setImporting(true);
    setError("");
    setImported(0);
    setLastImported(null);

    let count = 0;
    try {
      for (const row of rows) {
        if (!row.content.trim()) continue;
        const scheduledTime = new Date();
        scheduledTime.setDate(
          scheduledTime.getDate() + (row.scheduled_day - 1),
        );

        const formData = new FormData();
        formData.append("content", row.content);
        formData.append(
          "recipients_json",
          JSON.stringify([{ managed_page: selectedPage }]),
        );
        formData.append("scheduled_at", scheduledTime.toISOString());
        formData.append("status", "scheduled");
        if (row.media_urls) {
          const urls = row.media_urls
            .split(";")
            .map((u) => u.trim())
            .filter(Boolean);
          if (urls.length > 0) {
            formData.append("media_urls", JSON.stringify(urls));
          }
        }

        const result = await createPostAction({ status: "idle" }, formData, ws);
        if (result.status === "success") {
          count++;
          setImported(count);
        }
      }
      setLastImported(new Date().toLocaleTimeString());
      setRows([
        { id: Date.now(), content: "", media_urls: "", scheduled_day: 1 },
      ]);
    } catch {
      setError("Some posts failed to create. Check your inputs.");
    } finally {
      setImporting(false);
    }
  }, [rows, selectedPage, ws]);

  const updateRow = useCallback(
    (id: number, field: keyof BulkPostRow, value: string | number) => {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
      );
    },
    [],
  );

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        content: "",
        media_urls: "",
        scheduled_day: prev.length + 1,
      },
    ]);
  }, []);

  const removeRow = useCallback((id: number) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Bulk Upload</h2>
          <p className="mt-1 text-sm text-slate-500">
            Import multiple posts at once via CSV or manual entry.
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Recipient Page</Label>
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select a page...</option>
              {activePages.map((page) => (
                <option key={page.nanoid} value={page.nanoid}>
                  {page.page_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Interval between posts
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                value={intervalMinutes}
                onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                className="h-9 text-sm"
              />
              <span className="text-xs text-slate-500">minutes</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">CSV Import</Label>
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-9 gap-1.5 text-xs"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" /> Upload CSV
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}
        {lastImported && (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-600">
            Imported {imported} posts at {lastImported}
          </p>
        )}
      </Card>

      <Card className="border-amber-200 bg-amber-50 p-3">
        <p className="text-[11px] text-amber-800">
          <strong>CSV format:</strong>{" "}
          <code>content, media_url, scheduled_day</code>. One row per post.
          Separate multiple media URLs with semicolons.{" "}
          <code className="ml-2 text-[10px]">scheduled_day</code> is the day
          offset from today (1 = today, 2 = tomorrow, etc.).
        </p>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Posts ({rows.length})
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1 text-xs"
            onClick={addRow}
          >
            <Plus className="h-3 w-3" /> Add Row
          </Button>
        </div>

        {rows.map((row, idx) => (
          <Card key={row.id} className="p-3">
            <div className="flex items-start gap-3">
              <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                {idx + 1}
              </span>
              <div className="flex-1 space-y-2">
                <textarea
                  placeholder="Post content..."
                  value={row.content}
                  onChange={(e) => updateRow(row.id, "content", e.target.value)}
                  className="min-h-[60px] w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label className="text-[10px] text-slate-500">
                      Media URLs (semicolon-separated)
                    </Label>
                    <Input
                      placeholder="https://cdn.example.com/img1.jpg; https://cdn.example.com/img2.jpg"
                      value={row.media_urls}
                      onChange={(e) =>
                        updateRow(row.id, "media_urls", e.target.value)
                      }
                      className="mt-0.5 h-8 text-xs"
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-[10px] text-slate-500">Day</Label>
                    <Input
                      type="number"
                      min={1}
                      value={row.scheduled_day}
                      onChange={(e) =>
                        updateRow(
                          row.id,
                          "scheduled_day",
                          Number(e.target.value),
                        )
                      }
                      className="mt-0.5 h-8 text-xs"
                    />
                  </div>
                  <button
                    onClick={() => removeRow(row.id)}
                    className="mt-5 text-slate-400 transition-colors hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-xs text-slate-500">
          Posts are scheduled at intervals starting from today. Each post is
          sent to the selected page.
        </p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {imported > 0 && `${imported} imported so far`}
          </p>
          <Button
            onClick={handleImportAll}
            disabled={
              importing || !selectedPage || rows.every((r) => !r.content.trim())
            }
            className="gap-2"
          >
            {importing ? (
              "Importing..."
            ) : (
              <>
                <Send className="h-4 w-4" /> Upload &amp; Schedule{" "}
                {rows.length} Post{rows.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
