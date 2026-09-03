import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireWorkspace } from "@/lib/auth/server";

/**
 * Subscriptions (Server Component).
 *
 * Reads `app_access` from the active workspace — the backend already tells
 * us which app keys the org is entitled to under its active subscription.
 * Pure server render: no client interactivity needed.
 */

const APP_LABELS: Record<string, { label: string; description: string }> = {
  crm: {
    label: "CRM",
    description: "Contacts, companies, deals, and pipeline.",
  },
  projects: {
    label: "Projects",
    description: "Plan and track project work, deliverables, and tasks.",
  },
  notebook: {
    label: "Notebook",
    description: "Long-form notes and knowledge base.",
  },
  developer: {
    label: "Developer",
    description: "API tokens, webhooks, and platform integrations.",
  },
  schedules: {
    label: "Schedules",
    description: "Calendar and today views for the team.",
  },
  socialmanager: {
    label: "Social manager",
    description: "Channels, calendar, composer, and analytics.",
  },
  media_libary: {
    label: "Media library",
    description: "Centralised media assets, folders, and collections.",
  },
  billing: {
    label: "Billing",
    description: "Invoices, payment methods, and receipts.",
  },
  platform: {
    label: "Platform",
    description: "Configure third-party platforms and content formats.",
  },
};

function describe(key: string) {
  return (
    APP_LABELS[key] ?? {
      label: key.replace(/_/g, " "),
      description: "Workspace entitlement.",
    }
  );
}

export default async function SubscriptionsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  const keys = Array.from(new Set(active.app_access ?? []));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          Apps and entitlements included in your subscription for{" "}
          <strong>{active.name}</strong>.
        </p>
      </div>

      {keys.length === 0 ? (
        <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          No apps are included in this subscription. Contact your workspace
          owner to upgrade.
        </Card>
      ) : (
        <Card className="rounded-xl border bg-card">
          <CardHeader>
            <CardTitle>Included apps</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {keys.map((key) => {
                const meta = describe(key);
                return (
                  <li
                    key={key}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {meta.label}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {meta.description}
                      </p>
                    </div>
                    <Badge variant="secondary">Included</Badge>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}