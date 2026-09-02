"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Plus, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/context";
import { initialAuthState } from "@/lib/auth/action-state";
import {
  createBusinessAndWorkspaceAction,
  skipOnboardingAction,
} from "@/app/(app)/onboarding/actions";

interface WorkspaceSummary {
  nanoid: string;
  name: string;
  domain: string;
}

interface Props {
  firstName: string;
  hasWorkspace: boolean;
  workspaces: WorkspaceSummary[];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function VSButton({
  className,
  appearance = "solid",
  ...props
}: React.ComponentProps<"button"> & {
  appearance?: "solid" | "ghost" | "outline" | "threeD";
}) {
  return (
    <Button
      className={cn(
        "h-11 rounded-xl px-4 font-medium",
        appearance === "threeD" &&
          "bg-primary text-primary-foreground shadow-[0_4px_0_0_var(--primary-700)] transition-all hover:translate-y-[1px] hover:shadow-[0_3px_0_0_var(--primary-700)] active:translate-y-[4px] active:shadow-none",
        className,
      )}
      {...props}
    />
  );
}

export function OnboardingHomeClient({
  firstName,
  hasWorkspace,
  workspaces,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [createState, createAction, createPending] = useActionState(
    createBusinessAndWorkspaceAction,
    initialAuthState,
  );
  const [businessName, setBusinessName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [domain, setDomain] = useState("");
  const [domainTouched, setDomainTouched] = useState(false);

  const errors = createState.status === "error" ? createState.fieldErrors ?? {} : {};
  const formError = createState.status === "error" ? createState.message : null;
  const domainInvalid =
    domain.length > 0 && !/^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/.test(domain);

  function handleBusinessChange(value: string) {
    setBusinessName(value);
    if (!workspaceName || workspaceName === businessName) {
      const next = value;
      setWorkspaceName(next);
      if (!domainTouched) setDomain(slugify(next));
    }
  }

  function handleWorkspaceChange(value: string) {
    setWorkspaceName(value);
    if (!domainTouched) setDomain(slugify(value));
  }

  async function handleSkip() {
    try {
      await skipOnboardingAction();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not continue.";
      toast.push({ variant: "error", message });
    }
  }

  async function handleLogout() {
    const { logoutAction } = await import("@/app/(auth)/logout/action");
    try {
      await logoutAction();
    } catch {
      /* redirect() throws */
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-md">
        <Card className="p-8">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-semibold text-primary">
              Welcome{firstName ? `, ${firstName}` : ""}
            </h1>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5"
              aria-label="Log out"
            >
              <LogOut className="size-4" />
              Log out
            </Button>
          </div>

          {hasWorkspace ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                You belong to{" "}
                {workspaces.length === 1
                  ? "one workspace"
                  : `${workspaces.length} workspaces`}
                . Open one to get started, or add another.
              </p>

              <div className="mt-6 space-y-2">
                {workspaces.map((ws) => (
                  <button
                    key={ws.nanoid}
                    type="button"
                    onClick={() => router.push(`/${ws.domain}/dashboard`)}
                    className="flex w-full items-center justify-between rounded-lg border bg-background/60 px-4 py-3 text-left transition-colors hover:bg-accent"
                  >
                    <span className="font-medium">{ws.name}</span>
                    <span className="text-xs text-muted-foreground">
                      /{ws.domain}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <Button asChild className="w-full">
                  <Link href="/onboarding/new-workspace">
                    <Plus className="mr-1.5 size-4" />
                    Add a workspace
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/onboarding/join">
                    <UserPlus className="mr-1.5 size-4" />
                    Join with an invite code
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Tell us a bit about your business and we&apos;ll spin up your
                first workspace.
              </p>

              <form action={createAction} className="mt-6 space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="legal_name">Business name</Label>
                  <Input
                    id="legal_name"
                    name="legal_name"
                    required
                    autoFocus
                    value={businessName}
                    onChange={(e) => handleBusinessChange(e.target.value)}
                  />
                  {errors.legal_name?.[0] && (
                    <p className="text-xs text-destructive">
                      {errors.legal_name[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    placeholder="e.g. KE"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workspace_name">Workspace name</Label>
                  <Input
                    id="workspace_name"
                    name="workspace_name"
                    required
                    value={workspaceName}
                    onChange={(e) => handleWorkspaceChange(e.target.value)}
                  />
                  {errors.workspace_name?.[0] && (
                    <p className="text-xs text-destructive">
                      {errors.workspace_name[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    name="domain"
                    required
                    placeholder="acme-corp"
                    value={domain}
                    onChange={(e) => {
                      setDomainTouched(true);
                      setDomain(slugify(e.target.value));
                    }}
                    aria-invalid={domainInvalid}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used as the workspace path slug. Must be unique.
                  </p>
                  {errors.domain?.[0] && (
                    <p className="text-xs text-destructive">
                      {errors.domain[0]}
                    </p>
                  )}
                  {domainInvalid && !errors.domain?.[0] && (
                    <p className="text-xs text-destructive">
                      Use lowercase letters, digits, and dashes only.
                    </p>
                  )}
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    {formError}
                  </div>
                )}

                <VSButton
                  type="submit"
                  appearance="threeD"
                  className="w-full"
                  disabled={createPending || domainInvalid}
                >
                  {createPending ? "Creating…" : "Create my workspace"}
                </VSButton>
              </form>

              <div className="mt-6 flex flex-col gap-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/onboarding/join">
                    <UserPlus className="mr-1.5 size-4" />
                    Join with an invite code
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleSkip}
                >
                  Skip for now
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
