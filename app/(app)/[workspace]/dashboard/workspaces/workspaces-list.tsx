"use client";

import Link from "next/link";
import { ArrowUpRight, Building2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InviteMembersControl } from "@/components/workspace/invite-members-control";
import type { WorkspaceRole } from "@/lib/api";

const ROLE_LABEL: Record<WorkspaceRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

interface Props {
  active: {
    nanoid: string;
    name: string;
    domain: string;
    myRole: WorkspaceRole | null;
  };
  workspaces: Array<{
    nanoid: string;
    name: string;
    domain: string;
    myRole: WorkspaceRole | null;
  }>;
  /**
   * Workspace-scoped path to the members page (e.g. `/acme/dashboard/members`).
   */
  membersHref: string;
}

export function WorkspacesList({ active, workspaces, membersHref }: Props) {
  const canInvite =
    !!active.myRole && (active.myRole === "owner" || active.myRole === "admin");

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Workspaces</h1>
          <p className="text-sm text-muted-foreground">
            Workspaces you belong to. Select one to make it active.
          </p>
        </div>
        {canInvite ? (
          <InviteMembersControl
            workspace={{ nanoid: active.nanoid, name: active.name }}
          />
        ) : null}
      </div>

      <Card className="rounded-xl border bg-card p-2">
        <Link
          href={membersHref}
          className="flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium hover:bg-muted"
        >
          <span className="flex items-center gap-2">
            <Building2 size={16} className="text-muted-foreground" />
            Memberships
          </span>
          <ArrowUpRight size={16} className="text-muted-foreground" />
        </Link>
      </Card>

      {workspaces.length === 0 ? (
        <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          You are not a member of any workspace yet.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {workspaces.map((w) => (
            <WorkspaceCard
              key={w.nanoid}
              ws={w}
              isActive={w.nanoid === active.nanoid}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WorkspaceCard({
  ws,
  isActive,
}: {
  ws: {
    nanoid: string;
    name: string;
    domain: string;
    myRole: WorkspaceRole | null;
  };
  isActive: boolean;
}) {
  return (
    <Card
      className={`rounded-xl border bg-card p-4 ${isActive ? "ring-2 ring-primary" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{ws.name}</p>
          <p className="truncate text-xs text-muted-foreground">/{ws.domain}</p>
        </div>
        {ws.myRole ? (
          <Badge variant={ws.myRole === "owner" ? "default" : "secondary"}>
            {ROLE_LABEL[ws.myRole]}
          </Badge>
        ) : null}
      </div>
      <div className="mt-3 flex items-center gap-2">
        {isActive ? (
          <Button size="sm" variant="secondary" disabled>
            Active
          </Button>
        ) : (
          <Button size="sm" variant="outline" asChild>
            <Link href={`/${ws.domain}/dashboard/workspaces`}>Switch to</Link>
          </Button>
        )}
      </div>
    </Card>
  );
}