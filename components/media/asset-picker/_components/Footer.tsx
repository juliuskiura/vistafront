"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Asset } from "@/lib/api/types";

interface FooterProps {
  selectedList: Asset[];
  isMulti: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function Footer({ selectedList, isMulti, onConfirm, onCancel, disabled }: FooterProps) {
  return (
    <div className="flex items-center justify-end gap-2 border-t px-5 py-3 shrink-0">
      {isMulti && selectedList.length > 0 && (
        <div className="mr-auto flex items-center gap-2">
          <Badge variant="secondary">{selectedList.length} selected</Badge>
        </div>
      )}
      <Button variant="outline" onClick={onCancel} disabled={disabled}>
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        disabled={disabled || (isMulti ? selectedList.length === 0 : selectedList.length !== 1)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        {isMulti ? `Select ${selectedList.length}` : "Select"}
      </Button>
    </div>
  );
}