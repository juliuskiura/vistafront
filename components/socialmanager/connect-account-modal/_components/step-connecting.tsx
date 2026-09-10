import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepConnectingProps {
  platformName: string;
  onCancel: () => void;
}

export function StepConnecting({ platformName, onCancel }: StepConnectingProps) {
  return (
    <div className="space-y-5 px-6 py-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-md">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
      <div className="space-y-1">
        <h4 className="text-lg font-bold text-slate-900">Finish signing in on {platformName}</h4>
        <p className="mx-auto max-w-md text-xs text-slate-500">
          A sign-in window for {platformName} just opened. Complete it there, then come back — we&apos;ll do the rest.
        </p>
        <p className="text-xs text-slate-400">
          Don&apos;t see the window? Allow pop-ups for this site and try again.
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        className="text-xs text-slate-500 underline hover:text-slate-700"
      >
        Cancel
      </Button>
    </div>
  );
}