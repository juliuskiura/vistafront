"use client";

import { useCallback } from "react";
import type { ManagedChannel, SocialMediaPlatform, Asset } from "@/lib/api/types";
import PlatformComposeCard from "@/components/socialmanager/platform-compose-card";
import { getPlatformStyle } from "@/components/platform-icon";

interface ComposeStep2Props {
  selectedPages: ManagedChannel[];
  platforms: SocialMediaPlatform[];
  workspaceDomain: string;
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
  platformByNanoid: Record<string, SocialMediaPlatform>;
  getActiveContent: (pageNanoid: string) => string;
  handleAttachRendition: (asset: { nanoid: string; original_file: string }) => void;
  setPickerSlug: React.Dispatch<React.SetStateAction<string | null>>;
  setPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ComposeStep2({
  selectedPages,
  platforms,
  workspaceDomain,
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
  platformByNanoid,
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

  return (
    <div className="space-y-4 pt-2">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
        Tailor Content per Platform
      </label>
      <div className="space-y-4">
        {selectedPages.map((page) => {
          const slug = getPagePlatformSlug(page);
          const platform = platformByNanoid[slug];
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