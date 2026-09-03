import "server-only";

import { serverFetch, serverMutate } from "./server-fetch";
import type { PersonalDetails, PersonalDetailsPatch } from "./types";

/**
 * Fetch the signed-in user's personal details (profile app).
 */
export async function getPersonalDetails(): Promise<PersonalDetails> {
  return serverFetch<PersonalDetails>("/apis/profile/me/");
}

/**
 * Patch the signed-in user's personal details. Returns the updated row.
 */
export async function updatePersonalDetails(
  patch: PersonalDetailsPatch,
): Promise<PersonalDetails> {
  return serverMutate<PersonalDetails>("/apis/profile/me/", {
    body: patch,
    method: "PATCH",
  });
}
