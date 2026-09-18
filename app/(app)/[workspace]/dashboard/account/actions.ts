"use server";

import { revalidatePath } from "next/cache";

import { updateOrganization, updatePersonalDetails } from "@/lib/api";

export interface AccountActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialAccountState: AccountActionState = { status: "idle" };

export interface UserActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialUserState: UserActionState = { status: "idle" };

function pickString(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/**
 * Server Action: save changes to the signed-in user's organization details.
 *
 * Validates the inputs on the server (the form is also client-validated for
 * UX, but the server is the source of truth). Re-fetches `/apis/client-businesses/`
 * after the PATCH so any Server Component downstream of `revalidatePath`
 * sees the new values immediately.
 */
export async function updateAccountAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const orgNanoid = pickString(formData, "org_nanoid");
  const workspaceDomain = pickString(formData, "workspace_domain");
  const legalName = pickString(formData, "legal_name");
  const businessEmail = pickString(formData, "business_email");
  const phoneCountryCode = pickString(formData, "phone_country_code");
  const phoneNumber = pickString(formData, "phone_number");
  const country = pickString(formData, "country");
  const city = pickString(formData, "city");
  const location = pickString(formData, "location");
  const taxId = pickString(formData, "tax_id");
  const registrationNumber = pickString(formData, "registration_number");

  const fieldErrors: Record<string, string[]> = {};
  if (!legalName) {
    fieldErrors.legal_name = ["Organization name is required."];
  }
  if (!businessEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail)) {
    fieldErrors.business_email = ["Enter a valid email address."];
  }
  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  try {
    await updateOrganization(orgNanoid, {
      legal_name: legalName,
      business_email: businessEmail,
      phone_country_code: phoneCountryCode,
      phone_number: phoneNumber,
      country,
      city,
      location,
      tax_id: taxId,
      registration_number: registrationNumber,
    }, workspaceDomain);
  } catch (error) {
    console.error("updateAccountAction failed:", error);
    return {
      status: "error",
      message:
        "We could not save your changes. Please check the fields and try again.",
    };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Your organization details have been saved." };
}

/**
 * Server Action: save changes to the signed-in user's personal details.
 *
 * The /apis/profile/me/ endpoint is scoped to request.user, so no nanoid
 * lookup is required — the server resolves the resource from the session.
 * Revalidates after the patch so downstream Server Components (e.g. the
 * sidebar) reflect the new details.
 */
export async function updateUserProfileAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const firstName = pickString(formData, "first_name");
  const lastName = pickString(formData, "last_name");
  const phoneCountryCode = pickString(formData, "phone_country_code");
  const phoneNumber = pickString(formData, "phone_number");
  const country = pickString(formData, "country");
  const city = pickString(formData, "city");
  const location = pickString(formData, "location");

  const patch: Record<string, string> = {};
  if (firstName !== "" && firstName !== null) patch.first_name = firstName;
  if (lastName !== "" && lastName !== null) patch.last_name = lastName;
  if (phoneCountryCode) patch.phone_country_code = phoneCountryCode;
  if (phoneNumber) patch.phone_number = phoneNumber;
  if (country) patch.country = country;
  if (city) patch.city = city;
  if (location) patch.location = location;

  try {
    await updatePersonalDetails(patch);
  } catch (error) {
    console.error("updateUserProfileAction failed:", error);
    return {
      status: "error",
      message: "We could not save your changes. Please try again.",
    };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Your personal details have been saved." };
}