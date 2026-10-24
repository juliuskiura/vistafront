"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "@/lib/icons";
import {
  mergeTasksAction,
  suggestMergeAction,
} from "../actions/merge-actions";

export interface MergeCandidate {
  nanoid: string;
  title: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The records being merged — listed in the dialog and in the confirm. */
  selected: MergeCandidate[];
  workspaceDomain: string;
  /** Called after a successful merge so the parent can clear its selection. */
  onMerged?: () => void;
}

/**
 * The merge dialog.
 *
 * Merging **deletes** the source records — the backend creates one new
 * record and removes the ones that went into it. The dialog therefore lists
 * exactly what is about to go, and the merge itself is behind a second
 * confirmation.
 *
 * "Suggest with AI" asks the backend for a merged title and description.
 * It is a convenience, never a dependency: the AI model may not be
 * configured, and the merge still works with a title typed by hand.
 */
export function MergeDialog({
  open,
  onOpenChange,
  selected,
  workspaceDomain,
  onMerged,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [merging, setMerging] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Start from a blank form each time the dialog opens. Adjusting during
  // render is React's own way to react to a changed value without a
  // second paint.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTitle("");
      setDescription("");
      setSuggestError(null);
      setMergeError(null);
      setConfirmOpen(false);
    }
  }

  async function handleSuggest() {
    setSuggesting(true);
    setSuggestError(null);
    const result = await suggestMergeAction({
      workspaceDomain,
      ids: selected.map((item) => item.nanoid),
    });
    setSuggesting(false);

    if (result.error) {
      setSuggestError(result.error);
      return;
    }
    if (result.title) setTitle(result.title);
    if (result.description !== undefined) setDescription(result.description);
  }

  async function handleMerge() {
    setMerging(true);
    setMergeError(null);

    const result = await mergeTasksAction({
      workspaceDomain,
      taskIds: selected.map((item) => item.nanoid),
      title: title.trim(),
      description,
    });

    setMerging(false);

    if (result.status === "error") {
      setMergeError(result.message ?? "The merge did not go through.");
      return;
    }

    onMerged?.();
    onOpenChange(false);
  }

  const noun = "task";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Merge {selected.length} {noun}
              {selected.length === 1 ? "" : "s"}
            </DialogTitle>
            <DialogDescription>
              Combine the selected tasks into one. The tasks that go in are
              deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <ul className="max-h-28 space-y-1 overflow-y-auto rounded-lg border bg-muted/30 p-3">
              {selected.map((item) => (
                <li key={item.nanoid} className="flex items-center gap-2 text-sm">
                  <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="truncate">{item.title}</span>
                </li>
              ))}
            </ul>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSuggest}
              disabled={suggesting || selected.length < 2}
              className="w-full"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              {suggesting ? "AI is thinking…" : "Suggest with AI"}
            </Button>
            {suggestError ? (
              <p className="text-sm text-destructive">{suggestError}</p>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="merge-title">Title</Label>
              <Input
                id="merge-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={`Merged ${noun} title`}
                required
                maxLength={255}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="merge-description">Description</Label>
              <Textarea
                id="merge-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="Optional merged description"
              />
            </div>

            {mergeError ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {mergeError}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!title.trim() || merging}
                onClick={() => setConfirmOpen(true)}
              >
                Merge {selected.length} into 1
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Merge ${selected.length} ${noun}${selected.length === 1 ? "" : "s"}?`}
        description={
          <div className="space-y-2">
            <p>
              The selected {noun}s are deleted and replaced with one new{" "}
              {noun}. Their tasks move across.
            </p>
            <ul className="space-y-1 rounded-md bg-muted/40 p-2">
              {selected.map((item) => (
                <li key={item.nanoid} className="truncate text-xs">
                  • {item.title}
                </li>
              ))}
            </ul>
          </div>
        }
        confirmLabel={`Merge ${selected.length} into 1`}
        variant="destructive"
        confirming={merging}
        onConfirm={handleMerge}
      />
    </>
  );
}
