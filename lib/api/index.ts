export {
  serverFetch,
  serverMutate,
  ServerFetchError,
  toQueryString,
} from "./server-fetch";
export type { RequestOptions, MutateOptions } from "./server-fetch";

export * from "./types";

// Re-export the domain-specific fetchers as named functions so callers can
// `import { listWorkspaces } from "@/lib/api"` without reaching into a
// per-domain file.
export {
  checkDomainAvailability,
  createWorkspace,
  getWorkspace,
  leaveWorkspace,
  listWorkspaceMembers,
  listWorkspaces,
  updateWorkspace,
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

export {
  getCompany,
  getContact,
  getDeal,
  getPipeline,
  listCompanies,
  listContacts,
  listCountries,
  listDeals,
  listPipelines,
} from "./crm";

export { getDashboardWidgets, getNavigationSidebar } from "./dashboard";

export { getPersonalDetails, updatePersonalDetails } from "./profile";

export {
  createNote,
  createNoteType,
  deleteNote,
  getNote,
  listNoteTypes,
  listNotes,
  listNoteAttachments,
  toggleNoteArchive,
  toggleNoteFavorite,
  updateNote,
} from "./notebook";

export { getSchedule, getTodaySummary } from "./schedules";

export {
  completeProject,
  createProject,
  getDeliverable,
  getProject,
  getTask,
  listDeliverables,
  listProjects,
  listTasks,
} from "./projects";
