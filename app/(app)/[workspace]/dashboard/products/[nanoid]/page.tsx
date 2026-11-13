import { notFound, redirect } from "next/navigation";

import { Banner } from "@/components/banner";
import { WorkspaceInnerNav } from "@/components/workspace/workspace-inner-nav";
import { getPackageFeature, getProductDetail, getProductPackage, listFeatureGroups, type FeatureGroup, type PackageFeature, type ProductPackage, type ProductPricing } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { getSubscriptionStateCached } from "@/lib/features/guard";
import { PackageCard } from "./package-card";
import { ProductActions } from "./product-actions";
import { Package } from "@/lib/icons";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; nanoid: string }>;
}) {
  const { workspace: slug, nanoid } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const { exempt } = await getSubscriptionStateCached(active.nanoid);
  if (!exempt) {
    redirect(`/${ws}/dashboard`);
  }

  const product = await getProductDetail(nanoid).catch(
    () => null as ProductPricing | null,
  );
  if (!product) {
    notFound();
  }

  const rawPackages = await Promise.all(
    product.packages.map((pkg) =>
      getProductPackage(pkg.nanoid, ws).catch(() => null as ProductPackage | null),
    ),
  );

  const featureNanoids = product.packages.flatMap((pkg) =>
    (pkg.features ?? []).map((f) => f.nanoid),
  );
  const rawFeatures = await Promise.all(
    featureNanoids.map((nanoid) =>
      getPackageFeature(nanoid, ws).catch(() => null as PackageFeature | null),
    ),
  );

  const featureGroupsByPackage = await Promise.all(
    product.packages.map((pkg) =>
      listFeatureGroups(pkg.nanoid, ws).catch(() => [] as FeatureGroup[]),
    ),
  );
  const allFeatureGroups = featureGroupsByPackage.flat();

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title={product.name}
        description={product.description}
      />

      <WorkspaceInnerNav
        basePath={`/${ws}/dashboard/products`}
        brandLabel="Products"
        brandIcon={Package}
        hideBrand
        trailing={
          <ProductActions
            product={product.nanoid}
            workspace={ws}
            productName={product.name}
            productDescription={product.description}
            packages={product.packages.map((pkg) => ({
              nanoid: pkg.nanoid,
              name: pkg.name,
            }))}
            featureGroups={allFeatureGroups}
          />
        }
      />

      <div className="mt-6 flex-1 space-y-8">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Overview</h2>
          <p className="text-sm text-muted-foreground">
            {product.description}
          </p>
          <p className="text-xs text-muted-foreground">
            Type: {product.product_type}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Available packages</h2>
          {product.packages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No packages available for this product.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {product.packages.map((pkg, index) => (
                <PackageCard
                  key={pkg.nanoid}
                  pkg={pkg}
                  raw={rawPackages[index]}
                  rawFeatures={rawFeatures.filter(
                    (f): f is PackageFeature => f !== null,
                  )}
                  workspace={ws}
                  product={product.nanoid}
                  featureGroups={allFeatureGroups.filter((g) => g.package === pkg.nanoid)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
