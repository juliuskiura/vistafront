import { serverFetch, serverMutate } from "../server-fetch";
import type { Deal, Pipeline, PipelineStage } from "../types";
import { fetchList, qs, wsOpts, type ArchivedFilter } from "./shared";

/* ──────────────────────────────────────────────────────────────────────
 * Pipelines
 * ────────────────────────────────────────────────────────────────────── */

/**
 * List every pipeline in the workspace.
 *
 * `Pipeline.stages` is the reverse FK from `PipelineStage`, so each entry
 * already carries its `nanoid`, `name` and `order` — the board does not
 * need a second request to render its columns.
 */
export async function listPipelines(workspace: string): Promise<Pipeline[]> {
  return fetchList<Pipeline>("/apis/crm/pipelines/", workspace);
}

export function getPipeline(
  nanoid: string,
  workspace: string,
): Promise<Pipeline> {
  return serverFetch<Pipeline>(
    `/apis/crm/pipelines/${nanoid}/`,
    wsOpts(workspace),
  );
}

export interface CreatePipelineBody {
  name: string;
  description?: string;
  is_default?: boolean;
}

export function createPipeline(
  body: CreatePipelineBody,
  workspace: string,
): Promise<Pipeline> {
  return serverMutate<Pipeline>("/apis/crm/pipelines/", {
    body,
    workspace,
  });
}

export function updatePipeline(
  nanoid: string,
  body: Partial<CreatePipelineBody>,
  workspace: string,
): Promise<Pipeline> {
  return serverMutate<Pipeline>(`/apis/crm/pipelines/${nanoid}/`, {
    method: "PATCH",
    body,
    workspace,
  });
}

export function deletePipeline(
  nanoid: string,
  workspace: string,
): Promise<void> {
  return serverMutate<void>(`/apis/crm/pipelines/${nanoid}/`, {
    method: "DELETE",
    body: {},
    workspace,
  });
}

/* ──────────────────────────────────────────────────────────────────────
 * Pipeline stages
 * ────────────────────────────────────────────────────────────────────── */

export interface CreatePipelineStageBody {
  /** Parent pipeline nanoid — required. */
  pipeline: string;
  name: string;
  order: number;
}

/**
 * List the stages of a pipeline.
 *
 * `?pipeline=` is the only filter the backend supports.
 */
export async function listPipelineStages(
  pipelineNanoid: string,
  workspace: string,
): Promise<PipelineStage[]> {
  return fetchList<PipelineStage>(
    `/apis/crm/stages/${qs({ pipeline: pipelineNanoid })}`,
    workspace,
  );
}

export function createPipelineStage(
  body: CreatePipelineStageBody,
  workspace: string,
): Promise<PipelineStage> {
  return serverMutate<PipelineStage>("/apis/crm/stages/", {
    body,
    workspace,
  });
}

export function updatePipelineStage(
  nanoid: string,
  body: Partial<Omit<CreatePipelineStageBody, "pipeline">>,
  workspace: string,
): Promise<PipelineStage> {
  return serverMutate<PipelineStage>(`/apis/crm/stages/${nanoid}/`, {
    method: "PATCH",
    body,
    workspace,
  });
}

export function deletePipelineStage(
  nanoid: string,
  workspace: string,
): Promise<void> {
  return serverMutate<void>(`/apis/crm/stages/${nanoid}/`, {
    method: "DELETE",
    body: {},
    workspace,
  });
}

/* ──────────────────────────────────────────────────────────────────────
 * Deals
 * ────────────────────────────────────────────────────────────────────── */

/**
 * List deals.
 *
 * The list serializer is reduced: it omits `pipeline`, `pipeline_name`,
 * `notes` and `updated_at`. Pass `pipeline` when the caller needs the
 * pipeline on every row — the board always does.
 *
 * Archived deals (archived with their company) are left out unless
 * `archived: "all"` asks for them.
 */
export async function listDeals(opts: {
  pipeline?: string;
  stage?: string;
  archived?: ArchivedFilter;
  workspace: string;
}): Promise<Deal[]> {
  return fetchList<Deal>(
    `/apis/crm/deals/${qs({
      pipeline: opts.pipeline,
      stage: opts.stage,
      archived: opts.archived,
    })}`,
    opts.workspace,
  );
}

export function getDeal(nanoid: string, workspace: string): Promise<Deal> {
  return serverFetch<Deal>(`/apis/crm/deals/${nanoid}/`, wsOpts(workspace));
}

export interface CreateDealBody {
  title: string;
  value?: number;
  /** Parent pipeline nanoid — required. */
  pipeline: string;
  /** Stage *name* — the backend stores a plain string, not a FK. */
  stage: string;
  contact?: string | null;
  company?: string | null;
  status?: "open" | "won" | "lost";
  expected_close_date?: string | null;
  notes?: string;
}

export function createDeal(
  body: CreateDealBody,
  workspace: string,
): Promise<Deal> {
  return serverMutate<Deal>("/apis/crm/deals/", { body, workspace });
}

export function updateDeal(
  nanoid: string,
  body: Partial<CreateDealBody>,
  workspace: string,
): Promise<Deal> {
  return serverMutate<Deal>(`/apis/crm/deals/${nanoid}/`, {
    method: "PATCH",
    body,
    workspace,
  });
}

export function deleteDeal(nanoid: string, workspace: string): Promise<void> {
  return serverMutate<void>(`/apis/crm/deals/${nanoid}/`, {
    method: "DELETE",
    body: {},
    workspace,
  });
}

/**
 * Move a deal to another stage.
 *
 * The backend validates the name against the pipeline's stage names and
 * answers `400` with `{ error: "…" }` when it does not match, so the caller
 * must surface that message.
 */
export function moveDeal(
  nanoid: string,
  stage: string,
  workspace: string,
): Promise<Deal> {
  return serverMutate<Deal>(`/apis/crm/deals/${nanoid}/move/`, {
    method: "PATCH",
    body: { stage },
    workspace,
  });
}
