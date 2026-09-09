import { serverMutate } from "./server-fetch";

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

/**
 * Change the signed-in user's password via djoser.
 */
export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<{ detail: string }> {
  return serverMutate<{ detail: string }>("/apis/auth/password/change/", {
    body: payload,
    method: "POST",
  });
}
