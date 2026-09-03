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
  createCompany,
  deleteCompany,
  getCompany,
  getCompanyStatusBreakdown,
  getContact,
  getDeal,
  getPipeline,
  listCompanies,
  listContacts,
  paginatedListCompanies,
  listCountries,
  listDeals,
  listIndustries,
  listPipelines,
  listTierClassifications,
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

export {
  cancelPost,
  createAccount,
  createCampaign,
  createConstraint,
  createContentFormat,
  createHashtag,
  createMediaSpec,
  createPlatform,
  createPost,
  createQueue,
  createQueueItem,
  deleteAccount,
  deleteCampaign,
  deleteConstraint,
  deleteContentFormat,
  deleteMediaSpec,
  deletePlatform,
  deletePost,
  deleteQueue,
  deleteQueueItem,
  discoverChannels,
  duplicatePost,
  getAiTailorStatus,
  getAnalyticsSyncStatus,
  getConnectedInstagram,
  getPost,
  getOauthRedirectUri,
  getPostsSyncStatus,
  getProviderConstraints,
  listAccounts,
  listCampaigns,
  listConstraints,
  listContentFormats,
  listHashtags,
  listMediaSpecs,
  listMetrics,
  listPages,
  listPlatforms,
  listPostComments,
  listPosts,
  listQueues,
  listQueueItems,
  oauthInit,
  publishPost,
  revokeAccount,
  scheduleQueue,
  startAiTailor,
  syncAccount,
  syncAnalytics,
  syncChannelSelection,
  syncComments,
  syncPosts,
  updateAccount,
  updateCampaign,
  updateConstraint,
  updateContentFormat,
  updateMediaSpec,
  updatePlatform,
  updatePost,
  updateQueue,
  updateQueueItem,
  verifyPage,
} from "./socialmanager";
