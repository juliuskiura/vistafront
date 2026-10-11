/**
 * The TanStack Query key for the inbox unread summary.
 *
 * It lives in its own module because it is the contract between three places
 * that must agree on it: the Server Component that prefetches the summary, the
 * Client Component that polls it, and the inbox client that invalidates it when
 * the user reads a thread. Importing it from `lib/api/inbox.ts` would pull the
 * server fetchers into the client bundle; this module has no dependencies.
 *
 * The workspace is part of the key so one workspace's unread count can never
 * appear under another's.
 */
export function inboxSummaryKey(workspace: string) {
  return ["socialmanager-inbox-summary", workspace] as const;
}
