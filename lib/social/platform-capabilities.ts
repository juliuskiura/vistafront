/**
 * Per-brand comment-action capabilities.
 *
 * The private reply is a direct message addressed by comment id. The product
 * decision is that it is **not** offered on Instagram, regardless of which door
 * the channel was connected through (`instagram` or `instagramfb`) — both
 * resolve to the same `instagram` brand, so both are excluded together.
 *
 * Capability keys off the **brand**, never the door slug, for the same reason
 * every icon does: a component holding the door slug would have to re-derive the
 * brand and could disagree with the glyph beside the button.
 *
 * Pure and React-free so it can run from a Server Component, a Client Component,
 * or a test.
 */

/** Brand slugs that must not show the "Reply privately" action. */
const BRANDS_WITHOUT_PRIVATE_REPLY = new Set(["instagram"]);

/**
 * Whether a platform brand supports replying to a comment privately.
 *
 * @param brand Brand slug (the output of `brandOf`), e.g. `instagram`.
 * @returns `false` for Instagram, `true` for everything else.
 */
export function supportsPrivateReply(brand: string | null | undefined): boolean {
  return !BRANDS_WITHOUT_PRIVATE_REPLY.has((brand ?? "").trim().toLowerCase());
}
