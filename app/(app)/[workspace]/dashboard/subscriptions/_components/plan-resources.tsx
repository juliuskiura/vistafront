"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/context";
import type { Plan, PlanApp, PlanFeature } from "@/lib/api";
import {
  addPlanAppAction,
  addPlanFeatureAction,
  deletePlanAppAction,
  deletePlanFeatureAction,
} from "../actions";

interface Props {
  plan: Plan;
  apps: PlanApp[];
  workspaceDomain: string;
}

export function PlanResources({ plan, apps, workspaceDomain }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [featureToDelete, setFeatureToDelete] = useState<PlanFeature | null>(
    null,
  );
  const [appToDelete, setAppToDelete] = useState<PlanApp | null>(null);

  const features = plan.features ?? [];

  return (
    <div className="grid gap-6 border-t bg-sidebar/30 p-4 sm:grid-cols-2">
      <section>
        <h3 className="text-sm font-semibold">
          Features{" "}
          <span className="font-normal text-muted-foreground">
            (order: top to bottom)
          </span>
        </h3>
        <ul className="mt-2 space-y-1.5">
          {features.length === 0 ? (
            <li className="text-sm text-muted-foreground">
              No features yet — add the first one below.
            </li>
          ) : (
            features.map((f, i) => (
              <li
                key={f.nanoid ?? `${f.feature}-${i}`}
                className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <Check className="size-4 shrink-0 text-emerald-500" />
                <span className="min-w-0 flex-1">{f.feature}</span>
                <button
                  type="button"
                  onClick={() => setFeatureToDelete(f)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remove feature: ${f.feature}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))
          )}
        </ul>
        <InlineFeatureAdd
          planSlug={plan.slug}
          workspaceDomain={workspaceDomain}
        />
      </section>

      <section>
        <h3 className="text-sm font-semibold">App bindings</h3>
        <ul className="mt-2 space-y-1.5">
          {apps.length === 0 ? (
            <li className="text-sm text-muted-foreground">
              No apps bound yet — this plan grants nothing beyond its features.
            </li>
          ) : (
            apps.map((app) => (
              <li
                key={app.id}
                className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                  {app.app_key}
                </code>
                {app.feature_flag ? (
                  <Badge variant="outline" className="text-xs">
                    {app.feature_flag}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    no flag
                  </Badge>
                )}
                <button
                  type="button"
                  onClick={() => setAppToDelete(app)}
                  className="ml-auto text-muted-foreground hover:text-destructive"
                  aria-label={`Unbind ${app.app_key}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))
          )}
        </ul>
        <InlineAppAdd planSlug={plan.slug} workspaceDomain={workspaceDomain} />
      </section>

      <ConfirmDialog
        open={featureToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setFeatureToDelete(null);
        }}
        title={`Remove "${featureToDelete?.feature}"?`}
        description="This headline is removed from the plan's feature list."
        confirmLabel="Remove feature"
        variant="destructive"
        onConfirm={async () => {
          if (!featureToDelete) return;
          const result = await deletePlanFeatureAction(
            featureToDelete.nanoid,
            workspaceDomain,
          );
          if (!result.ok) {
            toast.push({ variant: "error", message: result.error ?? "Failed." });
          }
          setFeatureToDelete(null);
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={appToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setAppToDelete(null);
        }}
        title={`Unbind "${appToDelete?.app_key}"?`}
        description="Organizations on this plan immediately lose access to this app and its feature flag."
        confirmLabel="Unbind app"
        variant="destructive"
        onConfirm={async () => {
          if (!appToDelete) return;
          const result = await deletePlanAppAction(
            appToDelete.id,
            workspaceDomain,
          );
          if (!result.ok) {
            toast.push({ variant: "error", message: result.error ?? "Failed." });
          }
          setAppToDelete(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function InlineFeatureAdd({
  planSlug,
  workspaceDomain,
}: {
  planSlug: string;
  workspaceDomain: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (!value.trim() || pending) return;
    setPending(true);
    const result = await addPlanFeatureAction(planSlug, value, workspaceDomain);
    setPending(false);
    if (!result.ok) {
      toast.push({ variant: "error", message: result.error ?? "Failed to add." });
      return;
    }
    setValue("");
    router.refresh();
  };

  return (
    <form
      className="mt-3 flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="flex-1 space-y-1">
        <Label htmlFor={`feature-${planSlug}`} className="sr-only">
          New feature
        </Label>
        <Input
          id={`feature-${planSlug}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type a feature then Add"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void submit();
            }
          }}
        />
      </div>
      <Button type="submit" size="sm" disabled={pending || !value.trim()}>
        <Plus className="size-4" />
        Add
      </Button>
    </form>
  );
}

function InlineAppAdd({
  planSlug,
  workspaceDomain,
}: {
  planSlug: string;
  workspaceDomain: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [appKey, setAppKey] = useState("");
  const [flag, setFlag] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (!appKey.trim() || pending) return;
    setPending(true);
    const result = await addPlanAppAction(planSlug, appKey, flag, workspaceDomain);
    setPending(false);
    if (!result.ok) {
      toast.push({ variant: "error", message: result.error ?? "Failed to add." });
      return;
    }
    setAppKey("");
    setFlag("");
    router.refresh();
  };

  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`app-${planSlug}`}>App key</Label>
          <Input
            id={`app-${planSlug}`}
            value={appKey}
            onChange={(e) => setAppKey(e.target.value)}
            placeholder="e.g. projects"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`flag-${planSlug}`}>Feature flag</Label>
          <Input
            id={`flag-${planSlug}`}
            value={flag}
            onChange={(e) => setFlag(e.target.value)}
            placeholder="e.g. projects_full"
          />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={pending || !appKey.trim()}>
        <Plus className="size-4" />
        Bind app
      </Button>
    </form>
  );
}