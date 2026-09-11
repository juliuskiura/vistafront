import { requireWorkspace } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { LivechatLayout } from "./livechat-layout";

const CONSOLE_ADMIN_DOMAIN = "regwakes";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  if (active.domain !== CONSOLE_ADMIN_DOMAIN) {
    redirect(`/${active.domain}/dashboard`);
  }

  return (
    <LivechatLayout workspaceDomain={active.domain}>
      {children}
    </LivechatLayout>
  );
}
