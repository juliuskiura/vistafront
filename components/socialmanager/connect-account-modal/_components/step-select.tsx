import { ChevronRight } from "lucide-react";
import { SocialIcon, hasSocialIcon } from "@/components/social-icons";
import type { SocialPlatform } from "@/lib/api/types";
import type { PlatformOption } from "./platform-copy";

interface StepSelectProps {
  platforms: PlatformOption[];
  onSelect: (platform: SocialPlatform) => void;
}

export function StepSelect({ platforms, onSelect }: StepSelectProps) {
  if (platforms.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm font-semibold text-slate-700">No networks are ready to connect yet</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
          Ask your workspace administrator to switch on a network, then come back here to connect it.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[min(60vh,480px)] space-y-4 overflow-y-auto px-6 py-6">
      <div>
        <h4 className="text-sm font-bold text-slate-900">Choose a network</h4>
        <p className="mt-0.5 text-xs text-slate-500">
          Pick where your content lives. There&apos;s nothing technical to set up — just sign in when we ask you to.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {platforms.map((platform) => (
          <button
            key={platform.id}
            type="button"
            onClick={() => onSelect(platform.id)}
            className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${platform.bgColor} ${platform.borderColor}`}
              >
                {hasSocialIcon(platform.id) ? (
                  <SocialIcon name={platform.id} size={26} className={platform.color} />
                ) : (
                  <span className={`text-xs font-bold ${platform.color}`}>
                    {platform.id.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h5 className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
                  {platform.name}
                </h5>
                <p className="text-[11px] leading-snug text-slate-500">{platform.description}</p>
              </div>
              <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
              Connect
              <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}