import { Check, Loader2 } from "lucide-react";
import type { ConnectStep } from "../ConnectAccountModal";

interface StepIndicatorProps {
  step: ConnectStep;
}

const STEP_LABELS = ["Choose a network", "Sign in", "You're connected"];

const STEP_INDEX: Record<ConnectStep, number> = {
  select: 1,
  doors: 1,
  connecting: 2,
  error: 1,
  success: 3,
};

export function StepIndicator({ step }: StepIndicatorProps) {
  const current = STEP_INDEX[step];

  return (
    <ol className="flex items-center gap-2 border-b border-slate-200 bg-slate-100/70 px-6 py-3">
      {STEP_LABELS.map((label, index) => {
        const stepNo = index + 1;
        const done = stepNo < current;
        const active = stepNo === current;
        return (
          <li
            key={label}
            className={`flex items-center gap-2 ${index > 0 ? "flex-1" : ""}`}
          >
            {index > 0 && (
              <span
                className={`h-px flex-1 ${
                  done ? "bg-emerald-400" : active ? "bg-indigo-300" : "bg-slate-300"
                }`}
              />
            )}
            <span
              className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                active ? "text-indigo-600" : done ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  done
                    ? "bg-emerald-600 text-white"
                    : active
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {done ? (
                  <Check className="h-3 w-3" />
                ) : active && step === "connecting" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  stepNo
                )}
              </span>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}