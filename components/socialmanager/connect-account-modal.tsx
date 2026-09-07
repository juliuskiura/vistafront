"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, CheckCircle2, AlertCircle, Loader2, ExternalLink, Building2, Camera, Clock } from "lucide-react";
import type { SocialPlatform, SocialMediaPlatform } from "@/lib/api/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { oauthInitAction } from "@/app/(app)/[workspace]/dashboard/socialmanager/actions";
import type { PlatformActionState } from "@/app/(app)/[workspace]/dashboard/socialmanager/action-state";

interface ConnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (platform: SocialPlatform) => void;
  workspaceDomain: string;
  platforms: SocialMediaPlatform[];
  preselectedPlatform?: SocialPlatform;
  rerequest?: boolean;
}

interface PlatformOption {
  id: SocialPlatform;
  name: string;
  category: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const PLATFORM_META: Record<string, Omit<PlatformOption, "id" | "name">> = {
  instagram: {
    category: "Meta Graph API",
    color: "from-pink-500 via-purple-500 to-indigo-500",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    description: "Publish Feed Posts, Stories, Carousels, and Reels.",
  },
  x: {
    category: "X API v2.0",
    color: "from-sky-500 to-blue-600",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    description: "Schedule Tweets, threads, and media attachments.",
  },
  linkedin: {
    category: "LinkedIn Community API",
    color: "from-blue-600 to-indigo-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    description: "Publish articles and updates to company pages or profiles.",
  },
  facebook: {
    category: "Meta Graph API",
    color: "from-indigo-600 to-blue-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    description: "Schedule page updates, videos, and campaign posts.",
  },
  tiktok: {
    category: "TikTok Content Posting API",
    color: "from-slate-900 to-slate-950",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-300",
    description: "Publish short-form videos with captions and settings.",
  },
  pinterest: {
    category: "Pinterest API v5",
    color: "from-rose-600 to-red-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    description: "Create Product Pins and schedule images to Boards.",
  },
  youtube: {
    category: "Google YouTube Data API v3",
    color: "from-red-600 to-rose-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    description: "Upload videos, Shorts, and community posts.",
  },
  threads: {
    category: "Meta Threads API",
    color: "from-zinc-800 to-black",
    bgColor: "bg-zinc-100",
    borderColor: "border-zinc-300",
    description: "Share text updates, images, and links.",
  },
};

const PLATFORM_INITIALS: Record<string, string> = {
  instagram: "IG",
  x: "X",
  linkedin: "LI",
  facebook: "FB",
  tiktok: "TT",
  pinterest: "PI",
  youtube: "YT",
  threads: "TH",
  bluesky: "BS",
  mastodon: "MA",
  google_business: "GB",
  start_page: "SP",
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "text-pink-600",
  x: "text-sky-500",
  linkedin: "text-blue-600",
  facebook: "text-indigo-600",
  tiktok: "text-slate-900",
  pinterest: "text-rose-600",
  youtube: "text-red-600",
  threads: "text-zinc-900",
  bluesky: "text-sky-700",
  mastodon: "text-purple-600",
  google_business: "text-blue-600",
  start_page: "text-slate-600",
};

export default function ConnectAccountModal({
  isOpen,
  onClose,
  onConnected,
  workspaceDomain,
  platforms,
  preselectedPlatform,
  rerequest,
}: ConnectAccountModalProps) {
  const [step, setStep] = useState<"select" | "doors" | "connecting" | "success" | "error">(
    preselectedPlatform === "instagram" ? "doors" : "select",
  );
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>(preselectedPlatform || "facebook");
  const [errorMessage, setErrorMessage] = useState("");
  const popupRef = useRef<Window | null>(null);
  const listenerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const messageReceivedRef = useRef(false);

  const [oauthLoading, setOauthLoading] = useState(false);

  const PLATFORMS: PlatformOption[] = platforms
    .filter((p) => p.is_active)
    .map((p) => {
      const meta = PLATFORM_META[p.slug];
      return {
        id: p.slug as SocialPlatform,
        name: p.name,
        category: meta?.category ?? p.slug,
        description: meta?.description ?? `Connect your ${p.name} account.`,
        color: meta?.color ?? "from-slate-600 to-slate-800",
        bgColor: meta?.bgColor ?? "bg-slate-50",
        borderColor: meta?.borderColor ?? "border-slate-200",
      };
    });

  useEffect(() => {
    return () => {
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      if (listenerRef.current) {
        window.removeEventListener("message", listenerRef.current);
      }
    };
  }, []);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (!("success" in data && "platform" in data)) return;

      const { success, platform, error } = data as {
        success: boolean;
        platform: string;
        error?: string;
      };

      messageReceivedRef.current = true;

      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      popupRef.current = null;

      if (success) {
        onConnected(platform as SocialPlatform);
      } else {
        setErrorMessage(error || "Authorization failed");
        setStep("error");
      }
    },
    [onConnected],
  );

  useEffect(() => {
    if (step === "connecting") {
      messageReceivedRef.current = false;
      const handler = (event: MessageEvent) => handleMessage(event);
      listenerRef.current = handler;
      window.addEventListener("message", handler);
      const poll = window.setInterval(() => {
        if (messageReceivedRef.current) return;
        const popup = popupRef.current;
        if (popup && popup.closed) {
          popupRef.current = null;
          onConnected(selectedPlatform);
        }
      }, 600);
      return () => {
        window.removeEventListener("message", handler);
        window.clearInterval(poll);
      };
    }
  }, [step, handleMessage, onConnected, selectedPlatform]);

  const handleSelectPlatform = useCallback(
    async (platform: SocialPlatform, route?: string) => {
      setSelectedPlatform(platform);
      setStep("connecting");
      setErrorMessage("");
      setOauthLoading(true);

      try {
        const result = await oauthInitAction({ platform: platform as string, method: route, rerequest }, workspaceDomain);
        if ("error" in result) {
          setErrorMessage(result.error || "Failed to start OAuth.");
          setStep("error");
          setOauthLoading(false);
          return;
        }

        const authUrl = result.auth_url || "";
        const popup = window.open(authUrl, "oauth-popup", "width=600,height=700,left=200,top=100");

        if (!popup) {
          setErrorMessage("Popup blocked. Please allow popups for this site.");
          setStep("error");
          setOauthLoading(false);
          return;
        }

        popupRef.current = popup;
        setOauthLoading(false);
      } catch (err: any) {
        setErrorMessage(err?.data?.error || err?.error || "Failed to start OAuth. Check platform configuration.");
        setStep("error");
        setOauthLoading(false);
      }
    },
    [oauthInitAction, workspaceDomain, rerequest],
  );

  const handlePlatformClick = useCallback(
    (platform: SocialPlatform) => {
      if (platform === "instagram") {
        setSelectedPlatform(platform);
        setStep("doors");
        return;
      }
      handleSelectPlatform(platform);
    },
    [handleSelectPlatform],
  );

  const handleRetry = () => {
    setStep("select");
    setErrorMessage("");
  };

  if (!isOpen) return null;

  const currentPlatformInfo = PLATFORMS.find((p) => p.id === selectedPlatform) || PLATFORMS[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-bold text-lg text-slate-900 leading-tight">
                Connect Social Media Account
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">OAuth 2.0 Secure Channel Integration</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span
            className={`flex items-center gap-1.5 ${
              step === "select" || step === "doors" ? "text-indigo-600" : step === "success" ? "text-emerald-600" : "text-slate-500"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === "select" || step === "doors"
                  ? "bg-indigo-600 text-white"
                  : step === "success"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-600"
              }`}
            >
              {step === "success" ? <CheckCircle2 className="w-3 h-3" /> : "1"}
            </span>
            Select Platform
          </span>
          <span className="h-px flex-1 bg-slate-300" />
          <span
            className={`flex items-center gap-1.5 ${
              step === "connecting" ? "text-indigo-600" : step === "success" ? "text-emerald-600" : "text-slate-400"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === "connecting"
                  ? "bg-indigo-600 text-white animate-pulse"
                  : step === "success"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-400"
              }`}
            >
              {step === "success" ? <CheckCircle2 className="w-3 h-3" /> : step === "connecting" ? <Loader2 className="w-3 h-3 animate-spin" /> : "2"}
            </span>
            Authorize
          </span>
          <span className="h-px flex-1 bg-slate-300" />
          <span className={`flex items-center gap-1.5 ${step === "success" ? "text-emerald-600" : "text-slate-400"}`}>
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === "success" ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-400"
              }`}
            >
              {step === "success" ? <CheckCircle2 className="w-3 h-3" /> : "3"}
            </span>
            Connected
          </span>
        </div>

        {step === "select" && (
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Choose a Social Platform</h4>
              <p className="text-xs text-slate-500">Select a platform to connect. You'll authorize via OAuth in a popup.</p>
            </div>

            {PLATFORMS.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                No social platforms are configured yet. Ask a workspace admin to enable a platform first.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {PLATFORMS.map((platform) => (
                  <Button
                    key={platform.id}
                    variant="outline"
                    className="h-auto p-4 justify-start text-left group cursor-pointer flex flex-col gap-3"
                    onClick={() => handlePlatformClick(platform.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${platform.bgColor} border ${platform.borderColor}`}>
                          <span className={`text-[10px] font-bold ${PLATFORM_COLORS[platform.id] || "text-slate-600"}`}>
                            {PLATFORM_INITIALS[platform.id] || platform.id.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {platform.name}
                          </h5>
                          <span className="text-[10px] text-slate-500 font-mono block">{platform.category}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">{platform.description}</p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> OAuth 2.0
                      </span>
                      <span className="text-[10px] text-indigo-600 font-semibold group-hover:underline flex items-center gap-0.5">
                        Connect <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "doors" && (
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Connect Instagram</h4>
              <p className="text-xs text-slate-500">Instagram has two ways in. Choose how you'd like to connect.</p>
            </div>

            <div className="space-y-3.5">
              <Button
                variant="outline"
                className="w-full h-auto p-4 justify-start text-left group cursor-pointer flex gap-4"
                onClick={() => handleSelectPlatform("instagram", "facebook_page")}
              >
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 shrink-0">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Through your Facebook Page
                    </h5>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold shrink-0">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                    Authorize with your Facebook login. Instagram Business accounts linked to the Pages you control connect
                    automatically.
                  </p>
                  <span className="text-[10px] text-indigo-600 font-semibold group-hover:underline mt-2 inline-flex items-center gap-0.5">
                    Continue with Facebook <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </Button>

              <div className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 opacity-70 flex gap-4 cursor-not-allowed">
                <div className="p-3 rounded-xl bg-pink-50 border border-pink-100 shrink-0">
                  <Camera className="w-5 h-5 text-pink-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-sm font-bold text-slate-500">Connect Instagram directly</h5>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Coming soon
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                    Log in with the Instagram account itself, no Facebook Page required. Not available yet.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={() => setStep("select")}>
                Back
              </Button>
            </div>
          </div>
        )}

        {step === "connecting" && (
          <div className="p-12 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-md">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">Connecting to {currentPlatformInfo?.name}</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                A popup opened for you to authorize. Complete the authorization there — this window will update
                automatically when connected.
              </p>
              <p className="text-xs text-slate-400">Make sure popups are not blocked.</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
                setStep("select");
              }}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Cancel
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">Account Successfully Connected!</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Your {currentPlatformInfo?.name} account has been linked to your workspace.
              </p>
            </div>
            <div className="pt-2">
              <Button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
                Done
              </Button>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-md">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">Connection Failed</h4>
              <p className="text-xs text-red-600 max-w-md mx-auto bg-red-50 rounded-lg px-4 py-2 border border-red-200">
                {errorMessage}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button onClick={handleRetry} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
                Try Again
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
