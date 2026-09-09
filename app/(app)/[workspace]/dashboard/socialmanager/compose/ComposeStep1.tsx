"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, Layers, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ManagedChannel, SocialMediaPlatform, Hashtag, Asset, Campaign } from "@/lib/api/types";
import { verifyPageAction } from "../actions";
import SocialMediaTextEditor from "@/components/socialmanager/social-media-text-editor";
import { PlatformGlyph, getPlatformStyle } from "@/components/platform-icon";

interface ComposeStep1Props {
  pages: ManagedChannel[];
  accounts: { nanoid: string; platform: string; managed_pages?: ManagedChannel[] }[];
  platforms: SocialMediaPlatform[];
  hashtags: Hashtag[];
  workspaceDomain: string;
  editPost: any;
  selectedPageIds: string[];
  setSelectedPageIds: React.Dispatch<React.SetStateAction<string[]>>;
  content: string;
  setContent: React.Dispatch<React.SetStateAction<string>>;
  mediaUrls: string[];
  setMediaUrls: React.Dispatch<React.SetStateAction<string[]>>;
  mediaAssetNanoids: string[];
  setMediaAssetNanoids: React.Dispatch<React.SetStateAction<string[]>>;
  baseAssets: Asset[];
  setBaseAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  campaignId: string | null;
  setCampaignId: React.Dispatch<React.SetStateAction<string | null>>;
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  connectErrors: Record<string, string>;
  setConnectErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  connectOpen: boolean;
  setConnectOpen: React.Dispatch<React.SetStateAction<boolean>>;
  campaignModalOpen: boolean;
  setCampaignModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  newCampaignName: string;
  setNewCampaignName: React.Dispatch<React.SetStateAction<string>>;
  newCampaignDesc: string;
  setNewCampaignDesc: React.Dispatch<React.SetStateAction<string>>;
  campaignAction: any;
  setCampaignAction: React.Dispatch<React.SetStateAction<any>>;
  handleNext: () => void;
  canProceed: boolean;
  setPickerSlug: React.Dispatch<React.SetStateAction<string | null>>;
  setPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ComposeStep1({
  pages,
  accounts,
  platforms,
  hashtags,
  workspaceDomain,
  editPost,
  selectedPageIds,
  setSelectedPageIds,
  content,
  setContent,
  mediaUrls,
  setMediaUrls,
  mediaAssetNanoids,
  setMediaAssetNanoids,
  baseAssets,
  setBaseAssets,
  campaignId,
  setCampaignId,
  campaigns,
  setCampaigns,
  connectErrors,
  setConnectErrors,
  connectOpen,
  setConnectOpen,
  campaignModalOpen,
  setCampaignModalOpen,
  newCampaignName,
  setNewCampaignName,
  newCampaignDesc,
  setNewCampaignDesc,
  campaignAction,
  setCampaignAction,
  handleNext,
  canProceed,
  setPickerSlug,
  setPickerOpen,
}: ComposeStep1Props) {
  const ws = workspaceDomain.toLowerCase();

  const pageToPlatformSlug = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of accounts) {
      if (a.platform) {
        for (const p of a.managed_pages ?? []) {
          map[p.nanoid] = a.platform;
        }
      }
    }
    return map;
  }, [accounts]);

  const getPagePlatformSlug = useCallback(
    (page: ManagedChannel): string => {
      if (page.platform) return page.platform;
      return pageToPlatformSlug[page.nanoid] || "";
    },
    [pageToPlatformSlug],
  );

  const activePages = useMemo(() => pages.filter((p) => p.is_active), [pages]);

  const pagesByPlatform = useMemo(() => {
    const grouped: Record<string, ManagedChannel[]> = {};
    for (const p of activePages) {
      const slug = getPagePlatformSlug(p);
      if (slug) (grouped[slug] ||= []).push(p);
    }
    return grouped;
  }, [activePages, getPagePlatformSlug]);

  const selectedPages = pages.filter((p) => selectedPageIds.includes(p.nanoid));

  const selectedCountBySlug = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const slug of Object.keys(pagesByPlatform)) {
      counts[slug] = pagesByPlatform[slug].filter((p) =>
        selectedPageIds.includes(p.nanoid),
      ).length;
    }
    return counts;
  }, [pagesByPlatform, selectedPageIds]);

  const togglePage = useCallback(
    (nanoid: string) => {
      setSelectedPageIds((prev) => {
        const isSelected = prev.includes(nanoid);
        if (isSelected) {
          setConnectErrors((ce) => {
            if (!(nanoid in ce)) return ce;
            const next = { ...ce };
            delete next[nanoid];
            return next;
          });
          return prev.filter((id) => id !== nanoid);
        }
        return [...prev, nanoid];
      });
    },
    [setSelectedPageIds, setConnectErrors],
  );

  const verifyAndFlag = useCallback(
    async (page: ManagedChannel) => {
      try {
        const res = await verifyPageAction(page.nanoid, ws);
        if (res.ok) {
          setConnectErrors((prev) => {
            if (!(page.nanoid in prev)) return prev;
            const next = { ...prev };
            delete next[page.nanoid];
            return next;
          });
        } else {
          setConnectErrors((prev) => ({ ...prev, [page.nanoid]: res.error || "Cannot connect to the account" }));
        }
      } catch {
        setConnectErrors((prev) => ({ ...prev, [page.nanoid]: "Cannot verify the account connection" }));
      }
    },
    [ws, setConnectErrors],
  );

  const handleAddMedia = useCallback(() => {
    setPickerSlug(null);
    setPickerOpen(true);
  }, [setPickerSlug, setPickerOpen]);

  const handleRemoveMedia = useCallback((i: number) => {
    setMediaUrls((prev) => prev.filter((_, idx) => idx !== i));
    setMediaAssetNanoids((prev) => prev.filter((_, idx) => idx !== i));
    setBaseAssets((prev) => prev.filter((_, idx) => idx !== i));
  }, [setMediaUrls, setMediaAssetNanoids, setBaseAssets]);

  const handleAttachRendition = useCallback((asset: { nanoid: string; original_file: string }) => {
    setMediaAssetNanoids((prev) => (prev.includes(asset.nanoid) ? prev : [...prev, asset.nanoid]));
    setMediaUrls((prev) => (prev.includes(asset.original_file) ? prev : [...prev, asset.original_file]));
    setBaseAssets((prev) =>
      prev.some((a) => a.nanoid === asset.nanoid)
        ? prev
        : [...prev, { ...(prev[0] ?? {}), ...asset } as Asset],
    );
  }, [setMediaAssetNanoids, setMediaUrls, setBaseAssets]);

  const handleCreateCampaign = useCallback(async () => {
    if (!newCampaignName.trim()) return;
    const fd = new FormData();
    fd.append("name", newCampaignName.trim());
    if (newCampaignDesc.trim()) fd.append("description", newCampaignDesc.trim());
    fd.append("is_active", "true");

    const result = await (await import("../actions")).createCampaignAction(campaignAction, fd, ws);
    setCampaignAction(result);
    if (result.status === "success") {
      setCampaigns((prev) => [
        ...prev,
        { nanoid: "pending", name: newCampaignName.trim(), description: newCampaignDesc.trim(), id: "", is_active: true, created_at: "", updated_at: "" },
      ]);
      setCampaignModalOpen(false);
      setNewCampaignName("");
      setNewCampaignDesc("");
      setCampaignAction((await import("../action-state")).initialCampaignState);
    }
  }, [newCampaignName, newCampaignDesc, ws, setCampaignAction, setCampaigns, setCampaignModalOpen, setNewCampaignName, setNewCampaignDesc, campaignAction]);

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Where do you want to publish?
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConnectOpen(true)}
            className="!px-2 !py-1 !text-[11px] !rounded-lg gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Connect Channel
          </Button>
        </div>
        {Object.keys(pagesByPlatform).length === 0 && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            <span>No connected channels yet. Connect one to start cross-posting.</span>
          </div>
        )}
        <div className="space-y-3">
          {Object.entries(pagesByPlatform).map(([slug, slugPages]) => {
            const style = getPlatformStyle(slug);
            const selCount = selectedCountBySlug[slug] ?? 0;
            return (
              <div key={slug} className="overflow-hidden rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
                  <PlatformGlyph platform={slug} size="md" />
                  <span className="text-xs font-semibold text-slate-700">{style.label}</span>
                  <span className="ml-auto text-[10px] text-slate-400">
                    {selCount}/{slugPages.length}
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {slugPages.map((page) => {
                    const checked = selectedPageIds.includes(page.nanoid);
                    const pageError = connectErrors[page.nanoid];
                    return (
                      <div key={page.nanoid} className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => {
                            togglePage(page.nanoid);
                            if (!checked) {
                              void verifyAndFlag(page);
                            }
                          }}
                          className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 ${checked ? "bg-indigo-50/50" : ""}`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                              checked
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {checked && <CheckCircle2 className="h-3.5 w-3.5" />}
                          </span>
                          {page.profile_picture_url ? (
                            <img
                              src={page.profile_picture_url}
                              alt=""
                              className="h-7 w-7 shrink-0 rounded-full object-cover bg-slate-100"
                            />
                          ) : (
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 text-[10px] font-bold text-white">
                              {page.page_name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-slate-800">{page.page_name}</p>
                            {page.username && (
                              <p className="truncate text-[10px] text-slate-400">@{page.username}</p>
                            )}
                          </div>
                        </button>
                        {pageError && (
                          <div className="px-3 py-2 bg-amber-50 border-t border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span>{pageError}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Base Post Message
        </label>
        <SocialMediaTextEditor
          value={content}
          onChange={setContent}
          placeholder="Write master caption here... (This will be adapted per network below)"
          showCharCount={false}
          mediaUrls={mediaUrls}
          mediaAssets={baseAssets}
          onRemoveMedia={handleRemoveMedia}
          onAddMedia={handleAddMedia}
          minRows={4}
        />
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{content.length} characters</span>
          {selectedPages.length > 0 && (
            <span>Posting to {selectedPages.length} channel{selectedPages.length !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
          <Layers className="h-4 w-4 text-indigo-600" />
          Campaign (optional)
        </label>
        <div className="flex gap-2">
          <select
            value={campaignId ?? ""}
            onChange={(e) => setCampaignId(e.target.value || null)}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">No campaign</option>
            {campaigns.map((c) => (
              <option key={c.nanoid} value={c.nanoid}>{c.name}</option>
            ))}
          </select>
          <Button
            type="button"
            onClick={() => setCampaignModalOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        </div>
      </div>
    </>
  );
}