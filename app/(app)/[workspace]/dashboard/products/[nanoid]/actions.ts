"use server";

import { revalidatePath } from "next/cache";
import { z, flattenError } from "zod";

import { updateProductPackage } from "@/lib/api";

export const UpdatePackageSchema = z.object({
  nanoid: z.string().min(1, "Missing package."),
  product: z.string().min(1, "Missing product."),
  workspace: z.string().min(1, "Missing workspace."),
  name: z.string().min(1, "Name is required.").max(100),
  description: z.string().max(2000).default(""),
  promise: z.string().max(2000).optional().default(""),
  period: z.string().min(1, "Period is required."),
  international_price: z.coerce.number().min(0, "Price must be zero or greater."),
  kenyan_price: z
    .union([z.coerce.number().min(0), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? null : v)),
  popular: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.null()])
    .optional()
    .transform((v) => v === "on" || v === "true"),
  operation_boundaries: z.string().optional().default(""),
});

export type UpdatePackageInput = z.infer<typeof UpdatePackageSchema>;

export type PackageActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updatePackageAction(
  _prev: PackageActionState,
  formData: FormData,
): Promise<PackageActionState> {
  const parsed = UpdatePackageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  const { nanoid, product, workspace, ...body } = parsed.data;

  try {
    await updateProductPackage(
      nanoid,
      {
        name: body.name,
        description: body.description,
        promise: body.promise || null,
        period: body.period,
        international_price: body.international_price,
        kenyan_price: body.kenyan_price,
        popular: body.popular,
        operation_boundaries: body.operation_boundaries
          ? body.operation_boundaries
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
          : undefined,
      },
      workspace,
    );
  } catch (error) {
    console.error("updatePackageAction failed:", error);
    return {
      status: "error",
      message: "We could not update the package. Please try again.",
    };
  }

  revalidatePath(`/${workspace}/dashboard/products/${product}`, "page");
  revalidatePath(`/${workspace}/dashboard/products`, "page");
  return { status: "success", message: "Package updated." };
}
