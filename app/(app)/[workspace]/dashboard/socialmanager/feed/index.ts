/**
 * Unified Feed components.
 *
 * The barrel exports the primary component only — `FeedClient`, which the
 * Server Component page mounts — so the tree stays self-contained and callers
 * never reach into the local `_components/` directory.
 */
export { FeedClient } from "./feed-client";
