import { serverFetch, serverMutate } from "./server-fetch";
import {
  getPersonalDetails,
  updatePersonalDetails,
} from "./profile";
import type { PersonalDetails, PersonalDetailsPatch } from "./types";

/**
 * Fetch the signed-in user's account record.
 *
 * Backed by `/apis/auth/users/me/` — djoser's standard "current user"
 * endpoint. Returns the canonical user (id, nanoid, email, role flags,
 * signup_date, redirect_url, etc.). The richer profile data
 * (first_name, last_name, phone, location) lives in
 * `getPersonalDetails()`.
 */
export async function getCurrentUser(): Promise<User> {
  return serverFetch<User>("/apis/auth/users/me/");
}

/**
 * Patch the signed-in user's account record. The exact fields accepted by
 * the backend are user-resource specific; djoser allows the standard
 * `first_name`, `last_name` updates.
 */
export async function updateCurrentUser(patch: {
  first_name?: string | null;
  last_name?: string | null;
}): Promise<User> {
  return serverMutate<User>("/apis/auth/users/me/", {
    body: patch,
    method: "PATCH",
  });
}

/**
 * Convenience for profile-aware screens.
 */
export const getUserProfile = getPersonalDetails;

/**
 * Convenience alias used by profile settings forms.
 */
export const updateUserProfile = updatePersonalDetails;

/**
 * Re-export the profile row type under the user namespace so callers can
 * use a single import.
 */
export type User = PersonalDetails;
