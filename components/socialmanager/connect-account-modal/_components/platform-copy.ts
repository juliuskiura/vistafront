import type { SocialMediaPlatform, SocialPlatform } from "@/lib/api/types";

/**
 * One way of signing in to a destination.
 *
 * A "door" is a single `SocialMediaPlatform` row. Two rows that share an
 * `auth_destination` are alternative doors into the same destination: the
 * `instagramfb` row (sign in with Facebook) and the `instagram` row (sign in
 * with Instagram itself) both land on `instagram`, so the picker shows one
 * "Instagram" card and lets the user choose the door. `id` is the slug to send
 * to `oauth_init`; `dialog` is the platform whose icon/name the user sees.
 */
export interface PlatformDoor {
  /** Platform row slug — this is what the OAuth handshake is started with. */
  id: SocialPlatform;
  /** The row's own name, e.g. "Instagram (via Facebook)". */
  name: string;
  /** `auth_dialog` (defaults to the row's slug) — who the user signs in as. */
  dialog: SocialPlatform;
  /** Display name of `auth_dialog`, e.g. "Facebook". */
  dialogName: string;
  /** `auth_destination` (defaults to the row's slug) — where content lands. */
  destination: SocialPlatform;
  /** False for a door whose platform row is not deployed yet. */
  available: boolean;
  color: string;
  bgColor: string;
  borderColor: string;
}

/**
 * One card in the network picker: a destination plus every door into it.
 * `id` is the destination slug, so selecting the card never presumes which
 * door the user will end up using.
 */
export interface PlatformOption {
  id: SocialPlatform;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  doors: PlatformDoor[];
  /**
   * The door the "Recommended" badge belongs to, or `null` when the
   * destination has a single door and there is nothing to recommend between.
   */
  recommendedDoorId: SocialPlatform | null;
}

interface PlatformDetails {
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

/**
 * Which door to recommend when a destination has more than one way in.
 *
 * Keyed by **destination** slug, and the value is a **door** slug — the row the
 * user walks through. This is the single place a door's priority is declared,
 * and it drives both the "Recommended" badge and the order the doors are listed
 * in (see `orderDoors`). A destination with no entry keeps the old behaviour
 * (the first available door), which is right for every network that has only
 * one door, and wrong for the ones that have two.
 *
 * Instagram is the case that matters. The backend lists rows in whatever order
 * the database returns them, and `instagram` happens to be inserted before
 * `instagramfb`, so "first available" recommended the direct-login door. That
 * door is not the one the product recommends: the catalogue documents
 * `instagram` as "provider code present, not yet enabled in the UI", while
 * `instagramfb` is the Facebook-Page door that actually publishes. Both the
 * badge and the listing order have to say so explicitly rather than inherit an
 * accident of row order.
 *
 * Adding an entry here is the whole fix for a new multi-door destination — no
 * reordering of the API response, and nothing to change in the doors step.
 */
const PREFERRED_DOOR: Record<string, string> = {
  instagram: "instagramfb",
};

const PLATFORM_DETAILS: Record<string, PlatformDetails> = {
  instagram: {
    description: "Share photos, stories, and reels with the people who follow you.",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
  },
  x: {
    description: "Post short updates, threads, and photos to your X profile.",
    color: "text-sky-600",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
  },
  linkedin: {
    description: "Publish updates to your LinkedIn profile or company page.",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  facebook: {
    description: "Share posts, photos, and videos with your Facebook audience.",
    color: "text-primary-600",
    bgColor: "bg-primary-50",
    borderColor: "border-primary-200",
  },
  tiktok: {
    description: "Publish short videos to your TikTok followers.",
    color: "text-slate-900",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-300",
  },
  pinterest: {
    description: "Pin your images and ideas to Pinterest boards.",
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
  },
  youtube: {
    description: "Upload videos and Shorts to your YouTube channel.",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  threads: {
    description: "Post short text updates and images on Threads.",
    color: "text-zinc-900",
    bgColor: "bg-zinc-100",
    borderColor: "border-zinc-300",
  },
  bluesky: {
    description: "Post updates and images to your Bluesky profile.",
    color: "text-sky-700",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
  },
  mastodon: {
    description: "Share posts with your Mastodon community.",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  google_business: {
    description: "Keep your business profile up to date on Google.",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
};

const FALLBACK_DETAILS: PlatformDetails = {
  description: "Connect your account in a couple of quick steps.",
  color: "text-slate-600",
  bgColor: "bg-slate-50",
  borderColor: "border-slate-200",
};

/** Details for a slug, falling back to a generated description for it. */
function detailsFor(slug: string, displayName: string): PlatformDetails {
  if (PLATFORM_DETAILS[slug]) return PLATFORM_DETAILS[slug];
  return { ...FALLBACK_DETAILS, description: `Connect your ${displayName} account.` };
}

/** `auth_dialog` / `auth_destination` are optional; a blank one means "self". */
function resolve(value: string | null | undefined, fallback: string): SocialPlatform {
  return (value && value.trim() ? value.trim() : fallback) as SocialPlatform;
}

/**
 * Put the recommended door at the top, leaving every other door in the order
 * the API returned it.
 *
 * The "Recommended" badge and the position of the card used to be decided
 * independently: the badge came from `PREFERRED_DOOR`, the position from
 * whatever order the database listed the rows in. Those two could disagree,
 * and for Instagram they did — the direct-login `instagram` row is inserted
 * first, so the door the product does *not* recommend was rendered above the
 * one it does. A badge under the first card reads as a correction of it.
 *
 * The recommendation is expressed once, in `PREFERRED_DOOR`, and everything
 * downstream follows it: the badge (`recommendedDoorId`) and now the order.
 * Adding a destination there is the whole fix for a new multi-door network.
 *
 * Stable and non-mutating: a door set that is already led by the recommended
 * door is returned untouched, and doors the API happened to order are not
 * reshuffled relative to one another.
 */
function orderDoors(doors: PlatformDoor[], recommended: PlatformDoor | undefined): PlatformDoor[] {
  if (!recommended || doors.length < 2) return doors;
  const head = doors.findIndex((d) => d.id === recommended.id);
  if (head <= 0) return doors;
  return [doors[head], ...doors.slice(0, head), ...doors.slice(head + 1)];
}

/**
 * Turn the flat platform rows from the API into one card per *destination*.
 *
 * Rows sharing an `auth_destination` are grouped together, so the `instagramfb`
 * and `instagram` rows collapse into a single "Instagram" card that carries both
 * doors. A destination with no active door is dropped — it has nothing the user
 * could connect — while an *inactive* door survives as a greyed-out option on
 * the doors step, which is how a door that is not deployed yet stays visible
 * without being clickable.
 */
export function buildPlatformOptions(platforms: SocialMediaPlatform[]): PlatformOption[] {
  // Slug → display name, taken from every row (deployed or not) so a door can
  // name the platform its dialog belongs to even when that row is inactive.
  const nameBySlug = new Map(platforms.map((p) => [p.slug, p.name]));

  const groups = new Map<string, PlatformDoor[]>();
  for (const platform of platforms) {
    const destination = resolve(platform.auth_destination, platform.slug);
    const dialog = resolve(platform.auth_dialog, platform.slug);
    // The user sees the dialog's branding, so colours follow the dialog.
    const details = detailsFor(dialog, nameBySlug.get(dialog) || dialog);
    const door: PlatformDoor = {
      id: platform.slug as SocialPlatform,
      name: platform.name,
      dialog,
      dialogName: nameBySlug.get(dialog) || dialog,
      destination,
      available: platform.is_active,
      color: details.color,
      bgColor: details.bgColor,
      borderColor: details.borderColor,
    };
    const bucket = groups.get(destination);
    if (bucket) bucket.push(door);
    else groups.set(destination, [door]);
  }

  const options: PlatformOption[] = [];
  for (const [destination, doors] of groups) {
    if (!doors.some((d) => d.available)) continue;
    // ``lead`` is read off the *unsorted* doors so the card's fallback label is
    // unchanged by the reordering below — it is only consulted when no platform
    // row carries the destination's own name.
    const lead = doors.find((d) => d.available) ?? doors[0];
    // The badge follows `PREFERRED_DOOR`, never the array order: a door that is
    // not deployed yet cannot be recommended, so an inactive preferred door
    // falls back to the first available one.
    const preferred = PREFERRED_DOOR[destination];
    const recommended =
      doors.find((d) => d.available && d.id === preferred) ??
      (doors.length > 1 ? lead : undefined);
    // Label the card after the destination itself when that row exists, and
    // otherwise after the door's dialog ("Instagram" rather than
    // "Instagram (via Facebook)").
    const label = nameBySlug.get(destination) ?? lead.dialogName;
    const details = detailsFor(destination, label);
    options.push({
      id: lead.destination,
      name: label,
      description: details.description,
      color: details.color,
      bgColor: details.bgColor,
      borderColor: details.borderColor,
      // The recommended door leads the list, so the badge and the first card
      // always agree. Everything else keeps the order the API returned.
      doors: orderDoors(doors, recommended),
      recommendedDoorId: recommended?.id ?? null,
    });
  }
  return options;
}

/**
 * Whether a card needs the doors step: only when the destination has more than
 * one way in. A single door goes straight to the OAuth handshake.
 */
export function needsDoorChoice(option: PlatformOption | null): boolean {
  return (option?.doors.length ?? 0) > 1;
}

/**
 * The door a destination should send the user through without asking: the one
 * `buildPlatformOptions` marked recommended, else the first available door.
 *
 * `buildPlatformOptions` already dropped destinations with no available door,
 * so this only ever returns `null` for a missing card.
 */
export function recommendedDoor(option: PlatformOption | null | undefined): PlatformDoor | null {
  if (!option) return null;
  const preferred = option.doors.find(
    (d) => d.available && d.id === option.recommendedDoorId,
  );
  if (preferred) return preferred;
  return option.doors.find((d) => d.available) ?? null;
}
