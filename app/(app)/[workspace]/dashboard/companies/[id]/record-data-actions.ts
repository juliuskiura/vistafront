"use server";

import { revalidatePath } from "next/cache";

import {
  createActivity,
  createContact,
  createLead,
  createObservation,
  deleteActivity,
  deleteContact,
  deleteLead,
  deleteObservation,
  updateActivity,
} from "@/lib/api";
import {
  CreateActivitySchema,
  CreateContactSchema,
  CreateLeadSchema,
  CreateObservationSchema,
  UpdateActivitySchema,
  fieldErrorsFromZod,
} from "@/lib/schemas";
import { type CrmActionState } from "../action-state";
import { backendMessage } from "../_actions-helpers";

/**
 * Server Actions for the company record's data tabs.
 *
 * Each one creates or deletes a child record of the company and
 * revalidates the record page plus the matching cross-company list, so
 * both views agree without a full reload.
 */

function revalidateCompany(
  workspaceDomain: string,
  companyNanoid: string,
  listPath?: string,
) {
  revalidatePath(
    `/[workspace]/dashboard/companies/${companyNanoid}`,
    "page",
  );
  revalidatePath(`/[workspace]/dashboard/companies`, "page");
  if (listPath) {
    revalidatePath(`/[workspace]/dashboard/companies/${listPath}`, "page");
  }
}

/* ──────────────────────────────────────────────────────────────────────
 * Observations
 * ────────────────────────────────────────────────────────────────────── */

export async function createObservationAction(
  input: {
    workspaceDomain: string;
    company: string;
    category: string;
    title: string;
    description?: string;
    severity?: number;
    opportunity?: string;
  },
): Promise<CrmActionState> {
  const parsed = CreateObservationSchema.safeParse({
    workspace_domain: input.workspaceDomain,
    company: input.company,
    category: input.category,
    title: input.title,
    description: input.description,
    severity: input.severity,
    opportunity: input.opportunity,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    await createObservation(
      {
        company: parsed.data.company,
        category: parsed.data.category,
        title: parsed.data.title,
        ...(parsed.data.description
          ? { description: parsed.data.description }
          : {}),
        ...(parsed.data.severity ? { severity: parsed.data.severity } : {}),
        ...(parsed.data.opportunity
          ? { opportunity: parsed.data.opportunity }
          : {}),
      },
      parsed.data.workspace_domain,
    );
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(error, "Could not create the observation."),
    };
  }

  revalidateCompany(parsed.data.workspace_domain, parsed.data.company, "observations");
  return { status: "success", message: "Observation added." };
}

export async function deleteObservationAction(input: {
  workspaceDomain: string;
  nanoid: string;
  company: string;
}): Promise<CrmActionState> {
  try {
    await deleteObservation(input.nanoid, input.workspaceDomain);
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(error, "Could not delete the observation."),
    };
  }
  revalidateCompany(input.workspaceDomain, input.company, "observations");
  return { status: "success", message: "Observation deleted." };
}

/* ──────────────────────────────────────────────────────────────────────
 * Activities
 * ────────────────────────────────────────────────────────────────────── */

export async function createActivityAction(input: {
  workspaceDomain: string;
  company: string;
  action_type: string;
  subject: string;
  contact?: string;
  due_at?: string;
  body?: string;
}): Promise<CrmActionState> {
  const parsed = CreateActivitySchema.safeParse({
    workspace_domain: input.workspaceDomain,
    company: input.company,
    action_type: input.action_type,
    subject: input.subject,
    contact: input.contact,
    due_at: input.due_at,
    body: input.body,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    await createActivity(
      {
        company: parsed.data.company,
        action_type: parsed.data.action_type,
        subject: parsed.data.subject,
        ...(parsed.data.contact ? { contact: parsed.data.contact } : {}),
        ...(parsed.data.due_at ? { due_at: parsed.data.due_at } : {}),
        ...(parsed.data.body
          ? { content: { text: parsed.data.body } }
          : {}),
      },
      parsed.data.workspace_domain,
    );
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(error, "Could not create the activity."),
    };
  }

  revalidateCompany(parsed.data.workspace_domain, parsed.data.company, "activities");
  return { status: "success", message: "Activity added." };
}

/**
 * Update an activity — in practice, the completed toggle.
 *
 * The `completed_at` stamp is set server-side by the backend when the
 * activity is marked done; un-completing clears it.
 */
export async function updateActivityAction(input: {
  workspaceDomain: string;
  nanoid: string;
  subject: string;
  due_at?: string;
  body?: string;
  completed?: boolean;
}): Promise<CrmActionState> {
  const parsed = UpdateActivitySchema.safeParse({
    workspace_domain: input.workspaceDomain,
    nanoid: input.nanoid,
    subject: input.subject,
    due_at: input.due_at,
    body: input.body,
    completed: input.completed,
  });
  if (!parsed.success) {
    return { status: "error", message: "Please fix the highlighted fields." };
  }

  try {
    await updateActivity(
      parsed.data.nanoid,
      {
        subject: parsed.data.subject,
        ...(parsed.data.due_at ? { due_at: parsed.data.due_at } : {}),
        ...(parsed.data.body
          ? { content: { text: parsed.data.body } }
          : {}),
        ...(parsed.data.completed === undefined
          ? {}
          : { completed_at: parsed.data.completed ? new Date().toISOString() : null }),
      },
      parsed.data.workspace_domain,
    );
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(error, "Could not update the activity."),
    };
  }

  revalidatePath("/[workspace]/dashboard/companies", "page");
  return { status: "success", message: "Activity updated." };
}

export async function deleteActivityAction(input: {
  workspaceDomain: string;
  nanoid: string;
  company: string;
}): Promise<CrmActionState> {
  try {
    await deleteActivity(input.nanoid, input.workspaceDomain);
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(error, "Could not delete the activity."),
    };
  }
  revalidateCompany(input.workspaceDomain, input.company, "activities");
  return { status: "success", message: "Activity deleted." };
}
