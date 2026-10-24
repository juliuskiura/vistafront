import { requireWorkspace } from "@/lib/auth/server";
import { TasksLayout } from "./tasks-shell";

export default async function TasksLayoutServer({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  return <TasksLayout workspaceDomain={active.domain}>{children}</TasksLayout>;
}
