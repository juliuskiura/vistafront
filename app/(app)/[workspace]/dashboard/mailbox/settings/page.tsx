import { requireWorkspace } from "@/lib/auth/server";
import { listDomainConfigs, listMailboxes } from "@/lib/api/mailbox";
import { MailboxSettingsList } from "../_components/mailbox-settings-list";

export default async function MailboxSettingsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const [mailboxes, domainConfigs] = await Promise.all([
    listMailboxes(ws),
    listDomainConfigs(ws).catch(() => []),
  ]);

  return (
    <div className="px-1 py-2">
      <MailboxSettingsList
        mailboxes={mailboxes}
        domainConfigs={domainConfigs}
        workspace={ws}
      />
    </div>
  );
}
