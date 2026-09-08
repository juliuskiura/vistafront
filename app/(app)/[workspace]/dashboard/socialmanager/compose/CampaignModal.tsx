"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initialCampaignState, type CampaignActionState } from "../action-state";

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
  newCampaignName: string;
  setNewCampaignName: (name: string) => void;
  newCampaignDesc: string;
  setNewCampaignDesc: (desc: string) => void;
  campaignAction: CampaignActionState;
  setCampaignAction: React.Dispatch<React.SetStateAction<CampaignActionState>>;
}

export function CampaignModal({
  isOpen,
  onClose,
  onCreate,
  newCampaignName,
  setNewCampaignName,
  newCampaignDesc,
  setNewCampaignDesc,
  campaignAction,
  setCampaignAction,
}: CampaignModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-sm font-bold text-slate-900">Create Campaign</h3>
        {campaignAction.status === "error" && campaignAction.message && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{campaignAction.message}</span>
          </div>
        )}
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Name</label>
            <input
              type="text"
              value={newCampaignName}
              onChange={(e) => setNewCampaignName(e.target.value)}
              placeholder="Campaign name"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Description (optional)</label>
            <input
              type="text"
              value={newCampaignDesc}
              onChange={(e) => setNewCampaignDesc(e.target.value)}
              placeholder="Brief description"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            onClick={() => {
              onClose();
              setCampaignAction(initialCampaignState);
            }}
            variant="outline"
            size="sm"
          >
            Cancel
          </Button>
          <Button onClick={onCreate} disabled={!newCampaignName.trim()} size="sm">
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}