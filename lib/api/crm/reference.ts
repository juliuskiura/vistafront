import { serverMutate } from "../server-fetch";
import type {
  Country,
  Industry,
  RelatableModel,
  TierClassification,
} from "../types";
import { fetchList } from "./shared";

/* ──────────────────────────────────────────────────────────────────────
 * Countries
 * ────────────────────────────────────────────────────────────────────── */

/**
 * Every ISO 3166-1 country, as `{ code, name, phone_code }`.
 *
 * `Company.country` is a `django-countries` field: it stores the 2-letter
 * code but serializes to the full country *name*. The record view therefore
 * keeps the code and looks the name up from this list.
 */
export function listCountries(workspace: string): Promise<Country[]> {
  return fetchList<Country>("/apis/crm/countries/", workspace);
}

/* ──────────────────────────────────────────────────────────────────────
 * Industries
 * ────────────────────────────────────────────────────────────────────── */

export async function listIndustries(workspace: string): Promise<Industry[]> {
  return fetchList<Industry>("/apis/crm/industries/", workspace);
}

export interface CreateIndustryBody {
  name: string;
  description?: string;
}

/**
 * Create an industry.
 *
 * `Industry.name` is unique, so creating one that already exists answers
 * `400` — the caller surfaces that as "that industry already exists".
 */
export function createIndustry(
  body: CreateIndustryBody,
  workspace: string,
): Promise<Industry> {
  return serverMutate<Industry>("/apis/crm/industries/", { body, workspace });
}

/* ──────────────────────────────────────────────────────────────────────
 * Tier classifications
 * ────────────────────────────────────────────────────────────────────── */

export async function listTierClassifications(
  workspace: string,
): Promise<TierClassification[]> {
  return fetchList<TierClassification>(
    "/apis/crm/tier-classifications/",
    workspace,
  );
}

/**
 * The tier description is a JSON field. The legacy app stored rich text in
 * it as `{ html: "…" }`, and that is the shape the record view still writes.
 */
export interface TierClassificationBody {
  title?: string;
  label?: string;
  description?: Record<string, unknown>;
}

export function createTierClassification(
  body: TierClassificationBody,
  workspace: string,
): Promise<TierClassification> {
  return serverMutate<TierClassification>("/apis/crm/tier-classifications/", {
    body,
    workspace,
  });
}

export function updateTierClassification(
  nanoid: string,
  body: TierClassificationBody,
  workspace: string,
): Promise<TierClassification> {
  return serverMutate<TierClassification>(
    `/apis/crm/tier-classifications/${nanoid}/`,
    { method: "PATCH", body, workspace },
  );
}

export function deleteTierClassification(
  nanoid: string,
  workspace: string,
): Promise<void> {
  return serverMutate<void>(`/apis/crm/tier-classifications/${nanoid}/`, {
    method: "DELETE",
    body: {},
    workspace,
  });
}

/* ──────────────────────────────────────────────────────────────────────
 * Relatable models
 * ────────────────────────────────────────────────────────────────────── */

/**
 * The record types other apps can attach notes to.
 *
 * A `NoteRelation` points at a `RelatableModel` by nanoid and at the target
 * record by nanoid. The CRM seeds `key = "company"` (migration
 * `crm/0006_seed_relatable_models.py`), so the company record's notes tab
 * looks the entry up by key rather than hard-coding a nanoid.
 */
export function listRelatableModels(
  workspace: string,
): Promise<RelatableModel[]> {
  return fetchList<RelatableModel>("/apis/crm/relatable-models/", workspace);
}
