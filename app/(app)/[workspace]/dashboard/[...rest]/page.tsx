import { redirect } from "next/navigation";

/** Unknown `/{workspace}/...` -> the workspace dashboard. */
export default async function WorkspaceFallbackPage({
  params,
}: {
  params: Promise<{ workspace: string; rest: string[] }>;
}) {
  const { workspace } = await params;
  return redirect(`/${workspace}/dashboard`);
}
