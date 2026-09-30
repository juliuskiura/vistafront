/**
 * Stable URL for a channel's avatar.
 *
 * Meta's picture URLs are signed CDN links with a multi-day expiry — measured
 * at four days on a real Page — and every page of an account is synced in the
 * same request, so every avatar of that account is signed at the same instant
 * and dies at the same instant. Rendering the URL stored on the channel means
 * every avatar in the product breaks together and stays broken until a sync
 * happens to run.
 *
 * This points at our own endpoint instead, which mints a fresh link per request
 * and redirects to it. It is a URL builder rather than a fetch wrapper because
 * `<img src>` cannot run one, and it lives in its own module — free of server
 * imports — so a client component can use it without pulling `next/headers`
 * into the browser bundle.
 */
export function channelAvatarUrl(nanoid: string, workspace: string): string {
  return `/api/socialmanager/avatar/${encodeURIComponent(nanoid)}?workspace=${encodeURIComponent(workspace)}`;
}
