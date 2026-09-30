"use client";

import { useState } from "react";
import { Check, Copy } from "@/lib/icons";

/**
 * A read-only value with a copy button, for the strings an operator has to paste
 * into the Meta developer console.
 *
 * The whole point of this screen is that the correct callback URL and App ID are
 * values this app computed and Meta will not tell you back. Asking the operator
 * to select-and-copy a long URL out of a paragraph is how a trailing slash goes
 * missing and the handshake fails with no explanation — so the value is a
 * selectable one-liner next to the button, never wrapped inside prose.
 */
export function CopyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      // Reverts on its own: this is confirmation, not state the operator needs to
      // manage, and a button stuck on "Copied" reads as a disabled control.
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be denied. The value is on screen and selectable,
      // so failing quietly is better than an error the operator cannot act on.
    }
  }

  return (
    <div className="mt-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <div className="mt-1 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 select-all">
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : `Copy ${label}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
