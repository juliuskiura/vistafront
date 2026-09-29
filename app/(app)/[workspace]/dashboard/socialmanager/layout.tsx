import { requireWorkspace } from "@/lib/auth/server";
import { listPlatforms } from "@/lib/api";
import { PlatformBrandProvider } from "@/lib/social/platform-brand-context";
import { SocialManagerLayout } from "./social-manager-layout";

/**
 * Social Manager layout (Server Component).
 *
 * Resolves the active workspace server-side (for the `X-Workspace` header and
 * the `/{domain}/dashboard/socialmanager/...` base paths used by the inner
 * nav), then delegates to the client `SocialManagerLayout` which renders the
 * hero header (home only), the sticky inner navigation, and the child page.
 *
 * The platform catalogue is fetched here so `PlatformBrandProvider` can map a
 * door slug to the brand its icon should wear: a channel connected through the
 * `instagramfb` door reports that slug, and only `auth_destination` says it is
 * really an Instagram channel. One fetch for the whole section — a per-page
 * client fetch would be a request for data the server already resolved.
 *
 * The same list is handed to `SocialManagerLayout` because the "Connect Account"
 * card in the banner draws a disc per connectable network. It renders from the
 * list the server already has rather than opening its own request, so the card
 * is complete on first paint instead of filling in after a round trip.
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

  // `all: true` so an inactive row still contributes its `auth_destination`:
  // a door can be live while the destination row is not, and a missing entry
  // would send the door's icon back to a neutral badge.
  const platforms = await listPlatforms({ all: true, workspace: active.domain }).catch(() => []);

  return (
    <PlatformBrandProvider platforms={platforms}>
      <SocialManagerLayout workspaceDomain={active.domain} platforms={platforms}>
        {children}
      </SocialManagerLayout>
    </PlatformBrandProvider>
  );
}
