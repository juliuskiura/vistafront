/**
 * The CRM data layer.
 *
 * One module per backend resource, all tenant-scoped: every wrapper takes
 * the active workspace and forwards it as the `X-Workspace` header, because
 * without it Django's tenant middleware silently answers `200 OK` with an
 * empty list.
 *
 * This barrel is the only import path — `lib/api/index.ts` re-exports it, so
 * application code imports from `@/lib/api`.
 */

/* Companies */
export {
  archiveCompany,
  createCompany,
  deleteCompany,
  getCompany,
  getCompanyStatusBreakdown,
  listCompanies,
  paginatedListCompanies,
  unarchiveCompany,
  updateCompany,
  advanceCompany,
  type ArchiveCompanyResult,
  type ListCompaniesFilters,
} from "./companies";

/* Shared list filters */
export { type ArchivedFilter } from "./shared";

/* Contacts */
export {
  createContact,
  deleteContact,
  getContact,
  listContacts,
  updateContact,
  type CreateContactBody,
} from "./contacts";

/* Observations */
export {
  createObservation,
  createObservationCategory,
  deleteObservation,
  listObservationCategories,
  listObservations,
  updateObservation,
  type CreateObservationBody,
} from "./observations";

/* Activities */
export {
  createActivity,
  deleteActivity,
  getActionType,
  listActionTypes,
  listActivities,
  updateActivity,
  type CreateActivityBody,
} from "./activities";

/* Leads */
export {
  createLead,
  deleteLead,
  getLead,
  listLeads,
  updateLead,
  type CreateLeadBody,
} from "./leads";

/* Pipelines, stages and deals */
export {
  createDeal,
  createPipeline,
  createPipelineStage,
  deleteDeal,
  deletePipeline,
  deletePipelineStage,
  getDeal,
  getPipeline,
  listDeals,
  listPipelineStages,
  listPipelines,
  moveDeal,
  updateDeal,
  updatePipeline,
  updatePipelineStage,
  type CreateDealBody,
  type CreatePipelineBody,
  type CreatePipelineStageBody,
} from "./pipelines";

/* Reference data */
export {
  createIndustry,
  createTierClassification,
  deleteTierClassification,
  listCountries,
  listIndustries,
  listRelatableModels,
  listTierClassifications,
  updateTierClassification,
  type CreateIndustryBody,
  type TierClassificationBody,
} from "./reference";
