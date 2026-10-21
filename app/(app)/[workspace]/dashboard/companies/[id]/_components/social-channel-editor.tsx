"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "@/lib/icons";

/** The channel being edited, in the shape the editor works with. */
export interface ChannelDraft {
  name: string;
  url: string;
  isPrimary: boolean;
}

interface Props {
  draft: ChannelDraft;
  onDraftChange: (draft: ChannelDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  pending: boolean;
  /**
   * The editor sits on the page's gradient banner, so it brings its own
   * opaque surface instead of the muted one a plain page would use.
   */
  onGradient?: boolean;
}

/**
 * The inline editor for one social channel.
 *
 * Two fields and a primary flag — the smallest editor that can correct a
 * channel, because the channel is corrected in place, on the tile it belongs
 * to.
 */
export function SocialChannelEditor({
  draft,
  onDraftChange,
  onSave,
  onCancel,
  pending,
  onGradient = false,
}: Props) {
  return (
    <div
      className={`flex flex-wrap items-end gap-3 rounded-lg border p-3 ${
        onGradient ? "border-white/40 bg-white text-foreground" : "bg-muted/30"
      }`}
    >
      <div className="min-w-[9rem] flex-1">
        <Label htmlFor="social-channel-name">Channel</Label>
        <Input
          id="social-channel-name"
          value={draft.name}
          onChange={(e) => onDraftChange({ ...draft, name: e.target.value })}
          placeholder="LinkedIn"
          className="mt-1 h-8"
          autoFocus
        />
      </div>
      <div className="min-w-[12rem] flex-1">
        <Label htmlFor="social-channel-url">URL</Label>
        <Input
          id="social-channel-url"
          value={draft.url}
          onChange={(e) => onDraftChange({ ...draft, url: e.target.value })}
          placeholder="https://linkedin.com/company/acme"
          className="mt-1 h-8"
        />
      </div>
      <label className="flex items-center gap-2 pb-1.5 text-sm">
        <input
          type="checkbox"
          checked={draft.isPrimary}
          onChange={(e) =>
            onDraftChange({ ...draft, isPrimary: e.target.checked })
          }
          className="size-4 rounded border-input accent-primary"
        />
        Primary
      </label>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" onClick={onSave} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={pending}
          aria-label="Cancel editing the channel"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
