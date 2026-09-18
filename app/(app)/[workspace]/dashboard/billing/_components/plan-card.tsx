"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Clock, Users } from '@/lib/icons';
import { VSButton } from "@/components/shared/components/customUi/VSButton";
import type { CurrentSubscription, SubsPlan } from "@/lib/api";
import { formatDate, trialDaysLeft } from "./dates";
import { ReferralModal } from "./referral-modal";

function PlanFeatures({ plan }: { plan: SubsPlan }) {
  const features = plan.features ?? [];
  console.log('plan: ', plan)
  return (
    <ul className="space-y-3.5 text-sm text-slate-700 mb-8">
      {features.map((feature) => (
        <li key={feature.nanoid} className="flex items-start gap-3">
          <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <div>
            <span className="block">{feature.label}</span>
            {feature.description ? (
              <span className="block text-xs text-slate-500">
                {feature.description}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PlanCard({
  plan,
  isTrial,
  isCurrent,
  subscription,
  workspaceDomain,
  referralCode,
}: {
  plan: SubsPlan;
  isTrial: boolean;
  isCurrent: boolean;
  subscription: CurrentSubscription | null;
  workspaceDomain: string;
  referralCode?: string;
}) {
  const [referralOpen, setReferralOpen] = useState(false);
  const trialDays = trialDaysLeft(subscription?.current_period_end);
  const periodEnd = subscription?.current_period_end;

  const cardClass = isTrial
    ? `bg-white border rounded-2xl p-8 flex flex-col justify-between transition-all duration-200 ${
        isCurrent
          ? 'border-primary-300 ring-2 ring-primary-500/20 shadow-md'
          : 'border-slate-200 shadow-xs hover:border-slate-300'
      }`
    : 'bg-white border-2 border-slate-900 rounded-2xl p-8 flex flex-col justify-between shadow-lg relative';

  return (
    <div
      id={isTrial ? 'plan-card-trial' : 'plan-card-paid'}
      className={cardClass}
    >
      {!isTrial && (
        <div className="absolute -top-3.5 right-6 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
          Uninterrupted Access
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <span
            className={`text-xs font-bold tracking-widest uppercase ${isTrial ? 'text-slate-500' : 'text-primary-600'}`}
          >
            {plan.label}
          </span>
          {isCurrent &&
            (isTrial ? (
              <span className="text-xs font-bold bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full border border-primary-100">
                Current Plan{trialDays != null ? ` (${trialDays}d left)` : ""}
              </span>
            ) : (
              <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                Current Active Plan
              </span>
            ))}
        </div>

        <p className="text-sm font-medium text-slate-600 mb-6">
          {plan.description}
        </p>

        {/* Price & Duration */}
        <div className="pb-6 mb-6 border-b border-slate-100">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 font-display">
              Ksh {plan.price != null
                ? Number(plan.price).toLocaleString()
                : 'Custom'}
            </span>
            {plan.price != null && (
              <span className="text-slate-500 text-sm font-medium">
                / month
              </span>
            )}
          </div>
          {isCurrent && periodEnd && (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mt-2">
              <Clock className="w-4 h-4 text-slate-400" />
              {isTrial ? 'Trial ends' : 'Renews'} {formatDate(periodEnd)}
            </div>
          )}
        </div>

        <PlanFeatures plan={plan} />
      </div>

      {isTrial ? (
        <>
          <VSButton
            id="btn-start-trial"
            onClick={() => {}}
            disabled={isCurrent}
            variant="primary"
            appearance="outline"
            size="lg"
            className="w-full"
          >
            {isCurrent ? 'Currently on Free Trial' : 'Start Free Trial →'}
          </VSButton>
          <button
            type="button"
            onClick={() => setReferralOpen(true)}
            className="mt-2 w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50 rounded-xl transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4" />
            Invite a friend, extend your trial
          </button>
          <ReferralModal
            isOpen={referralOpen}
            onClose={() => setReferralOpen(false)}
            referralCode={referralCode}
          />
        </>
      ) : (
        <VSButton
          id="btn-choose-paid"
          asChild
          variant="primary"
          appearance="solid"
          size="lg"
          className="w-full"
        >
          {isCurrent ? (
            <Link href={`/${workspaceDomain}/dashboard/billing`}>
              Manage Billing Details
            </Link>
          ) : (
            <Link
              href={`/${workspaceDomain}/dashboard/billing/plans/${plan.nanoid}`}
            >
              Choose Paid Plan →
            </Link>
          )}
        </VSButton>
      )}
    </div>
  );
}