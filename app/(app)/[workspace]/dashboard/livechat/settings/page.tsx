import { requireWorkspace } from "@/lib/auth/server";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Live Chat Settings</h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure live chat behavior for your workspace.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4">
          Auto-Assignment
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          When a customer opens a chat, an available agent is automatically
          assigned to the room.
        </p>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded border border-slate-300 bg-slate-50" />
          <span className="text-sm text-slate-600">Auto-assign available agents</span>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4">
          Room Settings
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Close inactive rooms
              </p>
              <p className="text-xs text-slate-500">
                Automatically close rooms after inactivity
              </p>
            </div>
            <div className="h-5 w-9 rounded-full bg-emerald-500" />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Notify on transfer
              </p>
              <p className="text-xs text-slate-500">
                Send notification when a room is transferred
              </p>
            </div>
            <div className="h-5 w-9 rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
