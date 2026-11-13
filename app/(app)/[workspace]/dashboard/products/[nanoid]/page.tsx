import { notFound, redirect } from "next/navigation";

import { Banner } from "@/components/banner";
import { getProductDetail, type ProductPricing } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { getSubscriptionStateCached } from "@/lib/features/guard";

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

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title={product.name}
        description={product.description}
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
              {product.packages.map((pkg) => (
                <div
                  key={pkg.nanoid}
                  className="flex flex-col rounded-lg border bg-card p-6"
                >
                  {pkg.popular ? (
                    <span className="mb-2 w-fit rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Popular
                    </span>
                  ) : null}
                  <h3 className="text-base font-semibold">{pkg.name}</h3>
                  <p className="mt-1 text-2xl font-bold">{pkg.price}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {pkg.period}
                  </p>
                  {pkg.description ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {pkg.description}
                    </p>
                  ) : null}
                  {pkg.promise ? (
                    <p className="mt-2 text-sm">{String(pkg.promise)}</p>
                  ) : null}
                  {Array.isArray(pkg.features) && pkg.features.length > 0 ? (
                    <ul className="mt-4 space-y-1 text-sm">
                      {pkg.features.map((feature) => (
                        <li key={feature.nanoid} className="flex items-start gap-2">
                          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{feature.name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
