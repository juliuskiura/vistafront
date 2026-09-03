"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  CheckCircle2,
  Zap,
  ExternalLink,
  Loader2,
  AlertCircle,
  Building2,
  Camera,
  Clock,
} from "lucide-react";
import type { SocialMediaPlatform } from "@/lib/api/types";
import { oauthInitAction } from "../actions";
import {
  hasSocialIcon,
  SocialIcon,
} from "@/components/social-icons";
import { getPlatformStyle } from "@/components/platform-icon";

/* ──────────────────────────────────────────────────────────────────────
 * ConnectAccountModal
 *
 * Multi-step OAuth flow: platform select → (Instagram doors) → popup → success/error.
 * Mirrors the frontapp ConnectAccountModal faithfully.
 * ────────────────────────────────────────────────────────────────────── */

const PLATFORM_META: Record<
  string,
  { category: string; description: string; color: string; bgColor: string; borderColor: string }
> = {
  instagram: {
    category: "Meta Graph API",
    description: "Publish Feed Posts, Stories, Carousels, and Reels.",
    color: "from-pink-500 via-purple-500 to-indigo-500",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
  },
  x: {
    category: "X API v2.0",
    description: "Schedule Tweets, threads, and media attachments.",
    color: "from-sky-500 to-blue-600",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
  },
  linkedin: {
    category: "LinkedIn Community API",
    description: "Publish articles and updates to company pages or profiles.",
    color: "from-blue-600 to-indigo-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  facebook: {
    category: "Meta Graph API",
    description: "Schedule page updates, videos, and campaign posts.",
    color: "from-indigo-600 to-blue-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  tiktok: {
    category: "TikTok Content Posting API",
    description: "Publish short-form videos with captions and settings.",
    color: "from-slate-900 to-slate-950",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-300",
  },
  pinterest: {
    category: "Pinterest API v5",
    description: "Create Product Pins and schedule images to Boards.",
    color: "from-rose-600 to-red-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
  },
  youtube: {
    category: "Google YouTube Data API v3",
    description: "Upload videos, Shorts, and community posts.",
    color: "from-red-600 to-rose-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  threads: {
    category: "Meta Threads API",
    description: "Share text updates, images, and links.",
    color: "from-zinc-800 to-black",
    bgColor: "bg-zinc-100",
    borderColor: "border-zinc-300",
  },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
  workspaceDomain: string;
}

export function ConnectAccountModal({ isOpen, onClose, onConnected, workspaceDomain }: Props) {
  const router = useRouter();
  const ws = workspaceDomain.toLowerCase();

  type Step = "select" | "doors" | "connecting" | "success" | "error";
  const [step, setStep] = useState<Step>("select");
  const [selectedPlatform, setSelectedPlatform] = useState("facebook");
  const [errorMessage, setErrorMessage] = useState("");
  const popupRef = useRef<Window | null>(null);
  const listenerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const messageReceivedRef = useRef(false);

  const platformOptions = Object.entries(PLATFORM_META).map(([slug, meta]) => ({
    id: slug,
    name: getPlatformStyle(slug).label,
    ...meta,
  }));

  useEffect(() => {
    return () => {
      if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
      if (listenerRef.current) window.removeEventListener("message", listenerRef.current);
    };
  }, []);

  const handleConnectedCallback = useCallback(
    (_platform: string) => {
      setStep("success");
      onConnected();
    },
    [onConnected],
  );

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (!("success" in data && "platform" in data)) return;

      const { success, error } = data as { success: boolean; platform: string; error?: string };
      messageReceivedRef.current = true;

      if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
      popupRef.current = null;

      if (success) {
        handleConnectedCallback(data.platform);
      } else {
        setErrorMessage(error || "Authorization failed");
        setStep("error");
      }
    },
    [handleConnectedCallback],
  );

  useEffect(() => {
    if (step !== "connecting") return;
    messageReceivedRef.current = false;
    const handler = (event: MessageEvent) => handleMessage(event);
    listenerRef.current = handler;
    window.addEventListener("message", handler);

    const poll = window.setInterval(() => {
      if (messageReceivedRef.current) return;
      const popup = popupRef.current;
      if (popup && popup.closed) {
        popupRef.current = null;
        handleConnectedCallback(selectedPlatform);
      }
    }, 600);

    return () => {
      window.removeEventListener("message", handler);
      window.clearInterval(poll);
    };
  }, [step, handleMessage, handleConnectedCallback, selectedPlatform]);

  const startOAuth = useCallback(
    async (platform: string, method?: string) => {
      setSelectedPlatform(platform);
      setStep("connecting");
      setErrorMessage("");
      try {
        const res = await oauthInitAction({ platform, method }, ws);
        if ("error" in res) {
          setErrorMessage(res.error);
          setStep("error");
          return;
        }
        const popup = window.open(res.auth_url, "oauth-popup", "width=600,height=700,left=200,top=100");
        if (!popup) {
          setErrorMessage("Popup blocked. Please allow popups for this site.");
          setStep("error");
          return;
        }
        popupRef.current = popup;
      } catch {
        setErrorMessage("Failed to start OAuth. Check platform configuration.");
        setStep("error");
      }
    },
    [ws],
  );

  const handlePlatformClick = useCallback(
    (platform: string) => {
      if (platform === "instagram") {
        setSelectedPlatform(platform);
        setStep("doors");
        return;
      }
      startOAuth(platform);
    },
    [startOAuth],
  );

  if (!isOpen) return null;

  const currentInfo = platformOptions.find((p) => p.id === selectedPlatform) ?? platformOptions[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 leading-tight">
                Connect Social Media Account
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                OAuth 2.0 Secure Channel Integration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span
            className={`flex items-center gap-1.5 ${
              step === "select" || step === "doors"
                ? "text-indigo-600"
                : step === "success"
                  ? "text-emerald-600"
                  : "text-slate-500"
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
              {step === "success" ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                "1"
              )}
            </span>
            Select Platform
          </span>
          <span className="h-px flex-1 bg-slate-300" />
          <span
            className={`flex items-center gap-1.5 ${
              step === "connecting"
                ? "text-indigo-600"
                : step === "success"
                  ? "text-emerald-600"
                  : "text-slate-400"
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
              {step === "success" ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : step === "connecting" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "2"
              )}
            </span>
            Authorize
          </span>
          <span className="h-px flex-1 bg-slate-300" />
          <span
            className={`flex items-center gap-1.5 ${
              step === "success" ? "text-emerald-600" : "text-slate-400"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === "success"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-200 text-slate-400"
              }`}
            >
              {step === "success" ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                "3"
              )}
            </span>
            Connected
          </span>
        </div>

        {step === "select" && (
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">
                Choose a Social Platform
              </h4>
              <p className="text-xs text-slate-500">
                Select a platform to connect. You&apos;ll authorize via OAuth in a
                popup.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {platformOptions.map((platform) => {
                const style = getPlatformStyle(platform.id);
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => handlePlatformClick(platform.id)}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all text-left group cursor-pointer flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-xl ${platform.bgColor} border ${platform.borderColor}`}
                        >
                          {hasSocialIcon(platform.id) ? (
                            <SocialIcon
                              name={platform.id}
                              className={`h-4 w-4 ${style.color}`}
                            />
                          ) : (
                            <PlatformGlyph platform={platform.id} size="md" />
                          )}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {platform.name}
                          </h5>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {platform.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {platform.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> OAuth 2.0
                      </span>
                      <span className="text-[10px] text-indigo-600 font-semibold group-hover:underline flex items-center gap-0.5">
                        Connect{" "}
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === "doors" && (
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">
                Connect Instagram
              </h4>
              <p className="text-xs text-slate-500">
                Instagram has two ways in. Choose how you&apos;d like to connect.
              </p>
            </div>

            <div className="space-y-3.5">
              <button
                type="button"
                onClick={() => startOAuth("instagram", "facebook_page")}
                className="w-full p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all text-left group cursor-pointer flex gap-4"
              >
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 shrink-0">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Through your Facebook Page
                    </h5>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold shrink-0">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                    Authorize with your Facebook login. Instagram Business
                    accounts linked to the Pages you control connect
                    automatically.
                  </p>
                  <span className="text-[10px] text-indigo-600 font-semibold group-hover:underline mt-2 inline-flex items-center gap-0.5">
                    Continue with Facebook{" "}
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </button>

              <div className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 opacity-70 flex gap-4 cursor-not-allowed">
                <div className="p-3 rounded-xl bg-pink-50 border border-pink-100 shrink-0">
                  <Camera className="w-5 h-5 text-pink-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-sm font-bold text-slate-500">
                      Connect Instagram directly
                    </h5>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Coming soon
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                    Log in with the Instagram account itself, no Facebook Page
                    required. Not available yet.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep("select")}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {step === "connecting" && (
          <div className="p-12 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-md">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">
                Connecting to {currentInfo?.name ?? "platform"}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                A popup opened for you to authorize. Complete the authorization
                there — this window will update automatically when connected.
              </p>
              <p className="text-xs text-slate-400">
                Make sure popups are not blocked.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (popupRef.current && !popupRef.current.closed)
                  popupRef.current.close();
                setStep("select");
              }}
              className="text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {step === "success" && (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">
                Account Successfully Connected!
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Your {currentInfo?.name ?? "account"} has been linked to your
                workspace.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-md">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">
                Connection Failed
              </h4>
              <p className="text-xs text-red-600 max-w-md mx-auto bg-red-50 rounded-lg px-4 py-2 border border-red-200">
                {errorMessage}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep("select");
                  setErrorMessage("");
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
