import { JoinWorkspaceForm } from "@/components/onboarding/join-workspace-form";

/**
 * Join-with-invite page (Server Component).
 *
 * Reads the `code` from the query string and pre-fills the form. The
 * Server Action does the actual redemption and redirects into the
 * workspace.
 */
export default async function JoinWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  return <JoinWorkspaceForm initialCode={code ?? ""} />;
}
