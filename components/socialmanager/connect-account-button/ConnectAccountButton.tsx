"use client";

import { useMemo } from "react";
import { VSButton } from "@/components/shared/components/customUi/VSButton";
import type { SocialMediaPlatform } from "@/lib/api/types";
import { useConnectAccount } from "@/lib/context";
import { SHOWCASE_LIMIT, selectShowcasePlatforms } from "@/lib/social/platform-showcase";
import { cn } from "@/lib/utils";
import { MoreIndicator } from "./_components/more-indicator";
import { PlatformCircle } from "./_components/platform-circle";

/**
 * "Connect Account" — the social manager's primary call to action.
 *
 * A `VSButton` used as a **card** rather than a pill: the label sits on top and
 * a row of platform discs sits under it, so before the user clicks anything the
 * button has already told them which networks are on the other side. A plain
 * "Connect Account" pill asks them to click to find out; this one answers the
 * question on the way in.
 *
 * The whole card is one button. The discs are not individually clickable — the
 * modal opens on the platform picker, and making five sub-targets inside one
 * button would need nested interactive elements, which is not a thing buttons
 * can contain. Hovering any disc lifts it, so the row still reads as a set of
 * platforms rather than decoration.
 *
 * `platforms` is passed in rather than fetched here. The Server Component
 * layout already lists the catalogue for the section (that is what feeds
 * `PlatformBrandProvider`); a fetch here would be a second request for data
 * the server already resolved, on a route the button lives on.
 */
export function ConnectAccountButton({
  platforms,
  className,
}: {
  /** Platform rows for the active workspace, active and inactive alike. */
  platforms?: readonly SocialMediaPlatform[] | null;
  className?: string;
}) {
  const { open } = useConnectAccount();

  const connectable = useMemo(() => selectShowcasePlatforms(platforms), [platforms]);
  const featured = connectable.slice(0, SHOWCASE_LIMIT);
  const hiddenCount = connectable.length - featured.length;

  // Screen readers get the same information the discs give sighted users. The
  // discs themselves are spans with no text, so without this the button would
  // announce only its own label.
  const summary = featured.length
    ? `Available networks: ${featured.map((p) => p.name).join(", ")}${
        hiddenCount > 0 ? `, and ${hiddenCount} more` : ""
      }.`
    : "";

  return (
    <VSButton
      type="button"
      // `open` takes an intent, and an intent is a plain object — passing the
      // MouseEvent straight through would spread the event into the modal's
      // props. The arrow keeps the two apart.
      onClick={() => open()}
      // `light` is the design system's white surface (`primary-50`); `threeD`
      // adds the raised bevel and the press-down. Both are VSButton's own
      // tokens, so the card keeps the shared button's behaviour and focus ring
      // instead of a hand-rolled look that drifts from the rest of the app.
      variant="light"
      appearance="threeD"
      size="md"
      className={cn(
        // `rounded-2xl` and the `px/py` pair override VSButton's pill radius and
        // its size-variant padding — tailwind-merge drops the losing classes.
        "group flex-col gap-3.5 rounded-2xl px-6 py-1 text-base",
        // `threeD` ships a dark `text-shadow` sized for light-on-dark. On a
        // white surface it reads as smudged text, so it is cleared here and the
        // bevel is left to do the work instead.
        "[text-shadow:none]",
        // No `shadow-*` override: the `threeD` bevel *is* the card's depth, and
        // the paired `active:shadow` is the press-down. Replacing it with a
        // soft drop shadow would flatten both.
        //
        // `hover:-translate-y-px` rather than `-0.5`, to stay out of the way of
        // `active:translate-y-px` — the card should not lurch on hover and then
        // jump again on click.
        "hover:-translate-y-px",
        className,
      )}
    >
      <span className="text-base font-bold tracking-tight text-[var(--vs-on-fill)] [text-shadow:none]">
        Click to Connect Account
      </span>

      {featured.length > 0 && (
        <span className="flex items-start gap-2">
          {featured.map((platform) => (
            <PlatformCircle key={platform.brand} brand={platform.brand} name={platform.name} />
          ))}

          {hiddenCount > 0 && <MoreIndicator count={hiddenCount} />}
        </span>
      )}

      {summary && <span className="sr-only">{summary}</span>}
    </VSButton>
  );
}
