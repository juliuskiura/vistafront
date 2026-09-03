"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  Send,
  Save,
  Plus,
  Layers,
  CheckCircle2,
  AlertCircle,
  Zap,
} from "lucide-react";

import type {
  Campaign,
  Hashtag,
  ManagedChannel,
  ScheduledPost,
  SocialMediaPlatform,
} from "@/lib/api/types";
import {
  createPostAction,
  updatePostAction,
  createCampaignAction,
  initialCampaignState,
  type CampaignActionState,
} from "../actions";
import { PlatformGlyph, getPlatformStyle } from "@/components/platform-icon";
import { SocialIcon, hasSocialIcon } from "@/components/social-icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  pages: ManagedChannel[];
  campaigns: Campaign[];
  platforms: SocialMediaPlatform[];
  accounts: { nanoid: string; platform: string }[];
  hashtags: Hashtag[];
  workspaceDomain: string;
  editPost: ScheduledPost | null;
}

export function ComposeClient({
  pages,
  campaigns: initialCampaigns,
  platforms,
  accounts,
  hashtags,
  workspaceDomain,
  editPost,
}: Props) {
  const ws = workspaceDomain.toLowerCase();
  const router = useRouter();
  const submittingRef = useRef(false);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>(() => {
    if (editPost) return editPost.recipients.map((r) => r.managed_page);
    return [];
  });
  const [content, setContent] = useState(editPost?.content ?? "");
  const [scheduledAt, setScheduledAt] = useState(
    editPost?.scheduled_at ?? new Date(Date.now() + 86400000).toISOString(),
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
        format: r.format ?? "post",
        linkUrl: r.link_url ?? "",
        firstComment: "",
      };
    }
    return init;
  });

  const [calOpen, setCalOpen] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDesc, setNewCampaignDesc] = useState("");
  const [campaignAction, setCampaignAction] = useState<CampaignActionState>(initialCampaignState);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [hashtagInputByPage, setHashtagInputByPage] = useState<Record<string, string>>({});
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

  const accountPlatformMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of accounts) map[a.nanoid] = a.platform;
    return map;
  }, [accounts]);

  const platformBySlug = useMemo(() => {
    const map: Record<string, SocialMediaPlatform> = {};
    for (const p of platforms) map[p.slug] = p;
    return map;
  }, [platforms]);

  const getPagePlatformSlug = useCallback(
    (page: ManagedChannel): string => {
      if (page.platform) return page.platform;
      const platformNanoid = accountPlatformMap[page.social_account];
      const p = platforms.find((pl) => pl.nanoid === platformNanoid);
      return p?.slug || "";
    },
    [accountPlatformMap, platforms],
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

  const selectedSlugs = useMemo(
    () => [...new Set(selectedPages.map((p) => getPagePlatformSlug(p)).filter(Boolean))],
    [selectedPages, getPagePlatformSlug],
  );

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
        const next = prev.includes(nanoid) ? prev.filter((id) => id !== nanoid) : [...prev, nanoid];
        return next;
      });
    },
    [],
  );

  const canProceed = selectedPages.length > 0 && content.trim().length > 0;

  const handleNext = useCallback(() => {
    if (!canProceed) return;
    const initial: typeof variants = {};
    for (const page of selectedPages) {
      const slug = getPagePlatformSlug(page);
      initial[page.nanoid] = {
        content,
        format: "post",
        linkUrl: "",
        firstComment: "",
      };
    }
    setVariants(initial);
    setStep(2);
  }, [canProceed, content, selectedPages, getPagePlatformSlug]);

  const buildFormData = useCallback(
    (statusOverride?: string) => {
      const pageMap: Record<string, ManagedChannel> = {};
      for (const p of selectedPages) pageMap[p.nanoid] = p;

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
      if (campaignId) formData.append("campaign", campaignId);

      if (publishNow) {
        if (statusOverride) formData.append("status", statusOverride);
      } else {
        formData.append("scheduled_at", scheduledAt);
        formData.append("status", statusOverride || "scheduled");
      }

      if (recipients.length) formData.append("recipients_json", JSON.stringify(recipients));
      if (Object.keys(firstComments).length)
        formData.append("first_comments_json", JSON.stringify(firstComments));

      return formData;
    },
    [
      selectedPages,
      content,
      variants,
      hashtagsByPage,
      firstCommentByPage,
      campaignId,
      publishNow,
      scheduledAt,
      getPagePlatformSlug,
    ],
  );

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setStatus("submitting");
    setErrorMsg("");

    try {
      let result;
      const formData = buildFormData(publishNow ? undefined : "scheduled");

      if (editPost) {
        result = await updatePostAction(editPost.nanoid, {
          content,
          campaign: campaignId || undefined,
          scheduled_at: publishNow ? undefined : scheduledAt || undefined,
          status: publishNow ? undefined : "scheduled",
          recipients: JSON.parse(formData.get("recipients_json") as string),
          first_comments: formData.has("first_comments_json")
            ? JSON.parse(formData.get("first_comments_json") as string)
            : undefined,
        }, ws);
      } else {
        result = await createPostAction({ status: "idle" }, formData, ws);
      }

      if (result.status === "success") {
        setStatus("success");
        setTimeout(() => router.push(`/${ws}/dashboard/socialmanager`), 1500);
      } else {
        setStatus("error");
        setErrorMsg(result.message || "Failed to create post.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("An unexpected error occurred.");
    } finally {
      submittingRef.current = false;
    }
  }, [buildFormData, editPost, content, campaignId, publishNow, scheduledAt, ws, router]);

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

  const getActiveContent = useCallback(
    (pageNanoid: string): string => {
      const v = variants[pageNanoid];
      return v?.content || content;
    },
    [variants, content],
  );

  const addHashtag = useCallback((pageNanoid: string, tag: string) => {
    const clean = tag.startsWith("#") ? tag : `#${tag}`;
    setHashtagsByPage((prev) => {
      const current = prev[pageNanoid] ?? [];
      if (current.includes(clean)) return prev;
      return { ...prev, [pageNanoid]: [...current, clean] };
    });
    setHashtagInputByPage((prev) => ({ ...prev, [pageNanoid]: "" }));
  }, []);

  const removeHashtag = useCallback((pageNanoid: string, idx: number) => {
    setHashtagsByPage((prev) => {
      const current = [...(prev[pageNanoid] ?? [])];
      current.splice(idx, 1);
      return { ...prev, [pageNanoid]: current };
    });
  }, []);

  const setDateTime = useCallback(
    (d?: Date, t?: string) => {
      const base = d ?? (scheduledAt ? new Date(scheduledAt) : undefined);
      if (!base) return;
      const [h, m] = (t ?? new Date().toTimeString().slice(0, 5)).split(":").map(Number);
      const next = new Date(base);
      next.setHours(h, m, 0, 0);
      setScheduledAt(next.toISOString());
    },
    [scheduledAt],
  );

  const renderDevicePreview = () => {
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
          <p className="text-[11px] leading-relaxed text-slate-800">{previewContent || "Your post preview..."}</p>
          {tags.length > 0 && (
            <p className="text-[10px] font-medium text-indigo-600">{tags.join(" ")}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Multi-Platform Campaign Composer
              </h2>
              <p className="text-xs text-slate-500">
                {editPost ? "Edit your scheduled post" : "Customize, schedule & cross-post across social networks"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-3">
          {[
            { n: 1, label: "Compose" },
            { n: 2, label: "Customize per Platform" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-3">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  step === s.n
                    ? "bg-indigo-600 text-white"
                    : step > s.n
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {step > s.n ? "\u2713" : s.n}
              </div>
              <span
                className={`text-xs font-semibold ${
                  step === s.n ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {s.label}
              </span>
              {i === 0 && <div className="h-px w-8 bg-slate-200" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 overflow-y-auto lg:grid-cols-12">
          <div className="space-y-6 overflow-y-auto border-r border-slate-200 bg-white p-6 lg:col-span-7">
            {step === 1 && (
              <>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Where do you want to publish?
                  </label>
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
                              return (
                                <button
                                  key={page.nanoid}
                                  type="button"
                                  onClick={() => togglePage(page.nanoid)}
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
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write master caption here... (This will be adapted per network below)"
                    rows={5}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{content.length} characters</span>
                    {selectedPages.length > 0 && (
                      <span>Posting to {selectedPages.length} channel{selectedPages.length !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="space-y-4 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Tailor Content per Platform
                </label>
                <div className="space-y-4">
                  {selectedPages.map((page) => {
                    const slug = getPagePlatformSlug(page);
                    const v = variants[page.nanoid] ?? { content, format: "post", linkUrl: "", firstComment: "" };
                    const style = getPlatformStyle(slug);
                    const tags = hashtagsByPage[page.nanoid] ?? [];
                    const input = hashtagInputByPage[page.nanoid] ?? "";
                    const platform = platformBySlug[slug];
                    const charLimit = platform ? undefined : undefined;

                    return (
                      <div key={page.nanoid} className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${style.bg} ${style.border}`}>
                            <PlatformGlyph platform={slug} size="md" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{page.page_name}</p>
                            <p className="text-xs text-slate-500">{style.label}</p>
                          </div>
                          {charLimit && (
                            <span className="ml-auto text-[10px] text-slate-400">{(v.content || "").length}/{charLimit}</span>
                          )}
                        </div>
                        <div className="space-y-3">
                          <textarea
                            value={v.content}
                            onChange={(e) =>
                              setVariants((prev) => ({
                                ...prev,
                                [page.nanoid]: { ...v, content: e.target.value },
                              }))
                            }
                            rows={3}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-700">Format</label>
                              <select
                                value={v.format}
                                onChange={(e) =>
                                  setVariants((prev) => ({
                                    ...prev,
                                    [page.nanoid]: { ...v, format: e.target.value },
                                  }))
                                }
                                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="post">Post</option>
                                <option value="image">Image</option>
                                <option value="video">Video</option>
                                <option value="link_post">Link Post</option>
                              </select>
                            </div>
                            {v.format === "link_post" && (
                              <div>
                                <label className="mb-1 block text-xs font-medium text-slate-700">Link URL</label>
                                <input
                                  type="url"
                                  value={v.linkUrl}
                                  onChange={(e) =>
                                    setVariants((prev) => ({
                                      ...prev,
                                      [page.nanoid]: { ...v, linkUrl: e.target.value },
                                    }))
                                  }
                                  placeholder="https://..."
                                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-700">First Comment</label>
                            <input
                              type="text"
                              value={v.firstComment}
                              onChange={(e) =>
                                setVariants((prev) => ({
                                  ...prev,
                                  [page.nanoid]: { ...v, firstComment: e.target.value },
                                }))
                              }
                              placeholder="Optional first comment"
                              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-700">Hashtags</label>
                            <div className="flex flex-wrap gap-1.5 mb-1.5">
                              {tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700"
                                >
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => removeHashtag(page.nanoid, idx)}
                                    className="ml-0.5 text-indigo-400 hover:text-indigo-700"
                                  >
                                    &times;
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={input}
                                onChange={(e) =>
                                  setHashtagInputByPage((prev) => ({ ...prev, [page.nanoid]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && input.trim()) {
                                    e.preventDefault();
                                    addHashtag(page.nanoid, input.trim());
                                  }
                                }}
                                placeholder="#hashtag"
                                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (input.trim()) addHashtag(page.nanoid, input.trim());
                                }}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 1 && (
              <>
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
                    <button
                      type="button"
                      onClick={() => setCampaignModalOpen(true)}
                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      New
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col items-center justify-start space-y-4 overflow-y-auto bg-slate-100 p-6 lg:col-span-5">
            <div className="flex w-full items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Live Device Preview ({selectedSlugs[0] ? getPlatformStyle(selectedSlugs[0]).label : "None"})
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                Preview Mode
              </span>
            </div>
            {renderDevicePreview()}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4">
          {step === 1 ? (
            <>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleSubmit()}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-xl"
                >
                  <Save className="h-4 w-4" />
                  Save as Draft
                </Button>
              </div>
              <div className="flex items-center gap-3">
                {!canProceed && (
                  <span className="max-w-[260px] text-right text-[11px] text-slate-500">
                    Select a channel and write your master post to continue.
                  </span>
                )}
                <Button
                  onClick={() => router.back()}
                  variant="destructive"
                  size="sm"
                  className="rounded-xl"
                >
                  Discard Draft
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!canProceed}
                  size="sm"
                  className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 px-5 py-2.5 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Customize
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  onClick={() => handleSubmit()}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-xl"
                >
                  <Save className="h-4 w-4" />
                  Save as Draft
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => router.back()}
                  variant="destructive"
                  size="sm"
                  className="rounded-xl"
                >
                  Discard Draft
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={status === "submitting"}
                  size="sm"
                  className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 px-5 py-2.5 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-pink-600"
                >
                  {status === "submitting"
                    ? "Submitting\u2026"
                    : editPost
                      ? "Update Post"
                      : `Submit across ${selectedSlugs.length} Platform${selectedSlugs.length !== 1 ? "s" : ""}`}
                </Button>
              </div>
            </>
          )}
        </div>

        {campaignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-sm font-bold text-slate-900">Create Campaign</h3>
              {campaignAction.status === "error" && campaignAction.message && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{campaignAction.message}</span>
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Name</label>
                  <input
                    type="text"
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                    placeholder="Campaign name"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Description (optional)</label>
                  <input
                    type="text"
                    value={newCampaignDesc}
                    onChange={(e) => setNewCampaignDesc(e.target.value)}
                    placeholder="Brief description"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setCampaignModalOpen(false);
                    setCampaignAction(initialCampaignState);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCampaign}
                  disabled={!newCampaignName.trim()}
                  size="sm"
                >
                  Create
                </Button>
              </div>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-lg">
            {editPost ? "Post updated" : "Post created successfully"}! Redirecting...
          </div>
        )}
        {status === "error" && errorMsg && (
          <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
