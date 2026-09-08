"use client";

import { useRouter } from "next/navigation";
import { Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComposeFooterProps {
  step: 1 | 2;
  canProceed: boolean;
  status: "idle" | "submitting" | "success" | "error";
  editPost: boolean;
  selectedSlugs: string[];
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onDiscard: () => void;
  onSaveDraft: () => void;
}

export function ComposeFooter({
  step,
  canProceed,
  status,
  editPost,
  selectedSlugs,
  onBack,
  onNext,
  onSubmit,
  onDiscard,
  onSaveDraft,
}: ComposeFooterProps) {
  const router = useRouter();

  if (step === 1) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={onSaveDraft}
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
            onClick={onDiscard}
            variant="destructive"
            size="sm"
            className="rounded-xl"
          >
            Discard Draft
          </Button>
          <Button
            onClick={onNext}
            disabled={!canProceed}
            size="sm"
            className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 px-5 py-2.5 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next: Customize
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4">
      <div className="flex items-center gap-2">
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-xl"
        >
          Back
        </Button>
        <Button
          onClick={onSaveDraft}
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
          onClick={onDiscard}
          variant="destructive"
          size="sm"
          className="rounded-xl"
        >
          Discard Draft
        </Button>
        <Button
          onClick={onSubmit}
          disabled={status === "submitting"}
          size="sm"
          className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 px-5 py-2.5 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-pink-600"
        >
          {status === "submitting"
            ? "Submitting…"
            : editPost
              ? "Update Post"
              : `Submit across ${selectedSlugs.length} Platform${selectedSlugs.length !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  );
}