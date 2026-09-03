"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { InviteMembersControl } from "@/components/workspace/invite-members-control";
import type { WorkspaceMember, WorkspaceRole } from "@/lib/api";

const ROLE_LABEL: Record<WorkspaceRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

function initialsOf(
  first: string | null,
  last: string | null,
  email: string,
): string {
  const base = `${first ?? ""} ${last ?? ""}`.trim();
  if (base) {
    return base
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function fullName(
  first: string | null,
  last: string | null,
  email: string,
): string {
  const base = `${first ?? ""} ${last ?? ""}`.trim();
  return base || email;
}

interface Props {
  active: {
    nanoid: string;
    name: string;
    myRole: WorkspaceRole | null;
  };
  members: WorkspaceMember[];
}

export function MembersView({ active, members }: Props) {
  const canInvite =
    !!active.myRole && (active.myRole === "owner" || active.myRole === "admin");

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Members</h1>
          <p className="text-sm text-muted-foreground">
            People in {active.name}
          </p>
        </div>
        {canInvite ? (
          <InviteMembersControl
            workspace={{ nanoid: active.nanoid, name: active.name }}
          />
        ) : null}
      </div>

      {members.length === 0 ? (
        <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          No members found.
        </Card>
      ) : (
        <Card className="divide-y rounded-xl border bg-card">
          {members.map((m) => (
            <div
              key={m.nanoid}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {initialsOf(m.first_name, m.last_name, m.email)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {fullName(m.first_name, m.last_name, m.email)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {m.email}
                </p>
              </div>
              <Badge
                variant={m.role === "owner" ? "default" : "secondary"}
                className="shrink-0"
              >
                {ROLE_LABEL[m.role]}
              </Badge>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}