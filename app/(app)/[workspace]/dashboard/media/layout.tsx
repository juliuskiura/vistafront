import { requireWorkspace } from "@/lib/auth/server";
import { MediaLayout } from "./media-layout";

/**
 * Media Library layout (Server Component).
 *
 * Resolves the active workspace server-side (for the `X-Workspace` header and
 * the `/{domain}/dashboard/media/...` base paths used by the inner
 * nav), then delegates to the client `MediaLayout` which renders the
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
    <MediaLayout workspaceDomain={active.domain}>
      {children}
    </MediaLayout>
  );
}