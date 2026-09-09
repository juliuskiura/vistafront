"use client";

import { useCallback } from "react";
import { CalendarIcon, AlertCircle } from "lucide-react";
import type { ManagedChannel, SocialMediaPlatform, Asset } from "@/lib/api/types";
import PlatformComposeCard from "@/components/socialmanager/platform-compose-card";
import { getPlatformStyle } from "@/components/platform-icon";

interface ComposeStep2Props {
  selectedPages: ManagedChannel[];
  platforms: SocialMediaPlatform[];
  workspaceDomain: string;
  scheduledAt: string;
  setScheduledAt: React.Dispatch<React.SetStateAction<string>>;
  publishNow: boolean;
  setPublishNow: React.Dispatch<React.SetStateAction<boolean>>;
  publishError: string;
  variants: Record<string, { content: string; format: string; linkUrl: string; firstComment: string }>;
  setVariants: React.Dispatch<React.SetStateAction<Record<string, { content: string; format: string; linkUrl: string; firstComment: string }>>>;
  content: string;
  mediaUrls: string[];
  setMediaUrls: React.Dispatch<React.SetStateAction<string[]>>;
  mediaAssetNanoids: string[];
  setMediaAssetNanoids: React.Dispatch<React.SetStateAction<string[]>>;
  baseAssets: Asset[];
  setBaseAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  hashtagsByPage: Record<string, string[]>;
  setHashtagsByPage: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  firstCommentByPage: Record<string, string>;
  setFirstCommentByPage: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  getPagePlatformSlug: (page: ManagedChannel) => string;
  platformBySlug: Record<string, SocialMediaPlatform>;
  getActiveContent: (pageNanoid: string) => string;
  handleAttachRendition: (asset: { nanoid: string; original_file: string }) => void;
  setPickerSlug: React.Dispatch<React.SetStateAction<string | null>>;
  setPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ComposeStep2({
  selectedPages,
  platforms,
  workspaceDomain,
  scheduledAt,
  setScheduledAt,
  publishNow,
  setPublishNow,
  publishError,
  variants,
  setVariants,
  content,
  mediaUrls,
  setMediaUrls,
  mediaAssetNanoids,
  setMediaAssetNanoids,
  baseAssets,
  setBaseAssets,
  hashtagsByPage,
  setHashtagsByPage,
  firstCommentByPage,
  setFirstCommentByPage,
  getPagePlatformSlug,
  platformBySlug,
  getActiveContent,
  handleAttachRendition,
  setPickerSlug,
  setPickerOpen,
}: ComposeStep2Props) {
  const ws = workspaceDomain.toLowerCase();

  const addHashtag = useCallback((pageNanoid: string, tag: string) => {
    const clean = tag.startsWith("#") ? tag : `#${tag}`;
    setHashtagsByPage((prev) => {
      const current = prev[pageNanoid] ?? [];
      if (current.includes(clean)) return prev;
      return { ...prev, [pageNanoid]: [...current, clean] };
    });
  }, [setHashtagsByPage]);

  const removeHashtag = useCallback((pageNanoid: string, idx: number) => {
    setHashtagsByPage((prev) => {
      const current = [...(prev[pageNanoid] ?? [])];
      current.splice(idx, 1);
      return { ...prev, [pageNanoid]: current };
    });
  }, [setHashtagsByPage]);

  const handleAddMedia = useCallback((slug: string) => {
    setPickerSlug(slug);
    setPickerOpen(true);
  }, [setPickerSlug, setPickerOpen]);

  const handleRemoveMedia = useCallback((i: number) => {
    setMediaUrls((prev) => prev.filter((_, idx) => idx !== i));
    setMediaAssetNanoids((prev) => prev.filter((_, idx) => idx !== i));
    setBaseAssets((prev) => prev.filter((_, idx) => idx !== i));
  }, [setMediaUrls, setMediaAssetNanoids, setBaseAssets]);

  const setDateTime = useCallback(
    (d?: Date, t?: string) => {
      const base = d ?? (scheduledAt ? new Date(scheduledAt) : undefined);
      if (!base) return;
      const [h, m] = (t ?? new Date().toTimeString().slice(0, 5)).split(":").map(Number);
      const next = new Date(base);
      next.setHours(h, m, 0, 0);
      setScheduledAt(next.toISOString());
    },
    [scheduledAt, setScheduledAt],
  );

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
          <CalendarIcon className="h-4 w-4 text-indigo-600" />
          Set Schedule
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPublishNow(true)}
            className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              publishNow
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Publish Now
          </button>
          <button
            type="button"
            onClick={() => setPublishNow(false)}
            className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              !publishNow
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Schedule for a Specific Date
          </button>
        </div>
        {!publishNow && (
          <div className="flex gap-2">
            <input
              type="date"
              value={scheduledAt ? new Date(scheduledAt).toISOString().split("T")[0] : ""}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : undefined;
                setDateTime(date);
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="time"
              value={scheduledAt ? new Date(scheduledAt).toTimeString().slice(0, 5) : ""}
              onChange={(e) => setDateTime(undefined, e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}
        {publishNow && (
          <p className="text-sm text-slate-500">
            Publish time: <span className="font-semibold text-slate-800">Now</span>
          </p>
        )}
        {publishError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{publishError}</span>
          </div>
        )}
      </div>

      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
        Tailor Content per Platform
      </label>
      <div className="space-y-4">
        {selectedPages.map((page) => {
          const slug = getPagePlatformSlug(page);
          const platform = platformBySlug[slug];
          if (!platform) return null;
          const v = variants[page.nanoid] ?? { content, format: "post", linkUrl: "", firstComment: "" };
          const tags = hashtagsByPage[page.nanoid] ?? [];
          const showLinkPost = slug === "facebook" && v.format === "link_post";

          return (
            <PlatformComposeCard
              key={page.nanoid}
              slug={slug}
              platform={platform}
              channel={page}
              label={getPlatformStyle(slug).label}
              content={getActiveContent(page.nanoid)}
              onContentChange={(text) => {
                setVariants((prev) => ({
                  ...prev,
                  [page.nanoid]: { ...v, content: text },
                }));
              }}
              mediaUrls={mediaUrls}
              onAddMedia={() => handleAddMedia(slug)}
              onRemoveMedia={handleRemoveMedia}
              hashtags={tags}
              onAddHashtag={(t) => addHashtag(page.nanoid, t)}
              onRemoveHashtag={(i) => removeHashtag(page.nanoid, i)}
              format={v.format}
              onFormatChange={(format) => {
                setVariants((prev) => ({
                  ...prev,
                  [page.nanoid]: { ...v, format },
                }));
              }}
              linkUrl={v.linkUrl}
              onLinkUrlChange={(linkUrl) => {
                setVariants((prev) => ({
                  ...prev,
                  [page.nanoid]: { ...v, linkUrl },
                }));
              }}
              showLinkPost={showLinkPost}
              firstComment={firstCommentByPage[page.nanoid] ?? ""}
              onFirstCommentChange={(val) => {
                setFirstCommentByPage((prev) => ({ ...prev, [page.nanoid]: val }));
              }}
              mediaAssets={baseAssets}
              platformSlug={slug}
              onAttachRendition={handleAttachRendition}
              workspaceDomain={ws}
            />
          );
        })}
      </div>
    </div>
  );
}