"use server";

import { revalidatePath } from "next/cache";

import {
  createDeal,
  createPipeline,
  createPipelineStage,
  deleteDeal,
  moveDeal,
  updateDeal,
} from "@/lib/api";
import {
  CreateDealSchema,
  CreatePipelineSchema,
  CreatePipelineStageSchema,
  MoveDealSchema,
  UpdateDealSchema,
  fieldErrorsFromZod,
} from "@/lib/schemas";
import { type CrmActionState } from "../companies/action-state";
import { backendMessage } from "../companies/_actions-helpers";

/**
 * Server Actions for the pipeline board.
 *
 * Every action forwards the workspace domain: the CRM endpoints are
 * tenant-scoped, and without the header Django answers with an empty
 * list rather than an error.
 */

function revalidatePipeline(workspaceDomain: string) {
  revalidatePath("/[workspace]/dashboard/pipeline", "page");
  revalidatePath("/[workspace]/dashboard/deals", "page");
  revalidatePath("/[workspace]/dashboard/companies", "page");
}

/**
 * Create a pipeline, then its stages.
 *
 * The backend has no nested-create endpoint — a pipeline and its stages
 * are two separate resources — so this action performs the two writes in
 * order. If the stage creation fails, the pipeline still exists; the
 * message says so, because a half-created pipeline is recoverable and a
 * silent failure is not.
 */
export async function createPipelineAction(input: {
  workspaceDomain: string;
  name: string;
  description?: string;
  stages: string[];
}): Promise<CrmActionState> {
  const parsed = CreatePipelineSchema.safeParse({
    workspace_domain: input.workspaceDomain,
    name: input.name,
    description: input.description,
    stages: input.stages,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  let pipelineNanoid: string;
  try {
    const pipeline = await createPipeline(
      {
        name: parsed.data.name,
        ...(parsed.data.description
          ? { description: parsed.data.description }
          : {}),
      },
      parsed.data.workspace_domain,
    );
    pipelineNanoid = pipeline.nanoid;
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(error, "Could not create the pipeline."),
    };
  }

  const stages = parsed.data.stages ?? [];
  let failedStages = 0;
  for (const [index, name] of stages.entries()) {
    try {
      await createPipelineStage(
        { pipeline: pipelineNanoid, name, order: index },
        parsed.data.workspace_domain,
      );
    } catch {
      failedStages += 1;
    }
  }

  revalidatePipeline(parsed.data.workspace_domain);
  if (failedStages > 0) {
    return {
      status: "error",
      message: `The pipeline was created, but ${failedStages} stage${failedStages === 1 ? "" : "s"} could not be added.`,
    };
  }
  return { status: "success", message: "Pipeline created." };
}

/**
 * Add a stage to an existing pipeline.
 */
export async function createStageAction(input: {
  workspaceDomain: string;
  pipeline: string;
  name: string;
  order: number;
}): Promise<CrmActionState> {
  const parsed = CreatePipelineStageSchema.safeParse({
    workspace_domain: input.workspaceDomain,
    pipeline: input.pipeline,
    name: input.name,
    order: input.order,
  });
  if (!parsed.success) {
    return { status: "error", message: "Please fix the highlighted fields." };
  }

  try {
    await createPipelineStage(
      {
        pipeline: parsed.data.pipeline,
        name: parsed.data.name,
        order: parsed.data.order,
      },
      parsed.data.workspace_domain,
    );
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(error, "Could not add the stage."),
    };
  }

  revalidatePipeline(parsed.data.workspace_domain);
  return { status: "success", message: "Stage added." };
}
