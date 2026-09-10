import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepErrorProps {
  errorMessage: string;
  onRetry: () => void;
  onClose: () => void;
}

export function StepError({ errorMessage, onRetry, onClose }: StepErrorProps) {
  return (
    <div className="space-y-5 px-6 py-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-md">
        <AlertCircle className="h-10 w-10" />
      </div>
      <div className="space-y-1">
        <h4 className="text-lg font-bold text-slate-900">That didn&apos;t go through</h4>
        <p className="mx-auto max-w-md text-xs text-slate-500">
          We couldn&apos;t finish the connection. Give it another try — if it keeps happening, get in touch with support.
        </p>
        {errorMessage && (
          <p className="mx-auto mt-2 max-w-md rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 font-mono text-[10px] text-red-600">
            {errorMessage}
          </p>
        )}
      </div>
      <div className="flex items-center justify-center gap-3 pt-2">
        <Button
          onClick={onRetry}
          className="bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
        >
          Try again
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}