"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { SocialMediaPlatform, SocialPlatform } from "@/lib/api/types";
import { oauthInitAction } from "@/app/(app)/[workspace]/dashboard/socialmanager/actions";
import { buildPlatformOptions } from "./_components/platform-copy";
import { ModalHeader } from "./_components/modal-header";
import { StepIndicator } from "./_components/step-indicator";
import { StepSelect } from "./_components/step-select";
import { StepDoors } from "./_components/step-doors";
import { StepConnecting } from "./_components/step-connecting";
import { StepSuccess } from "./_components/step-success";
import { StepError } from "./_components/step-error";
import type { PlatformOption } from "./_components/platform-copy";

const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_BACKEND_URL
  ? new URL(process.env.NEXT_PUBLIC_BACKEND_URL).origin
  : "";

export type ConnectStep = "select" | "doors" | "connecting" | "success" | "error";

export interface ConnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (platform: SocialPlatform) => void;
  workspaceDomain: string;
  platforms: SocialMediaPlatform[];
  preselectedPlatform?: SocialPlatform;
  rerequest?: boolean;
}

export default function ConnectAccountModal({
  isOpen,
  onClose,
  onConnected,
  workspaceDomain,
  platforms,
  preselectedPlatform,
  rerequest,
}: ConnectAccountModalProps) {
  const [step, setStep] = useState<ConnectStep>(
    preselectedPlatform === "instagram" ? "doors" : "select",
  );
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>(
    preselectedPlatform || "facebook",
  );
  const platformOptions = useMemo<PlatformOption[]>(
    () => buildPlatformOptions(platforms),
    [platforms],
  );
  const [errorMessage, setErrorMessage] = useState("");
  const popupRef = useRef<Window | null>(null);
  const listenerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const messageReceivedRef = useRef(false);

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
      // Only accept messages sent by the popup window we opened, and only from
      // the backend's OAuth closing page — never from a third-party window or a
      // forged origin, so a foreign page can't claim a connection.
      if (event.source !== popupRef.current) return;
      if (BACKEND_ORIGIN && event.origin !== BACKEND_ORIGIN) return;

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
        setStep("success");
        onConnected(platform as SocialPlatform);
      } else {
        setErrorMessage(error || "The sign-in was interrupted. Please try again.");
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
          setErrorMessage(
            "We couldn't confirm the connection — the window closed before the flow finished. Refresh to check whether the account connected anyway.",
          );
          setStep("error");
        }
      }, 600);
      return () => {
        window.removeEventListener("message", handler);
        window.clearInterval(poll);
      };
    }
  }, [step, handleMessage, onConnected]);

  const handleSelectPlatform = useCallback(
    async (platform: SocialPlatform, route?: string) => {
      setSelectedPlatform(platform);
      setStep("connecting");
      setErrorMessage("");

      try {
        const result = await oauthInitAction(
          { platform: platform as string, method: route, rerequest },
          workspaceDomain,
        );
        if ("error" in result) {
          setErrorMessage(result.error || "We couldn't start the sign-in. Please try again.");
          setStep("error");
          return;
        }

        const authUrl = result.auth_url || "";
        const popup = window.open(authUrl, "oauth-popup", "width=600,height=700,left=200,top=100");

        if (!popup) {
          setErrorMessage("We need a pop-up window to sign you in. Allow pop-ups for this site and try again.");
          setStep("error");
          return;
        }

        popupRef.current = popup;
      } catch (err: unknown) {
        const body =
          typeof err === "object" && err !== null
            ? (err as { data?: { error?: string }; error?: string })
            : {};
        setErrorMessage(
          body?.data?.error || body?.error || "Something went wrong while starting the sign-in.",
        );
        setStep("error");
      }
    },
    [workspaceDomain, rerequest],
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

  const currentPlatformInfo =
    platformOptions.find((p) => p.id === selectedPlatform) || platformOptions[0] || null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl overflow-hidden p-0" showCloseButton={false}>
        <ModalHeader platform={currentPlatformInfo} onClose={onClose} />
        <StepIndicator step={step} />

        {step === "select" && (
          <StepSelect platforms={platformOptions} onSelect={handlePlatformClick} />
        )}

        {step === "doors" && (
          <StepDoors
            onBack={() => setStep("select")}
            onFacebookConnect={() => handleSelectPlatform("instagram", "facebook_page")}
          />
        )}

        {step === "connecting" && (
          <StepConnecting
            platformName={currentPlatformInfo?.name || "your account"}
            onCancel={() => {
              if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
              setStep("select");
            }}
          />
        )}

        {step === "success" && (
          <StepSuccess platformName={currentPlatformInfo?.name || "social"} onClose={onClose} />
        )}

        {step === "error" && (
          <StepError errorMessage={errorMessage} onRetry={handleRetry} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}