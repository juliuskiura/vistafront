import { requireWorkspace } from "@/lib/auth/server";
import { AccountLayout } from "./account-layout";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  return (
    <AccountLayout workspaceDomain={active.domain}>
      {children}
    </AccountLayout>
  );
}
