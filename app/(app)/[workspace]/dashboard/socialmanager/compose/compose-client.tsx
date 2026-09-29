"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type {
  Campaign,
  ChannelCapabilities,
  Hashtag,
  ManagedChannel,
  ScheduledPost,
  SocialMediaPlatform,
  Asset,
} from "@/lib/api/types";
import {
  createPostAction,
  updatePostAction,
  createCampaignAction,
  publishPostAction,
  verifyPageAction,
} from "../actions";
import {
  initialCampaignState,
  type CampaignActionState,
} from "../action-state";
import { usePlatformStyleResolver } from "@/components/platform-icon";
import { ComposeHeader } from "./ComposeHeader";
import { ComposeStep1 } from "./ComposeStep1";
import { ComposeStep2 } from "./ComposeStep2";
import { DevicePreview } from "./DevicePreview";
import { ComposeFooter } from "./ComposeFooter";
import { CampaignModal } from "./CampaignModal";
import { ToastNotifications } from "./ToastNotifications";
import AssetPicker from "@/components/media/asset-picker";

interface Props {
  pages: ManagedChannel[];
  campaigns: Campaign[];
  platforms: SocialMediaPlatform[];
  /** Per-channel publishing rules, fetched once on the server. Replaces the
   *  per-channel content-formats + constraints + media-specs fan-out the
   *  format picker used to do from a client effect. */
  capabilities: ChannelCapabilities[];
  hashtags: Hashtag[];
  workspaceDomain: string;
  editPost: ScheduledPost | null;
  /** ISO timestamp used when the post has no schedule of its own. Computed on
   *  the server because `Date.now()` is impure during a client render. */
  defaultScheduledAt: string;
}

export function ComposeClient({
  pages,
  campaigns: initialCampaigns,
  platforms,
  capabilities,
  hashtags,
  workspaceDomain,
  editPost,
  defaultScheduledAt,
}: Props) {
  const ws = workspaceDomain.toLowerCase();
  // The previewed slug is a connect door; its label is the brand's.
  const styleOf = usePlatformStyleResolver();
  const router = useRouter();
  const submittingRef = useRef(false);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>(() => {
    if (editPost) return editPost.recipients.map((r) => r.managed_page);
    return [];
  });
  const [content, setContent] = useState(editPost?.content ?? "");
  // Rehydrate the media the post already carries. Without this the tray renders
  // empty on an existing post, and saving sends no media — silently detaching a
  // reel's video while the format still says "reel".
  const [mediaUrls, setMediaUrls] = useState<string[]>(editPost?.media_urls ?? []);
  const [mediaAssetNanoids, setMediaAssetNanoids] = useState<string[]>(
    editPost?.media_asset_nanoids ?? [],
  );
  const [baseAssets, setBaseAssets] = useState<Asset[]>([]);
  const [pickerPage, setPickerPage] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(
    editPost?.scheduled_at ?? defaultScheduledAt,
  );
  const [publishNow, setPublishNow] = useState(
    editPost ? editPost.status === "draft" : true,
  );
  const [campaignId, setCampaignId] = useState<string | null>(
    editPost?.campaign ?? null,
  );
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [variants, setVariants] = useState<
    Record<string, { content: string; format: string; linkUrl: string; firstComment: string }>
  >(() => {
    if (!editPost) return {};
    const init: Record<string, { content: string; format: string; linkUrl: string; firstComment: string }> = {};
    for (const r of editPost.recipients) {
      init[r.managed_page] = {
        content: r.content ?? editPost.content,
        // Read the format the backend stored. This used to be hardcoded to
        // "post", which meant opening a saved reel and pressing save silently
        // converted it to a feed post — the video stayed attached, so nothing
        // looked wrong until it published.
        format: r.format_key || editPost.format || "post",
        linkUrl: r.link_url ?? "",
        firstComment: "",
      };
    }
    return init;
  });

  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDesc, setNewCampaignDesc] = useState("");
  const [campaignAction, setCampaignAction] = useState<CampaignActionState>(initialCampaignState);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [hashtagsByPage, setHashtagsByPage] = useState<Record<string, string[]>>(() => {
    if (!editPost) return {};
    const init: Record<string, string[]> = {};
    for (const r of editPost.recipients) {
      const tags: string[] = [];
      const page = pages.find((p) => p.nanoid === r.managed_page);
      if (page) {
        const words = (r.content ?? "").split(/\s+/);
        for (const w of words) {
          if (w.startsWith("#")) tags.push(w);
        }
      }
      if (tags.length) init[r.managed_page] = tags;
    }
    return init;
  });
  const [firstCommentByPage, setFirstCommentByPage] = useState<Record<string, string>>({});
  const [connectErrors, setConnectErrors] = useState<Record<string, string>>({});
  const [publishError, setPublishError] = useState("");

  const platformBySlug = useMemo(() => {
    const map: Record<string, SocialMediaPlatform> = {};
    for (const p of platforms) map[p.slug] = p;
    return map;
  }, [platforms]);

  /** The door a channel publishes through, keyed by channel nanoid.
   *
   * `ManagedChannel.door` is the channel's own platform row. Falling back to
   * `platform` keeps channels from a backend that has not deployed the field
   * yet, rather than rendering them with no slug at all. */
  const doorByPage = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of capabilities) {
      if (c.door) map[c.nanoid] = c.door;
    }
    for (const p of pages) {
      if (!map[p.nanoid] && p.platform) map[p.nanoid] = p.platform;
    }
    return map;
  }, [capabilities, pages]);

  const capabilitiesByPage = useMemo(() => {
    const map: Record<string, ChannelCapabilities> = {};
    for (const c of capabilities) map[c.nanoid] = c;
    return map;
  }, [capabilities]);

  const getPagePlatformSlug = useCallback(
    (page: ManagedChannel): string => doorByPage[page.nanoid] || page.platform || "",
    [doorByPage],
  );

  /** Open the picker for a channel, scoped to what its current format takes.
   *
   * An empty `pageNanoid` means the shared media tray in step 1, where no
   * format has been chosen yet — the picker then shows every type, which is the
   * only honest answer before one is picked. */
  const openPicker = useCallback((pageNanoid: string) => {
    setPickerPage(pageNanoid || null);
    setPickerOpen(true);
  }, []);

  const pickerAllowedTypes = useMemo(() => {
    if (!pickerPage) return [];
    const format = variants[pickerPage]?.format ?? "";
    const capability = capabilitiesByPage[pickerPage];
    const rules = capability?.formats.find((f) => f.format === format)?.media ?? [];
    if (!rules.length) return [];
    // Distinct because a format can accept both, and an empty list would
    // silently mean "no restriction" rather than "nothing fits".
    return [
      ...new Set(
        rules
          .map((m) => m.media_type)
          .filter((t) => Boolean(t) && t !== "text"),
      ),
    ];
  }, [pickerPage, variants, capabilitiesByPage]);

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

  const selectedSlugs = useMemo(
    () => [...new Set(selectedPages.map((p) => getPagePlatformSlug(p)).filter(Boolean))],
    [selectedPages, getPagePlatformSlug],
  );

  const getActiveContent = useCallback(
    (pageNanoid: string): string => {
      const v = variants[pageNanoid];
      return v?.content || content;
    },
    [variants, content],
  );

  const handleAttachRendition = useCallback((asset: { nanoid: string; original_file: string }) => {
    setMediaAssetNanoids((prev) => (prev.includes(asset.nanoid) ? prev : [...prev, asset.nanoid]));
    setMediaUrls((prev) => (prev.includes(asset.original_file) ? prev : [...prev, asset.original_file]));
    setBaseAssets((prev) =>
      prev.some((a) => a.nanoid === asset.nanoid)
        ? prev
        : [...prev, { ...(prev[0] ?? {}), ...asset } as Asset],
    );
  }, []);

  const buildFormData = useCallback(
    (opts: { status?: string; scheduled?: boolean } = {}) => {
      const recipients = selectedPages.map((page) => {
        const slug = getPagePlatformSlug(page);
        const v = variants[page.nanoid];
        const tags = hashtagsByPage[page.nanoid] ?? [];
        let recipientContent = v?.content || content;
        if (tags.length) {
          const tagLine = tags.join(" ");
          if (recipientContent && !recipientContent.includes(tagLine)) {
            recipientContent = `${recipientContent}\n\n${tagLine}`;
          } else if (!recipientContent) {
            recipientContent = tagLine;
          }
        }
        return {
          managed_page: page.nanoid,
          content: recipientContent || undefined,
          format: v?.format || "post",
          link_url: v?.linkUrl?.trim() || undefined,
        };
      });

      const firstComments: Record<string, string> = {};
      for (const page of selectedPages) {
        const fc = firstCommentByPage[page.nanoid];
        if (fc?.trim()) firstComments[page.nanoid] = fc.trim();
      }

      const formData = new FormData();
      formData.append("content", content);
      if (mediaUrls.length > 0) formData.append("media_urls", JSON.stringify(mediaUrls));
      if (mediaAssetNanoids.length > 0) formData.append("media_assets", JSON.stringify(mediaAssetNanoids));
      if (campaignId) formData.append("campaign", campaignId);

      if (opts.scheduled) formData.append("scheduled_at", scheduledAt);
      if (opts.status) formData.append("status", opts.status);

      if (recipients.length) formData.append("recipients_json", JSON.stringify(recipients));
      if (Object.keys(firstComments).length)
        formData.append("first_comments_json", JSON.stringify(firstComments));

      return formData;
    },
    [
      selectedPages,
      content,
      mediaUrls,
      mediaAssetNanoids,
      variants,
      hashtagsByPage,
      firstCommentByPage,
      campaignId,
      scheduledAt,
      getPagePlatformSlug,
    ],
  );

  const handleSubmit = useCallback(
    async (saveAsDraft = false) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setStatus("submitting");
      setErrorMsg("");
      setPublishError("");

      try {
        const isSchedule = !saveAsDraft && !publishNow;
        const shouldPublish = !saveAsDraft && publishNow;

        if (!saveAsDraft && Object.values(connectErrors).some((msg) => msg)) {
          const tokenIssues = selectedPages
            .filter((p) => connectErrors[p.nanoid])
            .map((p) => p.page_name);
          setPublishError(
            `Cannot ${isSchedule ? "schedule" : "publish"}: ${tokenIssues.join(", ")} ${tokenIssues.length === 1 ? "has" : "have"} a connection problem. Reconnect the account in Channels first.`,
          );
          setStatus("error");
          return;
        }

        const formData = buildFormData(
          saveAsDraft
            ? { status: "draft" }
            : isSchedule
              ? { status: "scheduled", scheduled: true }
              : {},
        );

        let result;
        let postNanoid: string | undefined;

        if (editPost) {
          postNanoid = editPost.nanoid;
          result = await updatePostAction(
            editPost.nanoid,
            {
              content,
              campaign: campaignId || undefined,
              scheduled_at: isSchedule ? scheduledAt || undefined : undefined,
              status: saveAsDraft ? "draft" : isSchedule ? "scheduled" : undefined,
              recipients: JSON.parse(formData.get("recipients_json") as string),
              first_comments: formData.has("first_comments_json")
                ? JSON.parse(formData.get("first_comments_json") as string)
                : undefined,
              media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
              media_assets: mediaAssetNanoids.length > 0 ? mediaAssetNanoids : undefined,
            },
            ws,
          );
        } else {
          result = await createPostAction({ status: "idle" }, formData, ws);
          if (result.status === "success" && "post" in result) {
            postNanoid = result.post.nanoid;
          }
        }

        if (result.status !== "success") {
          setStatus("error");
          setErrorMsg(result.message || "Failed to save post.");
          return;
        }

        if (shouldPublish && postNanoid) {
          const pub = await publishPostAction(postNanoid, ws);
          if (pub.status !== "success") {
            setStatus("error");
            setErrorMsg("Post saved but failed to publish.");
            return;
          }
        }

        setStatus("success");
        setTimeout(() => router.push(`/${ws}/dashboard/socialmanager`), 1500);
      } catch {
        setStatus("error");
        setErrorMsg("An unexpected error occurred.");
      } finally {
        submittingRef.current = false;
      }
    },
    [
      buildFormData,
      editPost,
      content,
      campaignId,
      publishNow,
      scheduledAt,
      mediaUrls,
      mediaAssetNanoids,
      connectErrors,
      selectedPages,
      ws,
      router,
    ],
  );

  const handleNext = useCallback(() => {
    if (!selectedPages.length || !content.trim()) return;
    const initial: typeof variants = {};
    for (const page of selectedPages) {
      initial[page.nanoid] = {
        content,
        format: "post",
        linkUrl: "",
        firstComment: "",
      };
    }
    setVariants(initial);
    setStep(2);
  }, [content, selectedPages, variants]);

  const handleCreateCampaign = useCallback(async () => {
    if (!newCampaignName.trim()) return;
    const fd = new FormData();
    fd.append("name", newCampaignName.trim());
    if (newCampaignDesc.trim()) fd.append("description", newCampaignDesc.trim());
    fd.append("is_active", "true");

    const result = await createCampaignAction(initialCampaignState, fd, ws);
    setCampaignAction(result);
    if (result.status === "success") {
      setCampaigns((prev) => [
        ...prev,
        { nanoid: "pending", name: newCampaignName.trim(), description: newCampaignDesc.trim(), id: "", is_active: true, created_at: "", updated_at: "" },
      ]);
      setCampaignModalOpen(false);
      setNewCampaignName("");
      setNewCampaignDesc("");
      setCampaignAction(initialCampaignState);
    }
  }, [newCampaignName, newCampaignDesc, ws]);

  const canProceed = selectedPages.length > 0 && content.trim().length > 0;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <ComposeHeader step={step} editPost={!!editPost} />

        <div className="grid grid-cols-1 overflow-y-auto lg:grid-cols-12">
          <div className="space-y-6 overflow-y-auto border-r border-slate-200 bg-white p-6 lg:col-span-7">
            {step === 1 && (
              <ComposeStep1
                pages={pages}
                platforms={platforms}
                hashtags={hashtags}
                workspaceDomain={ws}
                editPost={editPost}
                selectedPageIds={selectedPageIds}
                setSelectedPageIds={setSelectedPageIds}
                content={content}
                setContent={setContent}
                mediaUrls={mediaUrls}
                setMediaUrls={setMediaUrls}
                mediaAssetNanoids={mediaAssetNanoids}
                setMediaAssetNanoids={setMediaAssetNanoids}
                baseAssets={baseAssets}
                setBaseAssets={setBaseAssets}
                campaignId={campaignId}
                setCampaignId={setCampaignId}
                campaigns={campaigns}
                setCampaigns={setCampaigns}
                connectErrors={connectErrors}
                setConnectErrors={setConnectErrors}
                campaignModalOpen={campaignModalOpen}
                setCampaignModalOpen={setCampaignModalOpen}
                newCampaignName={newCampaignName}
                setNewCampaignName={setNewCampaignName}
                newCampaignDesc={newCampaignDesc}
                setNewCampaignDesc={setNewCampaignDesc}
                campaignAction={campaignAction}
                setCampaignAction={setCampaignAction}
                handleNext={handleNext}
                canProceed={canProceed}
                onOpenPicker={openPicker}
              />
            )}
            {step === 2 && (
              <ComposeStep2
                selectedPages={selectedPages}
                platforms={platforms}
                capabilitiesByPage={capabilitiesByPage}
                scheduledAt={scheduledAt}
                setScheduledAt={setScheduledAt}
                publishNow={publishNow}
                setPublishNow={setPublishNow}
                publishError={publishError}
                variants={variants}
                setVariants={setVariants}
                content={content}
                mediaUrls={mediaUrls}
                setMediaUrls={setMediaUrls}
                mediaAssetNanoids={mediaAssetNanoids}
                setMediaAssetNanoids={setMediaAssetNanoids}
                baseAssets={baseAssets}
                setBaseAssets={setBaseAssets}
                onOpenPicker={openPicker}
                hashtagsByPage={hashtagsByPage}
                setHashtagsByPage={setHashtagsByPage}
                firstCommentByPage={firstCommentByPage}
                setFirstCommentByPage={setFirstCommentByPage}
                getPagePlatformSlug={getPagePlatformSlug}
                platformBySlug={platformBySlug}
                getActiveContent={getActiveContent}
                handleAttachRendition={handleAttachRendition}
              />
            )}
          </div>

          <div className="flex flex-col items-center justify-start space-y-4 overflow-y-auto bg-slate-100 p-6 lg:col-span-5">
            <div className="flex w-full items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Live Device Preview ({selectedSlugs[0] ? styleOf(selectedSlugs[0]).label : "None"})
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                Preview Mode
              </span>
            </div>
            <DevicePreview
              selectedPages={selectedPages}
              selectedSlugs={selectedSlugs}
              content={content}
              variants={variants}
              hashtagsByPage={hashtagsByPage}
              mediaUrls={mediaUrls}
              getPagePlatformSlug={getPagePlatformSlug}
              getActiveContent={getActiveContent}
            />
          </div>
        </div>

        <ComposeFooter
          step={step}
          canProceed={canProceed}
          status={status}
          editPost={!!editPost}
          selectedSlugs={selectedSlugs}
          onBack={() => setStep(1)}
          onNext={handleNext}
          onSubmit={() => handleSubmit()}
          onDiscard={() => router.back()}
          onSaveDraft={() => handleSubmit(true)}
        />

        <CampaignModal
          isOpen={campaignModalOpen}
          onClose={() => setCampaignModalOpen(false)}
          onCreate={handleCreateCampaign}
          newCampaignName={newCampaignName}
          setNewCampaignName={setNewCampaignName}
          newCampaignDesc={newCampaignDesc}
          setNewCampaignDesc={setNewCampaignDesc}
          campaignAction={campaignAction}
          setCampaignAction={setCampaignAction}
        />

        <AssetPicker
          mode="multiple"
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelect={(assets) => {
            const incoming = Array.isArray(assets) ? assets : [assets];
            const urls = incoming.map((a) => a.original_file);
            const nanoids = incoming.map((a) => a.nanoid);
            setMediaUrls((prev) => [...prev, ...urls]);
            setMediaAssetNanoids((prev) => [...prev, ...nanoids]);
            setBaseAssets((prev) => [...prev, ...incoming]);
          }}
          title="Attach Media Assets"
          workspaceDomain={ws}
          platformSlug={pickerPage ? doorByPage[pickerPage] ?? null : null}
          allowedAssetTypes={pickerAllowedTypes}
        />

        <ToastNotifications
          status={status}
          errorMsg={errorMsg}
          editPost={!!editPost}
        />
      </div>
    </div>
  );
}