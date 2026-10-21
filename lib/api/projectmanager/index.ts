/**
 * The project-manager API client.
 *
 * A barrel over the three endpoint groups. Everything is tenant-scoped:
 * the active workspace slug is forwarded as the `X-Workspace` header on
 * every call, because Django's middleware answers `200 OK` with an empty
 * list when the header is missing.
 */
export {
  completeProject,
  createProject,
  deleteProject,
  getProject,
  listAllProjects,
  listProjects,
  paginatedListProjects,
  updateProject,
} from "./projects";

export {
  completeTask,
  createTask,
  deleteTask,
  getTask,
  listTasks,
  mergeTasks,
  suggestTaskMerge,
  updateTask,
} from "./tasks";

export {
  approveDeliverable,
  completeDeliverable,
  createDeliverable,
  deleteDeliverable,
  getDeliverable,
  listDeliverables,
  mergeDeliverables,
  publishDeliverable,
  requestRevisions,
  submitReview,
  suggestDeliverableMerge,
  updateDeliverable,
} from "./deliverables";
