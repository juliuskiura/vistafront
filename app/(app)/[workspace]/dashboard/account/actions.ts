"use server";

import { revalidatePath } from "next/cache";

import { updatePersonalDetails } from "@/lib/api";

export interface AccountActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialAccountState: AccountActionState = { status: "idle" };

function pickString(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/**
 * Server Action: save changes to the signed-in user's personal details.
 *
 * Validates the inputs on the server (the form is also client-validated for
 * UX, but the server is the source of truth). Re-fetches `/apis/profile/me/`
 * after the PATCH so any Server Component downstream of `revalidatePath`
 * sees the new values immediately.
 */
export async function updateAccountAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const firstName = pickString(formData, "first_name");
  const lastName = pickString(formData, "last_name");
  const email = pickString(formData, "email");
  const country = pickString(formData, "country");
  const city = pickString(formData, "city");
  const location = pickString(formData, "location");
  const phoneCountryCode = pickString(formData, "phone_country_code");
  const phoneNumber = pickString(formData, "phone_number");

  const fieldErrors: Record<string, string[]> = {};
  if (!firstName) {
    fieldErrors.first_name = ["First name is required."];
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = ["Enter a valid email address."];
  }
  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  try {
    await updatePersonalDetails({
      first_name: firstName,
      last_name: lastName,
      email,
      country,
      city,
      location,
      phone_country_code: phoneCountryCode,
      phone_number: phoneNumber,
    });
  } catch (error) {
    console.error("updateAccountAction failed:", error);
    return {
      status: "error",
      message:
        "We could not save your changes. Please check the fields and try again.",
    };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Your account details have been saved." };
}