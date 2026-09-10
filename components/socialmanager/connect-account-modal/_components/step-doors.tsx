import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocialIcon } from "@/components/social-icons";

interface StepDoorsProps {
  onBack: () => void;
  onFacebookConnect: () => void;
}

export function StepDoors({ onBack, onFacebookConnect }: StepDoorsProps) {
  return (
    <div className="max-h-[min(60vh,480px)] space-y-5 overflow-y-auto px-6 py-6">
      <div>
        <h4 className="text-sm font-bold text-slate-900">Connect Instagram</h4>
        <p className="mt-0.5 text-xs text-slate-500">
          Instagram signs in through Facebook on this plan. Choose how you&apos;d like to continue.
        </p>
      </div>

      <div className="space-y-3.5">
        <Button
          variant="outline"
          className="h-auto w-full cursor-pointer justify-start gap-4 p-4 text-left"
          onClick={onFacebookConnect}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50">
            <SocialIcon name="facebook" size={24} className="text-indigo-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h5 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
                Log in with Facebook
              </h5>
              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Recommended
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Uses your Facebook login to bring in the Instagram account linked to your page — usually the quickest way.
            </p>
          </div>
        </Button>

        <div className="flex cursor-not-allowed gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 opacity-70">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-pink-200 bg-pink-50">
            <SocialIcon name="instagram" size={24} className="text-pink-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h5 className="text-sm font-bold text-slate-500">Connect Instagram directly</h5>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                <Clock className="h-3 w-3" /> Coming soon
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Sign in with the Instagram account itself, no Facebook needed. Not available just yet.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end border-t border-slate-100 pt-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}