import { requireWorkspace } from "@/lib/auth/server";
import { SocialManagerLayout } from "./social-manager-layout";

/**
 * Social Manager layout (Server Component).
 *
 * Resolves the active workspace server-side (for the `X-Workspace` header and
 * the `/{domain}/dashboard/socialmanager/...` base paths used by the inner
 * nav), then delegates to the client `SocialManagerLayout` which renders the
 * hero header (home only), the sticky inner navigation, and the child page.
 */
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  return (
    <SocialManagerLayout workspaceDomain={active.domain}>
      {children}
    </SocialManagerLayout>
  );
}
