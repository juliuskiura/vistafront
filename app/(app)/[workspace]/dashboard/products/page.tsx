import Link from "next/link";
import { redirect } from "next/navigation";

import { Banner } from "@/components/banner";
import { listProducts, type Product } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { getSubscriptionStateCached } from "@/lib/features/guard";
import { formatMediumDate } from "@/lib/dates";

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const { exempt } = await getSubscriptionStateCached(active.nanoid);
  if (!exempt) {
    redirect(`/${ws}/dashboard`);
  }

  const products = await listProducts(ws).catch(() => [] as Product[]);

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="Products"
        description="Every product offered across the platform, with its packages and pricing."
      />
      <div className="mt-6 flex-1">
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products found.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link
                key={product.nanoid}
                href={`/${ws}/dashboard/products/${product.nanoid}`}
                className="group rounded-lg border bg-card p-5 transition hover:shadow-md"
              >
                <h3 className="text-base font-semibold group-hover:text-primary">
                  {product.name}
                </h3>
                {product.slug ? (
                  <p className="mt-1 text-xs text-muted-foreground">{product.slug}</p>
                ) : null}
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                  {product.description}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  Created {formatMediumDate(product.created_at)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
