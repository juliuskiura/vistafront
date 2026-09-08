"use client";

import { ImagePlus } from "lucide-react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  isMulti: boolean;
  selectedCount: number;
}

export function Header({ title, isMulti, selectedCount }: HeaderProps) {
  return (
    <DialogHeader className="bg-indigo-600 px-5 py-4 shrink-0">
      <DialogTitle className="text-white flex items-center gap-2">
        <ImagePlus size={18} />
        {title}
        {isMulti && selectedCount > 0 && (
          <Badge variant="secondary" className="ml-2">
            {selectedCount} selected
          </Badge>
        )}
      </DialogTitle>
    </DialogHeader>
  );
}