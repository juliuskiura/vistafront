import { listInvoices } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { InvoicesList } from "../../invoices/_components/invoices-list";

export default async function BillingInvoicesPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  const invoices = await listInvoices({ workspace: active.domain }).catch(
    () => [],
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      <InvoicesList invoices={invoices} workspaceDomain={active.domain} />
    </div>
  );
}