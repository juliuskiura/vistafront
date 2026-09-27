export type NextStatus = "development" | "production";

function resolveStatus(value: string | undefined): NextStatus {
  return value === "production" ? "production" : "development";
}

export const NEXT_STATUS: NextStatus = resolveStatus(
  process.env.NEXT_PUBLIC_STATUS ?? process.env.NEXT_STATUS,
);

export const isDeployedBuild = NEXT_STATUS === "production";

/**
 * The canonical public origin of the app.
 *
 * There is exactly one. The browser and Django are served from the same host:
 * nginx routes /apis/, /media/ and /ws/ to Django and everything else to
 * Next.js. Browser code therefore never needs to know a backend address --
 * it uses relative paths (or window.location.origin) and lands on the right
 * process either way.
 *
 * This constant exists only for the places that genuinely need an absolute URL
 * *before* a request exists: server-side redirects, emailed links, and the SSR
 * fallback in getWebSocketUrl. Override it with APP_BASE_URL when a deployment
 * needs a different host than the defaults below.
 */
const DEFAULT_PUBLIC_ORIGINS: Record<NextStatus, string> = {
  development: "https://app.vistasolve.net",
  production: "https://app.vistasolve.com",
};

export const APP_BASE_URL = (
  process.env.APP_BASE_URL ?? DEFAULT_PUBLIC_ORIGINS[NEXT_STATUS]
).replace(/\/+$/, "");

/**
 * Server-to-server values live in ./env.server, which is `server-only`. This
 * module is imported by Client Components (for getWebSocketUrl), so it must not
 * declare anything the browser should never see -- a loopback Django address
 * reaching this module's graph is how the OAuth popup ended up rejecting valid
 * postMessage events in the first place.
 */

/**
 * Absolute ws(s):// URL for a Django WebSocket route.
 *
 * Django mounts its consumers at the ASGI root, not under /apis/ -- see
 * livechat/routing.py (ws/chat/rooms/, ws/chat/<nanoid>/, ws/simplechat/rooms/,
 * ws/typing/<nanoid>/). Those are served by nginx's `location /ws/` block,
 * which sits in front of both the app and Django, so in the browser the correct
 * answer is always "same origin as this page" -- never a compiled-in backend
 * address.
 *
 * That distinction is not cosmetic. Reading the backend origin from a
 * build-time constant is what made the OAuth popup reject valid postMessage
 * events: the bundle believed it was talking to http://localhost:8000 while
 * the real page ran on https://app.vistasolve.net, and the listener threw the
 * messages away. The SSR branch exists only so the function is safe to call
 * during server rendering; all real callers are client components.
 */
export function getWebSocketUrl(path: string): string {
  const base =
    typeof window === "undefined" ? APP_BASE_URL : window.location.origin;
  const url = new URL(path, base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}
