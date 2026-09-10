import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepSuccessProps {
  platformName: string;
  onClose: () => void;
}

export function StepSuccess({ platformName, onClose }: StepSuccessProps) {
  return (
    <div className="space-y-5 px-6 py-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-md">
        <CheckCircle2 className="h-10 w-10" />
      </div>
      <div className="space-y-1">
        <h4 className="text-lg font-bold text-slate-900">You&apos;re connected!</h4>
        <p className="mx-auto max-w-md text-xs text-slate-500">
          Your {platformName} account is ready to go. Start a new post and pick it as your destination.
        </p>
      </div>
      <div className="pt-2">
        <Button
          onClick={onClose}
          className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
        >
          Done
        </Button>
      </div>
    </div>
  );
}