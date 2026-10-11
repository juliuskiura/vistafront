import { Button } from "@/components/ui/button";
import { formatMediumDate } from "@/lib/dates";
import type { SNSSubscription } from "@/lib/api/mailbox";

/**
 * Pending AWS SNS subscription confirmations.
 *
 * When SNS first delivers to the inbound webhook it stores the
 * `SubscriptionConfirmation` as a `pending` row until an operator clicks the
 * `subscribe_url` to prove ownership of the endpoint. This section surfaces
 * those rows so the confirmation link is reachable from the settings screen.
 */
export function SnsSubscriptions({
  subscriptions,
}: {
  subscriptions: SNSSubscription[];
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-foreground">SNS Subscriptions</h3>
      {subscriptions.length === 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">
          No pending SNS subscriptions.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {subscriptions.map((sub) => (
            <li
              key={sub.nanoid}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {sub.topic_arn}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sub.status} · Received {formatMediumDate(sub.created_at)}
                </p>
              </div>
              <Button asChild size="sm">
                <a
                  href={sub.subscribe_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Confirm subscription
                </a>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
