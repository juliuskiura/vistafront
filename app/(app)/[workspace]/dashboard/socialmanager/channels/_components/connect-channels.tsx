"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "@/lib/icons";
import { SocialIconSolid } from "@/components/social-icons";
import { useConnectHandshake } from "@/components/socialmanager/connect-account-modal/_hooks/use-connect-handshake";
import { StepDoors } from "@/components/socialmanager/connect-account-modal/_components/step-doors";
import type { PlatformDoor } from "@/components/socialmanager/connect-account-modal/_components/platform-copy";
import type { SocialPlatform } from "@/lib/api/types";
import { oauthInitAction } from "../../actions";

interface ConnectChannelsProps {
  /** Workspace slug — forwarded as `X-Workspace` by the Server Action. */
  ws: string;
  /** False when the plan lacks `socialmanager.posts`; both buttons disable. */
  canConnect: boolean;
  /**
   * The Instagram doors (by `auth_destination`), resolved on the server from
   * the platform catalogue. Door 1 `instagramfb` and Door 2 `instagram` when
   * both exist; each door's `available` gates its card.
   */
  instagramDoors: PlatformDoor[];
  /** Slug of the door carrying the "Recommended" badge, or `null`. */
  recommendedDoorId: SocialPlatform | null;
}

const BUTTON_CLASS =
  "flex items-center justify-center gap-2 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all shrink-0 disabled:opacity-60 hover:brightness-110";

/** Facebook's brand blue. */
const FACEBOOK_BRAND = "bg-[#1877F2]";
/** The Instagram brand gradient (orange → pink → purple). */
const INSTAGRAM_BRAND =
  "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]";

/**
 * The channels header's connect actions: a direct "Connect Facebook" and a
 * direct "Connect Instagram".
 *
 * Both launch the OAuth handshake *without* the shared connect-account modal.
 * Facebook is a single-door destination, so its button connects immediately.
 * Instagram is reachable through two doors (`instagramfb`, then `instagram`),
 * so its button first offers the door choice and only then starts the handshake
 * with the chosen door's slug — the same `useConnectHandshake` the modal runs,
 * just entered directly.
 */
export function ConnectChannels({
  ws,
  canConnect,
  instagramDoors,
  recommendedDoorId,
}: ConnectChannelsProps) {
  const router = useRouter();
  // The platform slug of the handshake in flight, so each button can show its
  // own spinner and both can be disabled together.
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [doorsOpen, setDoorsOpen] = useState(false);

  const { begin, takeBaseline } = useConnectHandshake({
    workspaceDomain: ws,
    onSuccess: useCallback(() => {
      setConnecting(null);
      setError("");
      setDoorsOpen(false);
      router.refresh();
    }, [router]),
    onFailure: useCallback((message: string) => {
      setConnecting(null);
      setError(message);
    }, []),
  });

  /** Run the direct handshake for one door/platform slug. */
  const startConnect = useCallback(
    async (platform: SocialPlatform) => {
      if (!canConnect) return;
      setConnecting(platform);
      setError("");
      try {
        const [result, baseline] = await Promise.all([
          oauthInitAction({ platform }, ws),
          takeBaseline(),
        ]);
        if ("error" in result) {
          setConnecting(null);
          setError(result.error || "We couldn't start the sign-in. Please try again.");
          return;
        }
        begin(result.auth_url, platform, baseline);
      } catch (err) {
        setConnecting(null);
        setError("Something went wrong while starting the sign-in.");
        console.error(err);
      }
    },
    [canConnect, ws, begin, takeBaseline],
  );

  const handleConnectInstagram = useCallback(() => {
    if (!canConnect) return;
    // A single door needs no choosing. Two or more opens the chooser, which
    // also keeps an inactive door visible as "Coming soon" rather than silent.
    if (instagramDoors.length <= 1) {
      const only = instagramDoors[0];
      if (only) void startConnect(only.id);
      return;
    }
    setError("");
    setDoorsOpen(true);
  }, [canConnect, instagramDoors, startConnect]);

  const hasInstagramDoor = instagramDoors.some((door) => door.available);
  const fbConnecting = connecting === "facebook";
  const igConnecting = connecting !== null && !fbConnecting;
  const busy = connecting !== null;

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          onClick={() => void startConnect("facebook")}
          disabled={!canConnect || busy}
          title={
            canConnect
              ? "Link your Facebook account to cross-post"
              : "Your plan does not include social publishing"
          }
          className={`${BUTTON_CLASS} ${FACEBOOK_BRAND}`}
        >
          {fbConnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SocialIconSolid name="facebook" className="h-4 w-4" />
          )}
          <span>{fbConnecting ? "Opening Facebook…" : "Connect Facebook"}</span>
        </Button>

        <Button
          onClick={handleConnectInstagram}
          disabled={!canConnect || busy || !hasInstagramDoor}
          title={
            !canConnect
              ? "Your plan does not include social publishing"
              : !hasInstagramDoor
                ? "Instagram isn't available to connect yet"
                : "Link your Instagram account to cross-post"
          }
          className={`${BUTTON_CLASS} ${INSTAGRAM_BRAND}`}
        >
          {igConnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SocialIconSolid name="instagram" className="h-4 w-4" />
          )}
          <span>{igConnecting ? "Opening Instagram…" : "Connect Instagram"}</span>
        </Button>

        {error && (
          <p className="text-xs text-red-600 font-medium max-w-md" role="alert">
            {error}
          </p>
        )}
      </div>

      <Dialog open={doorsOpen} onOpenChange={setDoorsOpen}>
        <DialogContent className="max-w-xl overflow-hidden p-0" showCloseButton={false}>
          <StepDoors
            destinationName="Instagram"
            doors={instagramDoors}
            recommendedDoorId={recommendedDoorId}
            backLabel="Close"
            onBack={() => setDoorsOpen(false)}
            onSelectDoor={(door) => {
              setDoorsOpen(false);
              void startConnect(door.id);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
