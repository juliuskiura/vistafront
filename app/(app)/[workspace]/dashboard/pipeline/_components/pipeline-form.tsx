"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "@/lib/icons";
import { useToast } from "@/lib/context";
import { createPipelineAction } from "@/app/(app)/[workspace]/dashboard/pipeline/actions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceDomain: string;
}

/** The stages a new pipeline starts with. */
const DEFAULT_STAGES = ["Lead In", "Qualified", "Proposal", "Won"];

/**
 * The "New pipeline" dialog.
 *
 * The backend has no nested-create endpoint, so the pipeline and its
 * stages are two separate writes; the action does both in order.
 */
export function PipelineForm({ open, onOpenChange, workspaceDomain }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stages, setStages] = useState<string[]>([...DEFAULT_STAGES]);

  const submit = () => {
    startTransition(async () => {
      const result = await createPipelineAction({
        workspaceDomain,
        name,
        description: description || undefined,
        stages: stages.filter((s) => s.trim()),
      });
      if (result.status === "success") {
        toast.push({ variant: "success", message: "Pipeline created." });
        onOpenChange(false);
        setName("");
        setDescription("");
        setStages([...DEFAULT_STAGES]);
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not create the pipeline.",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New pipeline</DialogTitle>
          <DialogDescription>
            A pipeline groups the stages a deal moves through.
          </DialogDescription>
        </DialogHeader>

        <form
          action={() => {
            submit();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="pipeline-name">Name *</Label>
            <Input
              id="pipeline-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Enterprise sales"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pipeline-description">Description</Label>
            <textarea
              id="pipeline-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Stages</Label>
            <div className="space-y-2">
              {stages.map((stage, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={stage}
                    onChange={(e) => {
                      const next = [...stages];
                      next[index] = e.target.value;
                      setStages(next);
                    }}
                    aria-label={`Stage ${index + 1} name`}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      setStages(stages.filter((_, i) => i !== index))
                    }
                    disabled={stages.length === 1}
                    aria-label={`Remove stage ${index + 1}`}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setStages([...stages, ""])}
            >
              <Plus className="mr-1.5 size-4" aria-hidden="true" />
              Add stage
            </Button>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || !name.trim() || !stages.some((s) => s.trim())}
            >
              {pending ? "Creating…" : "Create pipeline"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
