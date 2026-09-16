"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  KeyRound,
  Shield,
  Users,
} from "lucide-react";

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
}

const HUB_ITEMS = [
  {
    label: "Memberships",
    description: "People in this workspace and their access level.",
    href: "/dashboard/members",
    icon: Users,
    accent: "from-secondary-400 to-secondary-600",
  },
  {
    label: "Roles",
    description: "Create and manage custom workspace roles.",
    href: "/dashboard/workspaces/roles",
    icon: Shield,
    accent: "from-primary-400 to-primary-600",
  },
  {
    label: "Permissions",
    description: "Grant model-level access to each role.",
    href: "/dashboard/workspaces/permissions",
    icon: KeyRound,
    accent: "from-accent-400 to-accent-600",
  },
];

export function WorkspacesList({ active, workspaces }: Props) {
  const canInvite =
    !!active.myRole && (active.myRole === "owner" || active.myRole === "admin");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Quick access to membership, roles, and permission management for{" "}
          <span className="font-medium text-foreground">{active.name}</span>.
        </p>
        {canInvite ? (
          <InviteMembersControl
            workspace={{ nanoid: active.nanoid, name: active.name }}
          />
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {HUB_ITEMS.map((item) => {
          const href = `/${active.domain}${item.href}`;
          return (
            <Link
              key={item.label}
              href={href}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className={`mb-4 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-white shadow-sm`}
              >
                <item.icon className="size-5" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-neutral-900">
                  {item.label}
                </h3>
                <ArrowUpRight className="size-4 text-neutral-400 transition-colors group-hover:text-primary" />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </Link>
          );
        })}
      </div>

      <Card className="rounded-xl border bg-card p-2">
        <Link
          href={`/${active.domain}/dashboard/members`}
          className="flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium hover:bg-muted"
        >
          <span className="flex items-center gap-2">
            <Building2 size={16} className="text-muted-foreground" />
            All my workspaces
          </span>
          <ArrowUpRight size={16} className="text-muted-foreground" />
        </Link>
      </Card>

      {workspaces.length === 0 ? (
        <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          You are not a member of any workspace yet.
        </Card>
      ) : (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">
            Your workspaces
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {workspaces.map((w) => (
              <WorkspaceCard
                key={w.nanoid}
                ws={w}
                isActive={w.nanoid === active.nanoid}
              />
            ))}
          </div>
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