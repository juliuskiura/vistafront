"use client";

import { useState } from "react";
import { X, Gift, Link2, UserPlus, Clock, Coins } from "lucide-react";
import { VSButton } from "@/components/shared/components/customUi/VSButton";

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode?: string;
  onInviteColleagues?: () => void;
}

function Step({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-3 px-2">
      <span className="text-secondary-600">{icon}</span>
      <span className="text-[11px] font-semibold leading-tight text-slate-700">
        {title}
      </span>
    </div>
  );
}

const STEPS = [
  { icon: <Link2 className="w-4 h-4" />, title: "Share your link" },
  { icon: <UserPlus className="w-4 h-4" />, title: "They join" },
  { icon: <Clock className="w-4 h-4" />, title: "Your trial grows" },
];

export function ReferralModal({
  isOpen,
  onClose,
  referralCode,
  onInviteColleagues,
}: ReferralModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const referralLink = referralCode ? `https://${referralCode}` : "";

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrimary = () => {
    if (referralLink) {
      handleCopy();
    } else {
      onInviteColleagues?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="referral-modal"
        className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center relative"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Reward icon */}
        <div className="w-14 h-14 bg-gradient-to-br from-secondary-500 to-secondary-700 border border-secondary-300 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-md">
          <Gift className="w-7 h-7" />
        </div>

        {/* Offering */}
        <span className="text-[11px] font-bold uppercase tracking-widest text-secondary-600">
          Refer &amp; extend
        </span>
        <h2 className="mt-1.5 text-2xl font-extrabold text-slate-900 font-display leading-snug">
          Invite your team. Extend your trial.
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Share your link with a colleague. When they join, you get more trial
          time — and Ksh 500 when they upgrade to a paid plan.
        </p>

        {/* How it works */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          {STEPS.map((step, index) => (
            <Step key={index} {...step} />
          ))}
        </div>

        {/* Rewards */}
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-left text-xs space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            What you get
          </p>
          <div className="flex items-center justify-between gap-2 rounded-lg bg-amber-50 border border-dashed border-amber-400 px-2.5 py-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              When your invitee upgrades to paid
            </span>
            <span className="shrink-0 rounded-md bg-amber-400 px-2.5 py-1 text-sm font-extrabold text-amber-950 shadow-sm">
              Ksh 500
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary-600" />
              More trial time
            </span>
            <span className="text-slate-500">per signup</span>
          </div>
          <p className="pt-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            What your invitee gets
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-slate-800">
              Full-access account
            </span>
            <span className="text-slate-500">the genuine product</span>
          </div>
        </div>

        {/* Referral link */}
        {referralCode && (
          <div className="mt-6 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary-600">
              Your personal link
            </p>
            <div className="mt-1.5 flex items-center gap-2 bg-slate-50 border border-secondary-200 rounded-xl p-1.5 pl-3">
              <span className="text-xs font-mono text-slate-600 truncate flex-1">
                {referralCode}
              </span>
              <button
                onClick={handleCopy}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-secondary-600 text-secondary-50 hover:bg-secondary-700"
                }`}
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 space-y-2.5">
          <VSButton
            id="copy-my-referral-btn"
            onClick={handlePrimary}
            variant="secondary"
            size="lg"
            className="w-full"
          >
            {referralLink ? (
              copied ? (
                "Link Copied!"
              ) : (
                "Copy My Referral Link"
              )
            ) : (
              "Invite a Colleague"
            )}
          </VSButton>
          <button
            id="referral-maybe-later-btn"
            onClick={onClose}
            className="w-full py-2.5 px-4 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors cursor-pointer"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}