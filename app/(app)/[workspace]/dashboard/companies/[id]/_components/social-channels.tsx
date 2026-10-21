"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pencil, Plus, Star, Trash2 } from "@/lib/icons";
import { resolveSocialIcon } from "@/lib/crm/social-icon-map";
import type { CompanySocialLink } from "@/lib/api";
import { useToast } from "@/lib/context";
import { updateCompanySocialLinksAction } from "@/app/(app)/[workspace]/dashboard/companies/record-actions";
import {
  SocialChannelEditor,
  type ChannelDraft,
} from "./social-channel-editor";

interface Props {
  /** The company's channels, as the backend stores them. */
  links: CompanySocialLink[];
  /** The company being edited — its nanoid identifies it. */
  companyNanoid: string;
  workspaceDomain: string;
  /**
   * Where the channels are rendered.
   *
   * `"banner"` sits them on the page's gradient header, so the tiles are
   * translucent white instead of solid cards.
   */
  tone?: "default" | "banner";
}

/** The channel being edited, in the shape the editor works with. */
type Draft = ChannelDraft;

const EMPTY_DRAFT: Draft = { name: "", url: "", isPrimary: false };

/**
 * The company's social channels, listed by their network icon.
 *
 * This is the legacy record's layout: every channel is a tile carrying its
 * own network icon, and each tile has its own edit button — so a channel is
 * corrected in place, without turning the whole record into edit mode.
 *
 * The backend stores the channels as one JSON column, so a save sends the
 * whole list; the action is the only writer.
 */
export function SocialChannels({
  links,
  companyNanoid,
  workspaceDomain,
  tone = "default",
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  /** The channel being edited, or `null` when the editor is closed. */
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  /** Whether the editor is adding a new channel rather than editing one. */
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  /** The channel waiting for the removal confirmation. */
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);

  const onGradient = tone === "banner";
  const tileClass = onGradient
    ? "border-white/30 bg-white/15 text-white hover:bg-white/25"
    : "border bg-card";
  const iconButtonClass = onGradient
    ? "text-white/80 hover:bg-white/25 hover:text-white"
    : "text-muted-foreground hover:bg-muted hover:text-foreground";
  const dangerButtonClass = onGradient
    ? "text-white/80 hover:bg-white/25 hover:text-white"
    : "text-muted-foreground hover:bg-muted hover:text-destructive";

  const openEditor = (index: number) => {
    const link = links[index];
    setEditingIndex(index);
    setAdding(false);
    setDraft({
      name: link?.name ?? "",
      url: link?.url ?? "",
      isPrimary: link?.is_primary === true,
    });
  };

  const openAdd = () => {
    setEditingIndex(null);
    setAdding(true);
    setDraft(EMPTY_DRAFT);
  };

  const closeEditor = () => {
    setEditingIndex(null);
    setAdding(false);
    setDraft(EMPTY_DRAFT);
  };

  const persist = (next: CompanySocialLink[]) => {
    startTransition(async () => {
      const result = await updateCompanySocialLinksAction({
        workspaceDomain,
        nanoid: companyNanoid,
        links: next,
      });
      if (result.status === "success") {
        toast.push({ variant: "success", message: "Channels saved." });
        closeEditor();
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not save that change.",
        });
      }
    });
  };

  const saveDraft = () => {
    const url = draft.url.trim();
    if (!url) {
      toast.push({ variant: "error", message: "A channel needs a URL." });
      return;
    }

    const entry: CompanySocialLink = {
      url,
      ...(draft.name.trim() ? { name: draft.name.trim() } : {}),
      ...(draft.isPrimary ? { is_primary: true } : {}),
    };

    const next = [...links];
    const index = adding ? next.length : (editingIndex ?? 0);
    if (adding) next.push(entry);
    else next[index] = entry;

    // Only one channel carries the primary star, so a new primary clears
    // the flag on the others.
    const normalised = next.map((link, i) =>
      draft.isPrimary && i !== index ? { ...link, is_primary: false } : link,
    );
    persist(normalised);
  };

  const confirmRemove = () => {
    if (removingIndex === null) return;
    persist(links.filter((_, index) => index !== removingIndex));
    setRemovingIndex(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {links.length === 0 ? (
          <p
            className={`text-sm ${
              onGradient ? "text-white/80" : "text-muted-foreground"
            }`}
          >
            No channels yet — add the company&rsquo;s social profiles.
          </p>
        ) : null}

        {links.map((link, index) => {
          if (editingIndex === index) return null;
          const Icon = resolveSocialIcon(link.name);
          const label = link.name ?? "channel";
          return (
            <div
              key={`${link.url}-${index}`}
              className={`group inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs ${tileClass}`}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                title={link.url}
                className="max-w-[12rem] truncate font-medium hover:underline"
              >
                {link.name ?? link.url}
              </a>
              {link.is_primary ? (
                <Star
                  className="size-3.5 shrink-0 fill-amber-400 text-amber-500"
                  aria-label="Primary channel"
                />
              ) : null}
              <button
                type="button"
                onClick={() => openEditor(index)}
                aria-label={`Edit ${label}`}
                className={`rounded p-1 transition-colors ${iconButtonClass}`}
              >
                <Pencil className="size-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setRemovingIndex(index)}
                aria-label={`Remove ${label}`}
                className={`rounded p-1 transition-colors ${dangerButtonClass}`}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={openAdd}
          disabled={adding || editingIndex !== null}
          className={
            onGradient
              ? "text-white hover:bg-white/20 hover:text-white"
              : undefined
          }
        >
          <Plus className="mr-1.5 size-3.5" aria-hidden="true" />
          Add channel
        </Button>
      </div>

      {adding || editingIndex !== null ? (
        <SocialChannelEditor
          draft={draft}
          onDraftChange={setDraft}
          onSave={saveDraft}
          onCancel={closeEditor}
          pending={pending}
          onGradient={onGradient}
        />
      ) : null}

      <ConfirmDialog
        open={removingIndex !== null}
        onOpenChange={(open) => {
          if (!open) setRemovingIndex(null);
        }}
        title="Remove channel?"
        description="The channel is removed from the company record. You can add it again at any time."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={confirmRemove}
        confirming={pending}
      />
    </div>
  );
}
