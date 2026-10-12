/**
 * Pre-filled sample content for the app-review workspace.
 *
 * The review company (workspace domain `metareview`) gets a special free
 * package via `create_review_package`. Without this module the reviewer
 * still has to type a caption, attach an image, and invent a reply before
 * anything on screen looks real — which is exactly the friction an app
 * review does not need.
 *
 * The sample text is keyed by workspace domain. Only workspaces listed here
 * ever see it, and it arrives on focus rather than pre-filled (see
 * `use-demo-draft.ts`), so this can never leak into a real customer's
 * session.
 *
 * The compose caption matches the published demo post seeded by
 * `seed_metareview` (regwakes/accounts/management/commands) on purpose:
 * what the reviewer sees pre-typed and what the seeded post says are the
 * same words, so the two never disagree.
 */

export interface ReviewDemo {
  /** Workspace domain this demo belongs to (lowercase). */
  domain: string;
  /** Caption dropped into the compose screen. */
  caption: string;
  /** First comment queued for each selected channel. */
  firstComment: string;
  /** Reply pre-typed when answering a comment. */
  commentReply: string;
  /** Reply pre-typed when answering an inbox message. */
  messageReply: string;
  /**
   * Sample picture attached to the compose draft. A remote URL, not a
   * bundled asset: the composer renders it in the preview tray and the
   * publishing pipeline accepts a URL, so the reviewer can publish the
   * seeded draft without uploading anything first.
   *
   * Host matters: `fastly.picsum.photos`, the CDN subdomain, answers 400 on
   * every form of this URL -- which is what broke the preview tray. The
   * canonical `picsum.photos` host works and redirects to the file. 4:5
   * crops cleanly on Instagram and Facebook alike, and 1080x1350 keeps the
   * asset light for a preview tray.
   */
  imageUrl: string;
}

const DEMOS: ReviewDemo[] = [
  {
    domain: "metareview",
    caption:
      "We just launched our new workspace! Excited to share what we have " +
      "been building. #launch #vistasolve",
    firstComment:
      "Thanks for all the support — more updates coming this week!",
    commentReply:
      "Thank you so much! Really glad you like it.",
    messageReply:
      "Thanks for reaching out — we'll get back to you shortly.",
    imageUrl: "https://picsum.photos/id/7/1080/1350.jpg",
  },
];

/**
 * The demo for a workspace domain, or null for every other workspace.
 * Pure: safe to call during a render or a `useState` initializer.
 */
export function getReviewDemo(domain: string): ReviewDemo | null {
  const key = (domain ?? "").trim().toLowerCase();
  if (!key) return null;
  return DEMOS.find((demo) => demo.domain === key) ?? null;
}

/** The shape the compose screen needs from a channel — kept structural so
 *  this module never imports social types. */
export interface ComposeChannelLike {
  nanoid: string;
  /** Platform slug (e.g. "facebook"); used to prefer a review channel. */
  platform?: string;
}

export interface ComposeSeed {
  /** Pre-filled caption. */
  content: string;
  /** Sample picture for the media tray. */
  mediaUrls: string[];
  /** Channels to pre-select — one is enough for a review. */
  selectedPageIds: string[];
  /** First comment per selected channel. */
  firstCommentByPage: Record<string, string>;
}

/**
 * The channels a review demo prefers: the two the review flow exercises.
 * When the reviewer has not connected one of those, any connected channel
 * is pre-selected instead — an empty composer helps nobody.
 */
const PREFERRED_PLATFORMS = ["facebook", "instagram"];

/**
 * Build the initial compose state from a demo and the workspace's channels.
 *
 * Only ever called when there is no post being edited, so it can never
 * overwrite an existing post's content.
 */
export function buildComposeSeed(
  demo: ReviewDemo,
  pages: ComposeChannelLike[],
): ComposeSeed {
  const preferred = pages.filter((page) =>
    PREFERRED_PLATFORMS.includes((page.platform ?? "").toLowerCase()),
  );
  const chosen = (preferred.length > 0 ? preferred : pages).slice(0, 1);

  const firstCommentByPage: Record<string, string> = {};
  for (const page of chosen) {
    firstCommentByPage[page.nanoid] = demo.firstComment;
  }

  return {
    content: demo.caption,
    mediaUrls: [demo.imageUrl],
    selectedPageIds: chosen.map((page) => page.nanoid),
    firstCommentByPage,
  };
}
