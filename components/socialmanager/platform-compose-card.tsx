"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "lucide-react";
import { cn } from "@/lib/utils";
import SocialMediaTextEditor from "./social-media-text-editor";
import AiOptimizerSheet from "./ai-optimizer-sheet";
import ChannelEditorHeader from "./channel-editor-header";
import type { ManagedChannel, SocialMediaPlatform, Asset } from "@/lib/api/types";
import { getProviderConstraints, listContentFormats } from "@/lib/api/socialmanager";
import { Button } from "@/components/ui/button";

interface PlatformComposeCardProps {
  slug: string;
  platform: SocialMediaPlatform;
  channel: ManagedChannel;
  label: string;
  content: string;
  onContentChange: (value: string) => void;
  mediaUrls: string[];
  onAddMedia: () => void;
  onRemoveMedia: (index: number) => void;
  hashtags: string[];
  onAddHashtag: (tag: string) => void;
  onRemoveHashtag: (index: number) => void;
  format: string;
  onFormatChange: (format: string) => void;
  linkUrl: string;
  onLinkUrlChange: (value: string) => void;
  showLinkPost: boolean;
  firstComment: string;
  onFirstCommentChange: (value: string) => void;
  mediaAssets?: Asset[];
  platformSlug?: string;
  contentFormat?: string;
  onAttachRendition?: (asset: { nanoid: string; original_file: string }) => void;
  workspaceDomain: string;
}

export default function PlatformComposeCard({
  slug,
  platform,
  channel,
  label,
  content,
  onContentChange,
  mediaUrls,
  onAddMedia,
  onRemoveMedia,
  hashtags,
  onAddHashtag,
  onRemoveHashtag,
  format,
  onFormatChange,
  linkUrl,
  onLinkUrlChange,
  showLinkPost,
  firstComment,
  onFirstCommentChange,
  mediaAssets,
  platformSlug = slug,
  contentFormat,
  onAttachRendition,
  workspaceDomain,
}: PlatformComposeCardProps) {
  const [formats, setFormats] = useState<Array<{ format: string; display_name: string }>>([]);
  const [charLimit, setCharLimit] = useState<number | null>(null);
  const [aiCommentOpen, setAiCommentOpen] = useState(false);
  const onFormatChangeRef = useRef(onFormatChange);

  useEffect(() => {
    onFormatChangeRef.current = onFormatChange;
  }, [onFormatChange]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [fmt, constraints] = await Promise.all([
          listContentFormats({ platform: platform.nanoid, workspace: workspaceDomain }),
          getProviderConstraints(slug, workspaceDomain),
        ]);
        if (cancelled) return;
        const activeFormats = fmt.filter((f) => f.is_active);
        setFormats(activeFormats.map((f) => ({ format: f.format, display_name: f.display_name })));
        setCharLimit(constraints[0]?.character_limit ?? null);
        if (activeFormats.length > 0 && !activeFormats.some((f) => f.format === format)) {
          onFormatChangeRef.current(activeFormats[0].format);
        }
      } catch {
        // fallback to hardcoded formats
        setFormats([
          { format: "post", display_name: "Post" },
          { format: "image", display_name: "Image" },
          { format: "video", display_name: "Video" },
          { format: "link_post", display_name: "Link Post" },
        ]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [platform.nanoid, slug, format, workspaceDomain]);

  return (
    <div className="rounded-2xl border border-primary-300 bg-white p-6 space-y-4">
      <ChannelEditorHeader channel={channel} platform={platform} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
        {formats.map((f) => {
          const selected = f.format === format;
          return (
            <button
              key={f.format}
              type="button"
              onClick={() => onFormatChange(f.format)}
              className="flex items-center gap-2 text-xs font-medium text-slate-700"
            >
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded-full border transition-colors",
                  selected ? "border-emerald-500" : "border-slate-300",
                )}
              >
                {selected && <span className="size-2 rounded-full bg-emerald-500" />}
              </span>
              {f.display_name}
            </button>
          );
        })}
      </div>

      {showLinkPost && (
        <div className="space-y-1">
          <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
            <Link className="h-3 w-3 text-amber-600" />
            Link URL
          </label>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => onLinkUrlChange(e.target.value)}
            placeholder="https://yourbrand.com/article"
            className="w-full bg-white text-xs text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      )}

      <SocialMediaTextEditor
        bare
        value={content}
        onChange={onContentChange}
        placeholder={`Write the ${label} caption...`}
        charLimit={charLimit}
        hashtags={hashtags}
        onAddHashtag={onAddHashtag}
        onRemoveHashtag={onRemoveHashtag}
        hashtagCharLimit={charLimit}
        platform={label}
        minRows={3}
        mediaUrls={mediaUrls}
        onAddMedia={onAddMedia}
        onRemoveMedia={onRemoveMedia}
        mediaAssets={mediaAssets}
        platformSlug={platformSlug}
        contentFormat={contentFormat}
        onAttachRendition={onAttachRendition}
        platformOptimize={label}
        showLinkShortener
        firstComment={firstComment}
        onFirstCommentChange={onFirstCommentChange}
        onFirstCommentAi={() => setAiCommentOpen(true)}
      />

      <AiOptimizerSheet
        open={aiCommentOpen}
        onOpenChange={setAiCommentOpen}
        initialText={firstComment}
        platform={label}
        onInsert={(text) => {
          onFirstCommentChange(text);
          setAiCommentOpen(false);
        }}
      />
    </div>
  );
}
