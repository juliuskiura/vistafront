import { serverFetch, serverMutate } from "./server-fetch";
import type { ClientBusiness } from "./types";

/**
 * Fetch the Organization (ClientBusiness) by its nanoid.
 */
export async function getOrganization(
  nanoid: string,
  workspace: string,
): Promise<ClientBusiness> {
  return serverFetch<ClientBusiness>(
    `/apis/client-businesses/${nanoid}/`,
    { workspace },
  );
}

/**
 * Patch the Organization's details by nanoid. Returns the updated ClientBusiness.
 */
export async function updateOrganization(
  nanoid: string,
  patch: Partial<
    Pick<
      ClientBusiness,
      | "legal_name"
      | "registration_number"
      | "tax_id"
      | "country"
      | "city"
      | "location"
      | "phone_country_code"
      | "phone_number"
      | "business_email"
    >
  >,
  workspace: string,
): Promise<ClientBusiness> {
  return serverMutate<ClientBusiness>(
    `/apis/client-businesses/${nanoid}/`,
    { body: patch, method: "PATCH", workspace },
  );
}
