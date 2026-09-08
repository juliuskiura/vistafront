"use client";

import { PlatformGlyph, getPlatformStyle } from "@/components/platform-icon";
import type { ManagedChannel, SocialMediaPlatform } from "@/lib/api/types";

interface DevicePreviewProps {
  selectedPages: ManagedChannel[];
  selectedSlugs: string[];
  content: string;
  variants: Record<string, { content: string; format: string; linkUrl: string; firstComment: string }>;
  hashtagsByPage: Record<string, string[]>;
  mediaUrls: string[];
  getPagePlatformSlug: (page: ManagedChannel) => string;
  getActiveContent: (pageNanoid: string) => string;
}

export function DevicePreview({
  selectedPages,
  selectedSlugs,
  content,
  variants,
  hashtagsByPage,
  mediaUrls,
  getPagePlatformSlug,
  getActiveContent,
}: DevicePreviewProps) {
  const firstSlug = selectedSlugs[0];
  
  if (!firstSlug) {
    return (
      <div className="w-full max-w-[340px] rounded-[32px] border-4 border-slate-300 bg-white p-3 shadow-xl relative overflow-hidden mx-auto">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
          Select a platform to preview your post.
        </div>
      </div>
    );
  }

  const firstPage = selectedPages.find((p) => getPagePlatformSlug(p) === firstSlug);
  const pageName = firstPage?.page_name || getPlatformStyle(firstSlug).label;
  const previewContent = firstPage ? getActiveContent(firstPage.nanoid) : content;
  const tags = firstPage ? (hashtagsByPage[firstPage.nanoid] ?? []) : [];

  return (
    <div className="w-full max-w-[340px] rounded-[32px] border-4 border-slate-300 bg-white p-3 shadow-xl relative overflow-hidden mx-auto">
      <div className="mx-auto mb-3 h-4 w-24 rounded-b-xl bg-slate-200" />
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900">
        <div className="flex items-center gap-2">
          {firstPage?.profile_picture_url ? (
            <img
              src={firstPage.profile_picture_url}
              alt=""
              className="h-7 w-7 shrink-0 rounded-full object-cover bg-slate-100"
            />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 text-[10px] font-bold text-white">
              {pageName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold leading-none text-slate-900">{pageName}</p>
            <div className="flex items-center gap-1 text-[9px] text-slate-500">
              <PlatformGlyph platform={firstSlug} size="sm" />
              <span>{getPlatformStyle(firstSlug).label}</span>
            </div>
          </div>
        </div>
        {mediaUrls.length > 0 && (
          <div className="rounded-xl overflow-hidden aspect-square bg-slate-100 border border-slate-200">
            <img src={mediaUrls[0]} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <p className="text-[11px] leading-relaxed text-slate-800">{previewContent || "Your post preview..."}</p>
        {tags.length > 0 && (
          <p className="text-[10px] font-medium text-indigo-600">{tags.join(" ")}</p>
        )}
      </div>
    </div>
  );
}