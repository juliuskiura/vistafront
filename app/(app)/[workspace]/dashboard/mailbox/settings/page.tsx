import { requireWorkspace } from "@/lib/auth/server";
import {
  listDomainConfigs,
  listMailboxes,
  listSnsSubscriptions,
} from "@/lib/api/mailbox";
import { MailboxSettingsList } from "../_components/mailbox-settings-list";
import { SnsSubscriptions } from "../_components/sns-subscriptions";

export default async function MailboxSettingsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const [mailboxes, domainConfigs, snsSubscriptions] = await Promise.all([
    listMailboxes(ws),
    listDomainConfigs(ws).catch(() => []),
    listSnsSubscriptions(ws).catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-1 py-2">
      <MailboxSettingsList
        mailboxes={mailboxes}
        domainConfigs={domainConfigs}
        workspace={ws}
      />
      <SnsSubscriptions subscriptions={snsSubscriptions} />
    </div>
  );
}
