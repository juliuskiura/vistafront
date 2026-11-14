"use server";

import { revalidatePath } from "next/cache";
import { z, flattenError } from "zod";

import {
  createFeatureGroup,
  createPackageFeature,
  createPackageFeatureLink,
  createProduct,
  createProductPackage,
  deletePackageFeatureLink,
  getProductPackage,
  movePackageFeatureLink,
  updateFeatureGroup,
  updatePackageFeature,
  updateProduct,
  updateProductPackage,
} from "@/lib/api";
import { ServerFetchError } from "@/lib/api/server-fetch-types";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function parseBackendError(error: unknown, fallback: string): ActionState {
  if (error instanceof ServerFetchError) {
    try {
      const body = JSON.parse(error.body) as Record<string, unknown>;
      const fieldErrors: Record<string, string[]> = {};
      let message = fallback;
      for (const [key, value] of Object.entries(body)) {
        if (key === "detail" || key === "error" || key === "non_field_errors") {
          const msg = Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
          if (msg) message = msg;
          if (key === "non_field_errors") {
            fieldErrors.non_field_errors = Array.isArray(value) ? value.map(String) : [String(value)];
          }
          continue;
        }
        if (Array.isArray(value)) {
          fieldErrors[key] = value.map(String);
        } else if (typeof value === "string") {
          fieldErrors[key] = [value];
        }
      }
      if (error.status === 403) {
        message = "Your role in this workspace does not allow that change.";
      }
      return {
        status: "error",
        message: Object.keys(fieldErrors).length ? "Please fix the highlighted fields." : message,
        fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined,
      };
    } catch {
      // Not JSON — fall through.
    }
    if (error.status === 403) {
      return { status: "error", message: "Your role in this workspace does not allow that change." };
    }
  }
  return { status: "error", message: fallback };
}

/* ---------------- Package update ---------------- */

const UpdatePackageSchema = z.object({
  nanoid: z.string().min(1, "Missing package."),
  product: z.string().min(1, "Missing product."),
  workspace: z.string().min(1, "Missing workspace."),
  name: z.string().min(1, "Name is required.").max(100),
  description: z.string().max(5000).default(""),
  promise: z.string().max(5000).optional().default(""),
  period: z.enum(["hour", "day", "week", "month", "project_based"], { message: "Period is required." }),
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

 type UpdatePackageInput = z.infer<typeof UpdatePackageSchema>;

export type PackageActionState = ActionState;

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
          : null,
      },
      workspace,
    );
  } catch (error) {
    console.error("updatePackageAction failed:", error);
    return parseBackendError(error, "We could not update the package. Please try again.");
  }

  revalidatePath(`/${workspace}/dashboard/products/${product}`, "page");
  revalidatePath(`/${workspace}/dashboard/products`, "page");
  return { status: "success", message: "Package updated." };
}

/* ---------------- Feature update ---------------- */

const UpdateFeatureSchema = z.object({
  nanoid: z.string().min(1, "Missing feature."),
  workspace: z.string().min(1, "Missing workspace."),
  product: z.string().min(1, "Missing product."),
  name: z.string().min(1, "Name is required.").max(100),
  group: z
    .union([z.string().min(1), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? null : v)),
  basic_usd_value: z
    .union([z.coerce.number().min(0), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? null : v)),
  kenyan_price_value: z
    .union([z.coerce.number().min(0), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? null : v)),
  bolded: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.null()])
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

 type UpdateFeatureInput = z.infer<typeof UpdateFeatureSchema>;

export type FeatureActionState = ActionState;

export async function updateFeatureAction(
  _prev: FeatureActionState,
  formData: FormData,
): Promise<FeatureActionState> {
  const parsed = UpdateFeatureSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  const { nanoid, workspace, product, ...body } = parsed.data;

  try {
    await updatePackageFeature(
      nanoid,
      {
        name: body.name,
        group: body.group,
        basic_usd_value: body.basic_usd_value,
        kenyan_price_value: body.kenyan_price_value,
        bolded: body.bolded,
      },
      workspace,
    );
  } catch (error) {
    console.error("updateFeatureAction failed:", error);
    return parseBackendError(error, "We could not update the feature. Please try again.");
  }

  revalidatePath(`/${workspace}/dashboard/products/${product}`, "page");
  return { status: "success", message: "Feature updated." };
}

/* ---------------- Product update/create ---------------- */

const UpdateProductSchema = z.object({
  nanoid: z.string().min(1),
  workspace: z.string().min(1),
  name: z.string().min(1, "Name is required.").max(100),
  description: z.string().max(5000).default(""),
});

export type ProductActionState = ActionState;

export async function updateProductAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const parsed = UpdateProductSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }
  const { nanoid, workspace, ...rest } = parsed.data;
  try {
    await updateProduct(
      nanoid,
      {
        name: rest.name,
        description: rest.description,
      },
      workspace,
    );
  } catch (error) {
    console.error("updateProductAction failed:", error);
    return parseBackendError(error, "We could not update the product.");
  }
  revalidatePath(`/${workspace}/dashboard/products/${nanoid}`, "page");
  revalidatePath(`/${workspace}/dashboard/products`, "page");
  return { status: "success", message: "Product updated." };
}

const CreateProductSchema = z.object({
  workspace: z.string().min(1),
  name: z.string().min(1, "Name is required.").max(100),
  description: z.string().max(5000).default(""),
});

export async function createProductAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const parsed = CreateProductSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }
  const { workspace, ...rest } = parsed.data;
  try {
    await createProduct(
      {
        name: rest.name,
        description: rest.description,
      },
      workspace,
    );
  } catch (error) {
    console.error("createProductAction failed:", error);
    return parseBackendError(error, "We could not create the product.");
  }
  revalidatePath(`/${workspace}/dashboard/products`, "page");
  return { status: "success", message: "Product created." };
}

/* ---------------- Package create ---------------- */

const CreatePackageSchema = z.object({
  workspace: z.string().min(1),
  product: z.string().min(1),
  name: z.string().min(1, "Name is required.").max(100),
  period: z.enum(["hour", "day", "week", "month", "project_based"]),
  description: z.string().max(5000).default(""),
  promise: z.string().max(5000).optional().default(""),
  international_price: z.coerce.number().min(0),
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

export type PackageCreateState = ActionState;

export async function createPackageAction(
  _prev: PackageCreateState,
  formData: FormData,
): Promise<PackageCreateState> {
  const parsed = CreatePackageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }
  const { workspace, product, ...rest } = parsed.data;
  try {
    await createProductPackage(
      {
        product,
        name: rest.name,
        period: rest.period,
        description: rest.description,
        promise: rest.promise || null,
        international_price: rest.international_price,
        kenyan_price: rest.kenyan_price,
        popular: rest.popular,
        operation_boundaries: rest.operation_boundaries
          ? rest.operation_boundaries
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
          : null,
      },
      workspace,
    );
  } catch (error) {
    console.error("createPackageAction failed:", error);
    return parseBackendError(error, "We could not create the package.");
  }
  revalidatePath(`/${workspace}/dashboard/products/${product}`, "page");
  return { status: "success", message: "Package created." };
}

/* ---------------- Feature create ---------------- */

const CreateFeatureSchema = z.object({
  workspace: z.string().min(1),
  product: z.string().min(1),
  name: z.string().min(1, "Name is required.").max(100),
  packages: z.array(z.string().min(1)).optional().default([]),
  group: z
    .union([z.string().min(1), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? null : v)),
  basic_usd_value: z
    .union([z.coerce.number().min(0), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? null : v)),
  kenyan_price_value: z
    .union([z.coerce.number().min(0), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? null : v)),
  bolded: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.null()])
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export type FeatureCreateState = ActionState;

export async function createFeatureAction(
  _prev: FeatureCreateState,
  formData: FormData,
): Promise<FeatureCreateState> {
  const raw = Object.fromEntries(formData) as Record<string, unknown>;
  raw.packages = formData.getAll("package");
  const parsed = CreateFeatureSchema.safeParse(raw);
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }
  const { workspace, packages: selectedPackages, product, ...rest } = parsed.data;
  try {
    const feature = await createPackageFeature(
      {
        name: rest.name,
        group: rest.group,
        basic_usd_value: rest.basic_usd_value,
        kenyan_price_value: rest.kenyan_price_value,
        bolded: rest.bolded,
      },
      workspace,
    );
    for (const pkgNanoid of selectedPackages ?? []) {
      const existing = await getProductPackage(pkgNanoid, workspace);
      const current = Array.isArray(existing.features) ? existing.features : [];
      if (!current.some((f) => f.nanoid === feature.nanoid)) {
        await createPackageFeatureLink(pkgNanoid, feature.nanoid, workspace);
      }
    }
  } catch (error) {
    console.error("createFeatureAction failed:", error);
    return parseBackendError(error, "We could not create the feature.");
  }
  revalidatePath(`/${workspace}/dashboard/products/${product}`, "page");
  return { status: "success", message: "Feature created." };
}

/* ---------------- Feature group create/update ---------------- */

const CreateFeatureGroupSchema = z.object({
  workspace: z.string().min(1),
  package: z.string().min(1),
  product: z.string().min(1),
  name: z.string().min(1, "Name is required.").max(100),
});

export type FeatureGroupCreateState = ActionState;

export async function createFeatureGroupAction(
  _prev: FeatureGroupCreateState,
  formData: FormData,
): Promise<FeatureGroupCreateState> {
  const parsed = CreateFeatureGroupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }
  const { workspace, package: pkg, product, name } = parsed.data;
  try {
    await createFeatureGroup({ package: pkg, name }, workspace);
  } catch (error) {
    console.error("createFeatureGroupAction failed:", error);
    return parseBackendError(error, "We could not create the feature group.");
  }
  revalidatePath(`/${workspace}/dashboard/products/${product}`, "page");
  return { status: "success", message: "Feature group created." };
}

const UpdateFeatureGroupSchema = z.object({
  nanoid: z.string().min(1, "Missing group."),
  workspace: z.string().min(1, "Missing workspace."),
  product: z.string().min(1, "Missing product."),
  name: z.string().min(1, "Name is required.").max(100),
});

export type FeatureGroupUpdateState = ActionState;

export async function updateFeatureGroupAction(
  _prev: FeatureGroupUpdateState,
  formData: FormData,
): Promise<FeatureGroupUpdateState> {
  const parsed = UpdateFeatureGroupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }
  const { nanoid, workspace, product, name } = parsed.data;
  try {
    await updateFeatureGroup(nanoid, { name }, workspace);
  } catch (error) {
    console.error("updateFeatureGroupAction failed:", error);
    return parseBackendError(error, "We could not update the feature group.");
  }
  revalidatePath(`/${workspace}/dashboard/products/${product}`, "page");
  return { status: "success", message: "Feature group updated." };
}

const RemoveFeatureFromPackageSchema = z.object({
  nanoid: z.string().min(1, "Missing feature."),
  package: z.string().min(1, "Missing package."),
  product: z.string().min(1, "Missing product."),
  workspace: z.string().min(1, "Missing workspace."),
});

export type RemoveFeatureState = ActionState;

export async function removeFeatureFromPackageAction(
  _prev: RemoveFeatureState,
  formData: FormData,
): Promise<RemoveFeatureState> {
  const parsed = RemoveFeatureFromPackageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }
  const { nanoid, package: pkg, product, workspace } = parsed.data;
  try {
    const existing = await getProductPackage(pkg, workspace);
    const link = (existing.features ?? []).find((f) => f.nanoid === nanoid);
    if (!link) {
      return { status: "error", message: "This feature is not linked to the package." };
    }
    await deletePackageFeatureLink(link.id, workspace);
  } catch (error) {
    console.error("removeFeatureFromPackageAction failed:", error);
    return parseBackendError(error, "We could not remove the feature from the package.");
  }
  revalidatePath(`/${workspace}/dashboard/products/${product}`, "page");
  return { status: "success", message: "Feature removed from package." };
}

export async function removeFeatureFromPackageFormAction(formData: FormData): Promise<void> {
  await removeFeatureFromPackageAction({} as never, formData);
}

const AddFeatureToPackageSchema = z.object({
  nanoid: z.string().min(1, "Missing feature."),
  package: z.string().min(1, "Missing package."),
  product: z.string().min(1, "Missing product."),
  workspace: z.string().min(1, "Missing workspace."),
});

export async function addFeatureToPackageAction(
  formData: FormData,
): Promise<void> {
  const parsed = AddFeatureToPackageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { nanoid, package: pkg, product, workspace } = parsed.data;
  try {
    const existing = await getProductPackage(pkg, workspace);
    const current = Array.isArray(existing.features) ? existing.features : [];
    if (!current.some((f) => f.nanoid === nanoid)) {
      await createPackageFeatureLink(pkg, nanoid, workspace);
    }
  } catch (error) {
    console.error("addFeatureToPackageAction failed:", error);
  }
  revalidatePath(`/${workspace}/dashboard/products/${product}`, "page");
}

const MoveFeatureInPackageSchema = z.object({
  nanoid: z.string().min(1, "Missing feature."),
  package: z.string().min(1, "Missing package."),
  product: z.string().min(1, "Missing product."),
  workspace: z.string().min(1, "Missing workspace."),
  direction: z.enum(["up", "down"]),
});

export async function moveFeatureInPackageAction(formData: FormData): Promise<void> {
  const parsed = MoveFeatureInPackageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { nanoid, package: pkg, product, workspace, direction } = parsed.data;
  try {
    // Swaps this feature's through-row with its neighbour inside the package.
    await movePackageFeatureLink(pkg, nanoid, direction, workspace);
  } catch (error) {
    console.error("moveFeatureInPackageAction failed:", error);
  }
  revalidatePath(`/${workspace}/dashboard/products/${product}`, "page");
}
