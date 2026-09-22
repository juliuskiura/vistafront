import type { Payment } from "@/lib/api";
import { listPayments } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "@/lib/icons";
import { formatDate } from "../_components/dates";

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  succeeded: "bg-emerald-100 text-emerald-700 border-emerald-200",
  failed: "bg-rose-100 text-rose-700 border-rose-200",
  refunded: "bg-amber-100 text-amber-700 border-amber-200",
};

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  const payments = await listPayments({ workspace: active.domain }).catch(
    () => [],
  );

  if (payments.length === 0) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <h2 className="text-lg font-semibold">Payment History</h2>
        <p className="text-sm text-muted-foreground">
          No payments recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <h2 className="text-lg font-semibold">Payment History</h2>
      <ul className="space-y-2">
        {payments.map((p: Payment) => (
          <li
            key={p.nanoid}
            className="flex items-center justify-between rounded-lg border border-sidebar-divider bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Wallet className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">
                  {Number(p.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {p.currency}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(p.paid_at)}
                </p>
              </div>
            </div>
            <Badge
              className={`${PAYMENT_STATUS_STYLES[p.status] ?? ""} border`}
              variant="outline"
            >
              {p.status}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}