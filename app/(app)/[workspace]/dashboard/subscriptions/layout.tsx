import { requireWorkspace } from "@/lib/auth/server";
import { SubscriptionsShellLayout } from "./subscription-layout";

export default async function SubscriptionsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  return (
    <SubscriptionsShellLayout workspaceDomain={active.domain}>
      {children}
    </SubscriptionsShellLayout>
  );
}
