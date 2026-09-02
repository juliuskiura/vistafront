export {
  serverFetch,
  serverMutate,
  ServerFetchError,
  toQueryString,
} from "./server-fetch";
export type { RequestOptions } from "./server-fetch";

export * from "./types";

// Re-export the domain-specific fetchers as named functions so callers can
// `import { listWorkspaces } from "@/lib/api"` without reaching into a
// per-domain file.
export {
  checkDomainAvailability,
  createWorkspace,
  getWorkspace,
  listWorkspaceMembers,
  listWorkspaces,
} from "./workspaces";

export { getCurrentUser, getUserProfile, updateCurrentUser, updateUserProfile } from "./users";

export {
  createInvitation,
  listInvitations,
  redeemInvitation,
  revokeInvitation,
} from "./invitations";

export {
  createClientBusiness,
  getClientBusiness,
  listClientBusinesses,
  updateClientBusiness,
} from "./client-businesses";

export { listBillingProfiles } from "./billing";

export { getDashboardWidgets, getNavigationSidebar } from "./dashboard";

export { getPersonalDetails, updatePersonalDetails } from "./profile";
