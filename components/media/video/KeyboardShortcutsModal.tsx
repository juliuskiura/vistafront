"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { VSButton } from "@/components/shared/components/customUi/VSButton";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fpsKnown: boolean;
}

export function KeyboardShortcutsModal({ isOpen, onClose, fpsKnown }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" || e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Press ? or Escape to close</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 font-mono text-xs">
          <div className="flex justify-between rounded bg-muted px-3 py-1.5"><span className="text-muted-foreground">Play / Pause</span><span className="text-foreground">Space / K</span></div>
          <div className="flex justify-between rounded bg-muted px-3 py-1.5"><span className="text-muted-foreground">Seek ±5s</span><span className="text-foreground">← / →</span></div>
          <div className="flex justify-between rounded bg-muted px-3 py-1.5"><span className="text-muted-foreground">Seek ±10s</span><span className="text-foreground">J / L</span></div>
          <div className="flex justify-between rounded bg-muted px-3 py-1.5"><span className="text-muted-foreground">Seek ±1s</span><span className="text-foreground">Shift + ← / →</span></div>
          <div className="flex justify-between rounded bg-muted px-3 py-1.5"><span className="text-muted-foreground">Volume</span><span className="text-foreground">↑ / ↓</span></div>
          <div className="flex justify-between rounded bg-muted px-3 py-1.5"><span className="text-muted-foreground">Mute</span><span className="text-foreground">M</span></div>
          <div className="flex justify-between rounded bg-muted px-3 py-1.5"><span className="text-muted-foreground">Fullscreen</span><span className="text-foreground">F</span></div>
          <div className="flex justify-between rounded bg-muted px-3 py-1.5"><span className="text-muted-foreground">Theater Mode</span><span className="text-foreground">T</span></div>
          <div className="flex justify-between rounded bg-muted px-3 py-1.5"><span className="text-muted-foreground">Picture in Picture</span><span className="text-foreground">P</span></div>
          <div className="flex justify-between rounded bg-muted px-3 py-1.5"><span className="text-muted-foreground">Seek Modal</span><span className="text-foreground">S</span></div>
          <div className="flex justify-between rounded bg-muted px-3 py-1.5"><span className="text-muted-foreground">Jump to %</span><span className="text-foreground">0-9</span></div>
          {fpsKnown && (
            <>
              <div className="flex justify-between rounded bg-muted px-3 py-1.5"><span className="text-muted-foreground">Step -1 Frame</span><span className="text-foreground">,</span></div>
              <div className="flex justify-between rounded bg-muted px-3 py-1.5"><span className="text-muted-foreground">Step +1 Frame</span><span className="text-foreground">.</span></div>
            </>
          )}
          <div className="flex justify-between rounded bg-muted px-3 py-1.5"><span className="text-muted-foreground">Double-click left</span><span className="text-foreground">-10s</span></div>
          <div className="flex justify-between rounded bg-muted px-3 py-1.5"><span className="text-muted-foreground">Double-click right</span><span className="text-foreground">+10s</span></div>
          <div className="flex justify-between rounded bg-muted px-3 py-1.5"><span className="text-muted-foreground">Close</span><span className="text-foreground">Esc / ?</span></div>
        </div>
        <DialogClose asChild>
          <VSButton appearance="ghost" className="w-full mt-4">Close</VSButton>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
