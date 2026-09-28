import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocialIcon, hasSocialIcon } from "@/components/social-icons";
import type { PlatformDoor } from "./platform-copy";

interface StepDoorsProps {
  destinationName: string;
  doors: PlatformDoor[];
  onBack: () => void;
  onSelectDoor: (door: PlatformDoor) => void;
}

/**
 * The "which way do you want to sign in?" step.
 *
 * Every entry is one platform row that lands on the same destination, rendered
 * with the branding of the platform that launches the dialog
 * (`door.dialog`) — so the Facebook door shows a Facebook icon. The first
 * available door is the recommended one; doors whose platform row is not
 * deployed yet (`door.available === false`) stay listed but cannot be clicked.
 */
export function StepDoors({ destinationName, doors, onBack, onSelectDoor }: StepDoorsProps) {
  const available = doors.filter((d) => d.available);
  const recommendedId = available[0]?.id;

  return (
    <div className="max-h-[min(60vh,480px)] space-y-5 overflow-y-auto px-6 py-6">
      <div>
        <h4 className="text-sm font-bold text-slate-900">Connect {destinationName}</h4>
        <p className="mt-0.5 text-xs text-slate-500">
          {destinationName} can be connected through more than one network. Choose how you&apos;d like to continue.
        </p>
      </div>

      <div className="space-y-3.5">
        {doors.map((door) => {
          const icon = hasSocialIcon(door.dialog) ? (
            <SocialIcon name={door.dialog} size={24} className={door.color} />
          ) : (
            <span className={`text-xs font-bold ${door.color}`}>{door.dialog.slice(0, 2).toUpperCase()}</span>
          );

          if (!door.available) {
            return (
              <div
                key={door.id}
                className="flex cursor-not-allowed gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 opacity-70"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${door.borderColor} ${door.bgColor}`}
                >
                  {icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-sm font-bold text-slate-500">Connect with {door.dialogName}</h5>
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      <Clock className="h-3 w-3" /> Coming soon
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                    Sign in with {door.dialogName} itself, no {door.name} setup needed. Not available just yet.
                  </p>
                </div>
              </div>
            );
          }

          return (
            <Button
              key={door.id}
              variant="outline"
              className="h-auto w-full cursor-pointer justify-start gap-4 p-4 text-left"
              onClick={() => onSelectDoor(door)}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${door.borderColor} ${door.bgColor}`}
              >
                {icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-primary-600">
                    Log in with {door.dialogName}
                  </h5>
                  {door.id === recommendedId && (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  Uses your {door.dialogName} login to bring in the {destinationName} account linked to it — usually the
                  quickest way.
                </p>
              </div>
            </Button>
          );
        })}
      </div>

      <div className="flex items-center justify-end border-t border-slate-100 pt-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}
