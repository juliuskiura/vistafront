import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { requireWorkspace } from "@/lib/auth/server";
import { accessPageGoBackPath } from "@/lib/features/routes";
import { Button } from "@/components/ui/button";

/**
 * Subscription access page.
 *
 * The single destination for guarded routes (decision D5). Server guards
 * redirect here with `?mode=upgrade|locked` (+ optional `feature=`) when a
 * feature is unusable; Django is still the real gate for every API call.
 */
export default async function SubscriptionAccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{ mode?: string; feature?: string }>;
}) {
  const { workspace: slug } = await params;
  const { mode, feature } = await searchParams;
  const active = await requireWorkspace(slug);

  const isLocked = mode === "locked";
  const goBackPath = accessPageGoBackPath(feature);
  const goBackHref = `/${active.domain}${goBackPath}`;

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4">
      <div className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10">
          {isLocked ? (
            <Lock className="size-7 text-primary" aria-hidden />
          ) : (
            <Sparkles className="size-7 text-primary" aria-hidden />
          )}
        </div>

        <h1 className="font-display text-2xl font-bold text-foreground">
          {isLocked ? "Your subscription has expired" : "This feature isn’t included in your plan"}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {isLocked
            ? "Your subscription is no longer active. Renew it to keep using the features your workspace already set up."
            : "Upgrade your plan to unlock this feature. Your team can keep working everywhere else while you decide."}
        </p>

        <div className="mt-8 grid gap-3">
          <Button asChild variant="default" size="lg" className="w-full">
            <Link href={`/${active.domain}/dashboard/billing`}>
              {isLocked ? "Renew subscription" : "View plans"}
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href={goBackHref}>Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}