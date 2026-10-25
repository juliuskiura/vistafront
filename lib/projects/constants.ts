import type {
  ProjectPriority,
  ProjectStatus,
  TaskStatus,
} from "@/lib/api/types";

/**
 * The project manager's vocabulary, in one place.
 *
 * Every label, colour and option list for projects and tasks used to be
 * duplicated across the four `formatDate`-style helpers that lived inside
 * the feature's pages. They are collected here so a status reads the same
 * in the list and the record header.
 *
 * The category table is static because the backend exposes no endpoint
 * that lists `ProjectCategory` rows — they are seeded by
 * `projectmanager/migrations/0013_generalize_project_schema.py` and read
 * by key. The values below mirror that seed; a workspace that defines its
 * own category would not appear here.
 */

/* ──────────────────────────────────────────────────────────────────────
 * Labels
 * ────────────────────────────────────────────────────────────────────── */

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PROJECT_PRIORITY_LABELS: Record<ProjectPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

/* ──────────────────────────────────────────────────────────────────────
 * Option lists (for <select> elements)
 * ────────────────────────────────────────────────────────────────────── */

export const PROJECT_STATUS_OPTIONS = (
  Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]
).map((value) => ({ value, label: PROJECT_STATUS_LABELS[value] }));

export const PROJECT_PRIORITY_OPTIONS = (
  Object.keys(PROJECT_PRIORITY_LABELS) as ProjectPriority[]
).map((value) => ({ value, label: PROJECT_PRIORITY_LABELS[value] }));

export const TASK_STATUS_OPTIONS = (
  Object.keys(TASK_STATUS_LABELS) as TaskStatus[]
).map((value) => ({ value, label: TASK_STATUS_LABELS[value] }));

/* ──────────────────────────────────────────────────────────────────────
 * Category table
 *
 * The backend reads this by `key`, so the *key* is what goes on the wire —
 * never the label.
 * ────────────────────────────────────────────────────────────────────── */

export const PROJECT_CATEGORY_OPTIONS = [
  { value: "blog", label: "Blog" },
  { value: "social", label: "Social" },
  { value: "email", label: "Email" },
  { value: "ad", label: "Ad" },
  { value: "content", label: "Content" },
  { value: "other", label: "Other" },
];

const CATEGORY_LABELS = new Map(
  PROJECT_CATEGORY_OPTIONS.map((o) => [o.value, o.label]),
);

/** The human label for a stored category key, falling back to the key. */
export function projectCategoryLabel(key: string | null): string {
  if (!key) return "—";
  return CATEGORY_LABELS.get(key) ?? key;
}

/* ──────────────────────────────────────────────────────────────────────
 * Colours
 *
 * Ported from the legacy `features/projects/helpers/projectHelpers.ts`.
 * `border-border` is kept on the neutral tone so the badge keeps a visible
 * edge on the muted background.
 * ────────────────────────────────────────────────────────────────────── */

const NEUTRAL_BADGE = "bg-muted text-muted-foreground border-border";
const PRIMARY_BADGE = "bg-primary/10 text-primary border-primary/20";
const SUCCESS_BADGE = "bg-success/10 text-success border-success/20";
const WARNING_BADGE = "bg-warning/10 text-warning border-warning/20";
const INFO_BADGE = "bg-info/10 text-info border-info/20";
const DESTRUCTIVE_BADGE =
  "bg-destructive/10 text-destructive border-destructive/20";

/** Badge classes for a project / task status. */
export function statusBadgeClass(status: string): string {
  switch (status) {
    case "in_progress":
      return PRIMARY_BADGE;
    case "completed":
    case "done":
    case "published":
    case "approved":
      return SUCCESS_BADGE;
    case "on_hold":
    case "review":
    case "revisions":
      return WARNING_BADGE;
    case "cancelled":
      return DESTRUCTIVE_BADGE;
    default:
      return NEUTRAL_BADGE;
  }
}

/** Badge classes for a priority. */
export function priorityBadgeClass(priority: string): string {
  switch (priority) {
    case "medium":
      return INFO_BADGE;
    case "high":
      return WARNING_BADGE;
    case "urgent":
      return DESTRUCTIVE_BADGE;
    default:
      return NEUTRAL_BADGE;
  }
}

/** The next status a task's status control steps to. */
export function nextTaskStatus(status: TaskStatus): TaskStatus {
  switch (status) {
    case "todo":
      return "in_progress";
    case "in_progress":
      return "done";
    default:
      return "todo";
  }
}
