"use client";

import { Zap } from "lucide-react";

interface ComposeHeaderProps {
  step: 1 | 2;
  editPost: boolean;
}

export function ComposeHeader({ step, editPost }: ComposeHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Multi-Platform Campaign Composer
          </h2>
          <p className="text-xs text-slate-500">
            {editPost ? "Edit your scheduled post" : "Customize, schedule & cross-post across social networks"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {[
          { n: 1, label: "Compose" },
          { n: 2, label: "Customize per Platform" },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-3">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                step === s.n
                  ? "bg-indigo-600 text-white"
                  : step > s.n
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {step > s.n ? "\u2713" : s.n}
            </div>
            <span
              className={`text-xs font-semibold ${
                step === s.n ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {s.label}
            </span>
            {i === 0 && <div className="h-px w-8 bg-slate-200" />}
          </div>
        ))}
      </div>
    </div>
  );
}