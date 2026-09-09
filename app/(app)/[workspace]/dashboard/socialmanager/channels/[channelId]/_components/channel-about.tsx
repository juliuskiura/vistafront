import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalLink, Globe, Info } from "lucide-react";

import type { ManagedChannel } from "@/lib/api/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "./platform-gradients";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-900">{children ?? <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}

interface ChannelAboutProps {
  channel: ManagedChannel;
}

export function ChannelAbout({ channel }: ChannelAboutProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Info className="size-4 text-slate-400" />
          About this channel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Bio">{channel.bio || null}</Field>
          <Field label="Category">{channel.category || null}</Field>
          <Field label="Website">
            {channel.website ? (
              <Link
                href={channel.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Globe className="size-3.5" />
                {channel.website.replace(/^https?:\/\//, "")}
              </Link>
            ) : null}
          </Field>
          <Field label="Profile link">
            {channel.link ? (
              <Link
                href={channel.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="size-3.5" />
                Open {channel.platform_name}
              </Link>
            ) : null}
          </Field>
          <Field label="Page ID">
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{channel.page_id}</code>
          </Field>
          <Field label="Parent account">{channel.account_name || null}</Field>
          <Field label="Connected since">{formatDate(channel.created_at)}</Field>
          <Field label="Last synced">{formatDate(channel.updated_at)}</Field>
        </dl>
      </CardContent>
    </Card>
  );
}