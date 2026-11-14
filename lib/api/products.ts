import { serverFetch, serverMutate } from "./server-fetch";
import type { CreateFeatureGroupBody, CreatePackageFeatureBody, CreateProductBody, CreateProductPackageBody, FeatureGroup, Paginated, PackageFeature, Product, ProductPackage, ProductPricing, ProductPricingPackage, UpdateFeatureGroupBody, UpdatePackageFeatureBody, UpdateProductBody, UpdateProductPackageBody } from "./types";

/**
 * Products are global (not tenant-scoped in the queryset), but the endpoint
 * is gated behind the console-admin permission, which Django resolves from
 * the active workspace. Forward `X-Workspace` so the permission check sees
 * the console workspace.
 */
export async function listProducts(workspace: string): Promise<Product[]> {
  const all: Product[] = [];
  let page = 1;
  // Hard cap so a malformed `next` link can never spin forever.
  const MAX_PAGES = 1000;
  while (page <= MAX_PAGES) {
    const payload = await serverFetch<Product[] | Paginated<Product>>(
      `/apis/products/all/?page=${page}&page_size=100`,
      { workspace },
    );
    if (Array.isArray(payload)) {
      all.push(...payload);
      break;
    }
    all.push(...(payload?.results ?? []));
    if (!payload?.next) break;
    page += 1;
  }
  return all;
}


export async function getProductDetail(nanoid: string): Promise<ProductPricing> {
  return serverFetch<ProductPricing>(`/apis/products/pricing/${nanoid}/`);
}


export async function updateProductPackage(
  nanoid: string,
  body: UpdateProductPackageBody,
  workspace: string,
): Promise<ProductPricingPackage> {
  return serverMutate<ProductPricingPackage>(
    `/apis/products/product-packages/${nanoid}/`,
    { method: "PATCH", body, workspace },
  );
}


export async function getProductPackage(nanoid: string, workspace: string): Promise<ProductPackage> {
  return serverFetch<ProductPackage>(`/apis/products/product-packages/${nanoid}/`, { workspace });
}


export async function getPackageFeature(nanoid: string, workspace: string): Promise<PackageFeature> {
  return serverFetch<PackageFeature>(`/apis/products/package-features/${nanoid}/`, { workspace });
}

export async function updatePackageFeature(
  nanoid: string,
  body: UpdatePackageFeatureBody,
  workspace: string,
): Promise<PackageFeature> {
  return serverMutate<PackageFeature>(
    `/apis/products/package-features/${nanoid}/`,
    { method: "PATCH", body, workspace },
  );
}


export async function createProduct(body: CreateProductBody, workspace: string): Promise<Product> {
  return serverMutate<Product>("/apis/products/all/", { method: "POST", body, workspace });
}

export async function createProductPackage(
  body: CreateProductPackageBody,
  workspace: string,
): Promise<ProductPackage> {
  return serverMutate<ProductPackage>("/apis/products/product-packages/", {
    method: "POST",
    body,
    workspace,
  });
}

export async function createPackageFeature(
  body: CreatePackageFeatureBody,
  workspace: string,
): Promise<PackageFeature> {
  return serverMutate<PackageFeature>("/apis/products/package-features/", {
    method: "POST",
    body,
    workspace,
  });
}




export async function listPackageFeatures(workspace: string): Promise<PackageFeature[]> {
  const all: PackageFeature[] = [];
  let page = 1;
  const MAX_PAGES = 1000;
  while (page <= MAX_PAGES) {
    const payload = await serverFetch<PackageFeature[] | Paginated<PackageFeature>>(
      `/apis/products/package-features/?page=${page}&page_size=100`,
      { workspace },
    );
    if (Array.isArray(payload)) {
      all.push(...payload);
      break;
    }
    all.push(...(payload?.results ?? []));
    if (!payload?.next) break;
    page += 1;
  }
  return all;
}

export async function movePackageFeatureLink(
  packageNanoid: string,
  featureNanoid: string,
  direction: "up" | "down",
  workspace: string,
): Promise<void> {
  await serverMutate(
    `/apis/products/product-packages/${packageNanoid}/features/${featureNanoid}/${direction}/`,
    { method: "POST", body: {}, workspace },
  );
}

export async function createPackageFeatureLink(
  packageNanoid: string,
  featureNanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate("/apis/products/package-feature-links/", {
    method: "POST",
    body: { package: packageNanoid, feature: featureNanoid },
    workspace,
  });
}

export async function deletePackageFeatureLink(
  linkId: number,
  workspace: string,
): Promise<void> {
  await serverMutate(`/apis/products/package-feature-links/${linkId}/`, {
    method: "DELETE",
    body: {},
    workspace,
  });
}

export async function listFeatureGroups(packageNanoid: string, workspace: string): Promise<FeatureGroup[]> {  const all: FeatureGroup[] = [];
  let page = 1;
  const MAX_PAGES = 1000;
  while (page <= MAX_PAGES) {
    const payload = await serverFetch<FeatureGroup[] | Paginated<FeatureGroup>>(
      `/apis/products/feature-groups/?package=${encodeURIComponent(packageNanoid)}&page=${page}&page_size=100`,
      { workspace },
    );
    if (Array.isArray(payload)) {
      all.push(...payload);
      break;
    }
    all.push(...(payload?.results ?? []));
    if (!payload?.next) break;
    page += 1;
  }
  return all;
}

export async function getFeatureGroup(nanoid: string, workspace: string): Promise<FeatureGroup> {
  return serverFetch<FeatureGroup>(`/apis/products/feature-groups/${nanoid}/`, { workspace });
}

export async function createFeatureGroup(
  body: CreateFeatureGroupBody,
  workspace: string,
): Promise<FeatureGroup> {
  return serverMutate<FeatureGroup>("/apis/products/feature-groups/", {
    method: "POST",
    body,
    workspace,
  });
}

export async function updateFeatureGroup(
  nanoid: string,
  body: UpdateFeatureGroupBody,
  workspace: string,
): Promise<FeatureGroup> {
  return serverMutate<FeatureGroup>(`/apis/products/feature-groups/${nanoid}/`, {
    method: "PATCH",
    body,
    workspace,
  });
}

export async function updateProduct(
  nanoid: string,
  body: UpdateProductBody,
  workspace: string,
): Promise<Product> {
  return serverMutate<Product>(`/apis/products/all/${nanoid}/`, {
    method: "PATCH",
    body,
    workspace,
  });
}
