"use client";

import type { SubscriptionState, SubsPlan } from "@/lib/api";
import { PlanCard } from "./plan-card";

export function PlansTab({
  plans,
  subscription,
  workspaceName,
  workspaceDomain,
  clientBusinessNanoid,
  referralCode,
}: {
  plans: SubsPlan[];
  subscription: SubscriptionState | null;
  workspaceName: string;
  workspaceDomain: string;
  clientBusinessNanoid: string;
  referralCode?: string;
}) {
  // Find trial and paid plans from the plans array
  const trialPlan = plans.find((plan) => plan.slug === 'trial' || plan.label.toLowerCase().includes('trial')) || plans[0];
  const paidPlans = plans.filter((plan) => !(plan.slug === 'trial' || plan.label.toLowerCase().includes('trial')));
  const paidPlan = paidPlans[0] || plans[0];

  if (!trialPlan || !paidPlan) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Plans</h2>
        <p className="text-sm text-muted-foreground">No plans available.</p>
      </section>
    );
  }

  const cards: { plan: SubsPlan; isTrial: boolean }[] = [
    { plan: trialPlan, isTrial: true },
    { plan: paidPlan, isTrial: false },
  ];

  return (
    <div className="mx-auto max-w-5xl py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
          Vistasolve Billing
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display mt-3 tracking-tight">
          Manage {workspaceName} billing. Start free. Upgrade when you&apos;re ready.
        </h1>

        <p className="text-base sm:text-lg text-slate-600 mt-3">
          Select the plan that best fits your workspace. No feature limits. The trial is the real product.
        </p>
      </div>

      {/* The Two Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
        {cards.map(({ plan, isTrial }) => (
          <PlanCard
            key={plan.slug}
            plan={plan}
            isTrial={isTrial}
            isCurrent={subscription?.subscription?.plan_slug === plan.slug}
            subscription={subscription}
            workspaceDomain={workspaceDomain}
            clientBusinessNanoid={clientBusinessNanoid}
            referralCode={referralCode}
          />
        ))}
      </div>

      {/* Reassuring Philosophy Note */}
      <div className="mt-12 p-5 max-w-3xl mx-auto rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-600 space-y-1">
        <p className="font-semibold text-slate-800">
          The Vistasolve Principle
        </p>
        <p>
          Review each plan&apos;s features and pricing above, then choose the
          plan that fits your workspace.
        </p>
        <p className="pt-1">
            Vistasolve reserves the right to revise, suspend, or terminate any
            plan that abuses the platform or violates our Terms of Service and
            Acceptable Use Policy. This keeps Vistasolve fair and secure for
            every team.
          </p>
      </div>
    </div>
  );
}