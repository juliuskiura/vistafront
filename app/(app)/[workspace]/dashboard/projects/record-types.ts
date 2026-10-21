import type { Deliverable, DeliverableSummary } from "@/lib/api";

/**
 * A deliverable and its detail payload, side by side.
 *
 * The list endpoint returns a slim row (no assignee, no review notes, no
 * nested tasks); the detail endpoint returns all three. The deliverables
 * tab shows both, so the two are carried together.
 */
export interface DeliverableRow {
  summary: DeliverableSummary;
  detail: Deliverable | null;
}
