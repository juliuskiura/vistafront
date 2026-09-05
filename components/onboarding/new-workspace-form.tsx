"use client";

import { useActionState, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { initialAuthState } from "@/lib/auth/action-state";
import { createWorkspaceAction } from "@/app/(app)/onboarding/actions";

const LOGO_URL = "https://vsregmedia.s3.amazonaws.com/branding/logo_5MuHLkV.svg";

interface Props {
  business: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

import { VSButton } from "@/components/shared/components/customUi/VSButton";

export function NewWorkspaceForm({ business }: Props) {
  const [state, formAction, pending] = useActionState(
    createWorkspaceAction,
    initialAuthState,
  );
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [domainTouched, setDomainTouched] = useState(false);
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const formError = state.status === "error" ? state.message : null;

  function handleNameChange(value: string) {
    setName(value);
    if (!domainTouched) {
      setDomain(slugify(value));
    }
  }

  const domainInvalid =
    domain.length > 0 && !/^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/.test(domain);

  return (
    <div className="flex w-full max-w-md flex-col">
      <Card className="border-none bg-white/60 p-8">
        <div className="mb-6 flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_URL} alt="Vistasolve" className="h-8" />
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Create your workspace
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            A workspace is where your team plans projects, schedules social
            posts, and tracks clients.
          </p>
        </div>

        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="business" value={business} />

          <div className="space-y-2">
            <Label htmlFor="name">Workspace name</Label>
            <Input
              id="name"
              name="name"
              required
              autoFocus
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="bg-white/70"
            />
            {errors.name?.[0] && (
              <p className="text-xs text-destructive">{errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              name="domain"
              required
              placeholder="my-workspace"
              value={domain}
              onChange={(e) => {
                setDomainTouched(true);
                setDomain(slugify(e.target.value));
              }}
              className="bg-white/70"
              aria-invalid={domainInvalid}
            />
            <p className="text-xs text-muted-foreground">
              Used as the workspace path slug. Must be unique.
            </p>
            {errors.domain?.[0] && (
              <p className="text-xs text-destructive">{errors.domain[0]}</p>
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
            disabled={pending || domainInvalid}
          >
            {pending ? "Creating…" : "Create workspace"}
          </VSButton>
        </form>
      </Card>
    </div>
  );
}
