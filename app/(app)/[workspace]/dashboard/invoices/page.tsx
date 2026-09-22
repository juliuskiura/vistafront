import { listInvoices } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Banner } from "@/components/banner";
import { InvoicesList } from "./_components/invoices-list";

export default async function InvoicesPage({
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
    <div className="flex min-h-full flex-col">
      <Banner
        title="Invoices"
        description={`Billing documents for ${active.name}. Open an invoice to review and pay, or download a paid receipt.`}
      />
      <div className="mt-6 flex-1">
        <div className="mx-auto w-full max-w-5xl">
          <InvoicesList
            invoices={invoices}
            workspaceDomain={active.domain}
          />
        </div>
      </div>
    </div>
  );
}