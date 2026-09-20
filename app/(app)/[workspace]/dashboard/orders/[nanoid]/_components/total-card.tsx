import { HelpCircle, Lock, PackageCheck, ShieldCheck } from "@/lib/icons";
import { Card } from "@/components/ui/card";
import { formatPrice } from "../confirm/_components/order-summary";

const fmt = (n: number) => formatPrice(n, "KES");

export function TotalCard({
  keptCount,
  knockedCount,
  totalDue,
  onContinue,
  organizationName,
  planLabel,
}: {
  keptCount: number;
  knockedCount: number;
  totalDue: number;
  onContinue: () => void;
  organizationName: string;
  planLabel: string;
}) {
  const nothingToPay = totalDue <= 0;
  const plural = (count: number) => (count === 1 ? "line" : "lines");

  return (
    <div className="space-y-5">
      <Card className="rounded-xl border bg-card p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Order total</h2>
          <PackageCheck className="h-4 w-4 text-primary" />
        </div>

        <dl className="mt-5 space-y-2.5 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <dt>On this order</dt>
            <dd className="font-semibold text-foreground">
              {keptCount} {plural(keptCount)}
            </dd>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <dt>Knocked out</dt>
            <dd
              className={`font-semibold ${
                knockedCount > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
              }`}
            >
              {knockedCount}
            </dd>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <dt>Per month</dt>
            <dd className="font-semibold text-foreground">{fmt(totalDue)}</dd>
          </div>
        </dl>

        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-foreground">
              Total due today
            </span>
            <span className="font-display text-xl font-extrabold text-foreground">
              {fmt(totalDue)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Paid monthly to {organizationName}
          </p>
        </div>

        <button
          type="button"
          onClick={onContinue}
          disabled={nothingToPay}
          className={`mt-5 w-full rounded-lg px-5 py-3 text-sm font-semibold transition-all ${
            nothingToPay
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-sm hover:opacity-95 active:scale-[0.99]"
          }`}
        >
          {nothingToPay
            ? "Nothing to pay"
            : `Confirm & Pay ${fmt(totalDue)}`}
        </button>

        {nothingToPay && (
          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            You knocked out every billable line. Restore one to continue to
            payment.
          </p>
        )}
      </Card>

      <Card className="rounded-xl border bg-card p-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>
            Knocking a line out only applies to this checkout. Your{" "}
            <span className="font-semibold text-foreground">{planLabel}</span>{" "}
            plan keeps its included capabilities.
          </span>
        </div>
      </Card>

      <Card className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span>Need payment assistance?</span>
          </div>
          <span className="font-semibold text-foreground transition-colors hover:text-primary">
            24/7 Concierge
          </span>
        </div>
      </Card>

      <p className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground/80">
        <Lock className="h-3.5 w-3.5" />
        Settled over a TLS 256-bit encrypted checkout session.
      </p>
    </div>
  );
}