import { listWorkspaces } from "@/lib/api";
import { logoutAction } from "@/app/(auth)/logout/action";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";

export default async function RestrictedPage() {
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  try {
    workspaces = await listWorkspaces();
  } catch {
    // Fall through with empty list
  }

  return (
    <AuthShell brandName="Vistasolve">
      <Card className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/30 bg-white/70 p-6 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
        <div className="pointer-events-none absolute -top-20 -right-20 size-48 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 size-48 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="relative">
          <h1 className="text-xl font-semibold">Workspace access unavailable</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You don&apos;t have access to the workspace you requested. Choose
            one of the workspaces you belong to to continue.
          </p>

          <div className="mt-6 space-y-2">
            {workspaces.map((ws) => (
              <a
                key={ws.nanoid}
                href={ws.url}
                className="flex w-full items-center justify-between rounded-lg border border-white/30 bg-white/50 px-4 py-3 text-left backdrop-blur-sm transition-colors hover:bg-white/80 dark:border-white/10 dark:bg-slate-900/40 dark:hover:bg-slate-900/70"
              >
                <span className="font-medium">{ws.name}</span>
                <span className="text-xs text-muted-foreground">
                  {ws.domain}
                </span>
              </a>
            ))}
            {workspaces.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No workspaces found.
              </p>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button
              variant="secondary"
              size="default"
              className="flex-1"
              asChild
            >
              <a href="/onboarding">Back</a>
            </Button>
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="destructive"
                size="default"
                className="flex-1"
              >
                Log out
              </Button>
            </form>
          </div>
        </div>
      </Card>
    </AuthShell>
  );
}
