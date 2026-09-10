import { X, Link2 } from "lucide-react";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Fab } from "@/components/ui/fab";
import { SocialIcon, hasSocialIcon } from "@/components/social-icons";
import type { PlatformOption } from "./platform-copy";

interface ModalHeaderProps {
  platform?: PlatformOption | null;
  onClose: () => void;
}

export function ModalHeader({ platform, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-xs">
          {platform && hasSocialIcon(platform.id) ? (
            <SocialIcon name={platform.id} size={20} className={platform.color} />
          ) : (
            <Link2 className="h-5 w-5 text-indigo-600" />
          )}
        </div>
        <div>
          <DialogTitle className="text-lg font-bold leading-tight text-slate-900">
            Connect an account
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-xs text-slate-500">
            Choose a network and sign in — we&apos;ll take care of the rest.
          </DialogDescription>
        </div>
      </div>
      <Fab
        size="sm"
        variant="outline"
        onClick={onClose}
        aria-label="Close connect account dialog"
        className="shrink-0"
      >
        <X />
      </Fab>
    </div>
  );
}