import { redirect } from "next/navigation";
import { Banner } from "@/components/banner";
import { formatMediumDate } from "@/lib/dates";
import { listProducts, type Product } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { getSubscriptionStateCached } from "@/lib/features/guard";

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
    // Products are a console-admin surface; non-console workspaces get sent
    // back to the dashboard rather than a dead link.
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
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Slug</th>
                  <th className="px-4 py-2 font-medium">Description</th>
                  <th className="px-4 py-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.nanoid} className="border-t">
                    <td className="px-4 py-2 font-medium">{product.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {product.slug ?? "—"}
                    </td>
                    <td className="px-4 py-2">{product.description}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {formatMediumDate(product.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
