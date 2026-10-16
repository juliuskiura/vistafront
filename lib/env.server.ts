/**
 * Server-only environment values.
 *
 * Kept apart from ./env so that a Client Component can import getWebSocketUrl
 * without dragging the Django base URL into its module graph. That separation
 * is not cosmetic: the OAuth popup bug existed because one module mixed
 * browser-needed and server-needed values, and the server half got inlined into
 * the client bundle by next.config.ts's `env` block.
 *
 * The boundary is protected by the `.server.ts` name, by this file having no
 * importers outside server modules, and above all by
 * scripts/check-no-loopback-origin.mjs, which fails the build if a loopback
 * Django address ever shows up in a client chunk again.
 *
 * Note: this file deliberately does NOT `import "server-only"`. next.config.ts
 * is transpiled and run by plain Node, outside Next's resolver, so that
 * package's conditional exports do not resolve there and the build fails to
 * load its own config.
 */
import { APP_BASE_URL, isDeployedBuild } from "./env";

/**
 * Production uses the canonical app origin so nginx forwards API requests to
 * the app's Django service with the expected Host header. Local development
 * talks directly to Django's dev port.
 */
const DEV_BACKEND_URL = "http://127.0.0.1:8000";
const PROD_BACKEND_URL = APP_BASE_URL;

export const BACKEND_URL =
  process.env.BACKEND_URL ??
  (isDeployedBuild ? PROD_BACKEND_URL : DEV_BACKEND_URL);

/** Where the /apis/ and /media/ rewrites send traffic. */
export const API_PROXY_TARGET =
  process.env.API_PROXY_TARGET ?? BACKEND_URL;
