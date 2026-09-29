"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { SocialMediaPlatform, SocialPlatform } from "@/lib/api/types";
import { oauthInitAction } from "@/app/(app)/[workspace]/dashboard/socialmanager/actions";
import { buildPlatformOptions, needsDoorChoice, recommendedDoor } from "./_components/platform-copy";
import { ModalHeader } from "./_components/modal-header";
import { StepIndicator } from "./_components/step-indicator";
import { StepSelect } from "./_components/step-select";
import { StepDoors } from "./_components/step-doors";
import { StepConnecting } from "./_components/step-connecting";
import { StepSuccess } from "./_components/step-success";
import { StepError } from "./_components/step-error";
import type { PlatformDoor, PlatformOption } from "./_components/platform-copy";

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
  // `selectedPlatform` is a *destination* slug, not a door: the user picks a
  // network from the grid, then (only when that destination has several ways
  // in) a door from the doors step. `currentPlatformInfo` resolves both a
  // destination slug and a door slug to the same card, so a preselected door
  // behaves like a preselected destination.
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>(
    preselectedPlatform || "facebook",
  );
  const platformOptions = useMemo<PlatformOption[]>(
    () => buildPlatformOptions(platforms),
    [platforms],
  );
  const currentPlatformInfo = useMemo<PlatformOption | null>(
    () =>
      platformOptions.find((p) => p.id === selectedPlatform) ??
      platformOptions.find((p) => p.doors.some((d) => d.id === selectedPlatform)) ??
      platformOptions[0] ??
      null,
    [platformOptions, selectedPlatform],
  );

  // A preselected platform opens straight on its doors step when the
  // destination it belongs to has more than one door; otherwise the grid is
  // shown and the choice is made there. Resolved once on mount from the props,
  // before `platformOptions` is memoized below.
  const [step, setStep] = useState<ConnectStep>(() => {
    const preselected = preselectedPlatform
      ? buildPlatformOptions(platforms).find(
          (p) => p.id === preselectedPlatform || p.doors.some((d) => d.id === preselectedPlatform),
        )
      : null;
    return preselected && needsDoorChoice(preselected) ? "doors" : "select";
  });
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
      // this app's own origin — never from a third-party window or a forged
      // origin, so a foreign page can't claim a connection.
      //
      // Django's OAuth closing page is served through the same public host as
      // this app (nginx proxies /apis/ to Django), so its origin IS this app's
      // origin. Compare against the live runtime origin rather than a build-time
      // NEXT_PUBLIC_* constant: a constant is frozen at build and silently rots
      // when the deploy target changes, which previously made this check reject
      // every genuine success message.
      if (event.source !== popupRef.current) return;
      if (event.origin !== window.location.origin) return;

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
    async (platform: SocialPlatform) => {
      setSelectedPlatform(platform);
      setStep("connecting");
      setErrorMessage("");

      try {
        // The platform slug alone identifies the handshake: each door is its
        // own platform row on the backend, so no route/gateway parameter is
        // sent.
        const result = await oauthInitAction(
          { platform: platform as string, rerequest },
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

  /**
   * Picking a network in the grid. A destination with several doors (its
   * `auth_destination` is shared by more than one platform row) asks which way
   * in first; a destination with a single door goes straight to the handshake.
   */
  const handlePlatformClick = useCallback(
    (platform: SocialPlatform) => {
      setSelectedPlatform(platform);
      const option = platformOptions.find((p) => p.id === platform) ?? null;
      if (needsDoorChoice(option)) {
        setStep("doors");
        return;
      }
      // One way in: take the door the picker would have recommended, so a
      // destination whose recommended door is not the first listed still opens
      // the door the doors step would have highlighted.
      const door = recommendedDoor(option);
      if (door) handleSelectPlatform(door.id);
      else {
        setErrorMessage("That network has no sign-in method available yet. Please try another one.");
        setStep("error");
      }
    },
    [platformOptions, handleSelectPlatform],
  );

  const handleDoorSelect = useCallback(
    (door: PlatformDoor) => handleSelectPlatform(door.id),
    [handleSelectPlatform],
  );

  const handleRetry = () => {
    setStep("select");
    setErrorMessage("");
  };

  const currentDoors = currentPlatformInfo?.doors ?? [];

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
            destinationName={currentPlatformInfo?.name || "this network"}
            doors={currentDoors}
            recommendedDoorId={currentPlatformInfo?.recommendedDoorId ?? null}
            onBack={() => setStep("select")}
            onSelectDoor={handleDoorSelect}
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