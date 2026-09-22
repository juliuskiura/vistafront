import { requireWorkspace } from "@/lib/auth/server";
import { BillingLayout } from "./billing-layout";

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
    <BillingLayout workspaceDomain={active.domain}>
      {children}
    </BillingLayout>
  );
}