import { redirect } from "next/navigation";

/** `/{workspace}` (bare) -> `/{workspace}/dashboard` */
export default async function WorkspaceIndexPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  return redirect(`/${workspace}/dashboard`);
}
