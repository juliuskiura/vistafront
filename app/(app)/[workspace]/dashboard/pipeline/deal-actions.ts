"use server";

import { revalidatePath } from "next/cache";

import { createDeal, deleteDeal, moveDeal, updateDeal } from "@/lib/api";
import {
  CreateDealSchema,
  MoveDealSchema,
  UpdateDealSchema,
  fieldErrorsFromZod,
} from "@/lib/schemas";
import { type CrmActionState } from "../companies/action-state";
import { backendMessage } from "../companies/_actions-helpers";

/**
 * Server Actions for the deals on the pipeline board.
 */

function revalidatePipeline() {
  revalidatePath("/[workspace]/dashboard/pipeline", "page");
  revalidatePath("/[workspace]/dashboard/deals", "page");
  revalidatePath("/[workspace]/dashboard/companies", "page");
}

/**
 * Create a deal on the board.
 */
export async function createDealAction(input: {
  workspaceDomain: string;
  title: string;
  value?: number;
  pipeline: string;
  stage: string;
  contact?: string;
  company?: string;
  expected_close_date?: string;
  notes?: string;
}): Promise<CrmActionState> {
  const parsed = CreateDealSchema.safeParse({
    workspace_domain: input.workspaceDomain,
    title: input.title,
    value: input.value,
    pipeline: input.pipeline,
    stage: input.stage,
    contact: input.contact,
    company: input.company,
    expected_close_date: input.expected_close_date,
    notes: input.notes,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    await createDeal(
      {
        title: parsed.data.title,
        pipeline: parsed.data.pipeline,
        stage: parsed.data.stage,
        ...(parsed.data.value !== undefined ? { value: parsed.data.value } : {}),
        ...(parsed.data.contact ? { contact: parsed.data.contact } : {}),
        ...(parsed.data.company ? { company: parsed.data.company } : {}),
        ...(parsed.data.expected_close_date
          ? { expected_close_date: parsed.data.expected_close_date }
          : {}),
        ...(parsed.data.notes ? { notes: parsed.data.notes } : {}),
      },
      parsed.data.workspace_domain,
    );
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(error, "Could not create the deal."),
    };
  }

  revalidatePipeline();
  return { status: "success", message: "Deal created." };
}

/**
 * Update a deal's fields.
 */
export async function updateDealAction(input: {
  workspaceDomain: string;
  nanoid: string;
  title: string;
  value?: number;
  stage?: string;
  contact?: string;
  company?: string;
  status?: "open" | "won" | "lost";
  expected_close_date?: string;
  notes?: string;
}): Promise<CrmActionState> {
  const parsed = UpdateDealSchema.safeParse({
    workspace_domain: input.workspaceDomain,
    nanoid: input.nanoid,
    title: input.title,
    value: input.value,
    stage: input.stage,
    contact: input.contact,
    company: input.company,
    status: input.status,
    expected_close_date: input.expected_close_date,
    notes: input.notes,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    await updateDeal(
      parsed.data.nanoid,
      {
        title: parsed.data.title,
        ...(parsed.data.value !== undefined ? { value: parsed.data.value } : {}),
        ...(parsed.data.stage ? { stage: parsed.data.stage } : {}),
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        ...(parsed.data.notes !== undefined
          ? { notes: parsed.data.notes }
          : {}),
        ...(parsed.data.expected_close_date !== undefined
          ? { expected_close_date: parsed.data.expected_close_date || null }
          : {}),
      },
      parsed.data.workspace_domain,
    );
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(error, "Could not update the deal."),
    };
  }

  revalidatePipeline();
  return { status: "success", message: "Deal updated." };
}

/**
 * Move a deal to another stage.
 *
 * The backend validates the stage name against the pipeline's stages and
 * answers `400` with the reason; that message is surfaced.
 */
export async function moveDealAction(input: {
  workspaceDomain: string;
  nanoid: string;
  stage: string;
}): Promise<CrmActionState> {
  const parsed = MoveDealSchema.safeParse({
    workspace_domain: input.workspaceDomain,
    nanoid: input.nanoid,
    stage: input.stage,
  });
  if (!parsed.success) {
    return { status: "error", message: "Invalid stage." };
  }

  try {
    await moveDeal(
      parsed.data.nanoid,
      parsed.data.stage,
      parsed.data.workspace_domain,
    );
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(error, "Could not move the deal."),
    };
  }

  revalidatePipeline();
  return { status: "success", message: "Deal moved." };
}

/**
 * Delete a deal.
 */
export async function deleteDealAction(input: {
  workspaceDomain: string;
  nanoid: string;
}): Promise<CrmActionState> {
  if (!input.workspaceDomain || !input.nanoid) {
    return { status: "error", message: "Missing deal." };
  }
  try {
    await deleteDeal(input.nanoid, input.workspaceDomain);
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(error, "Could not delete the deal."),
    };
  }

  revalidatePipeline();
  return { status: "success", message: "Deal deleted." };
}
