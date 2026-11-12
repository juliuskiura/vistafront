"use client";

import { useActionState, useCallback, useState, useEffect } from "react";

import { Plus, Trash2, Copy, ArrowLeft, ShieldAlert } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  createApplicationAction,
  createKeyAction,
  getKeysAction,
  revokeKeyAction,
} from "@/app/(app)/[workspace]/dashboard/developer/actions";
import type { Application, ApiKey } from "@/lib/api/types";
import { formatMediumDate } from "@/lib/dates";

/**
 * Developer console client shell.
 *
 * Manages all UI state: which application's keys are shown, which dialogs
 * are open, the generated key plaintext (shown once), and loading flags.
 * All mutations go through Server Actions in `actions.ts`.
 */
export function DeveloperClient({
  applications,
  workspace,
}: {
  applications: Application[];
  workspace: string;
}) {
  // Which application's keys are currently viewed. `null` means the
  // applications list is shown instead.
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  // Keys for the selected app, loaded on demand.
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);

  // Dialog state
  const [creatingApp, setCreatingApp] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [revokingKey, setRevokingKey] = useState<{ nanoid: string; prefix: string } | null>(null);
  const [showingKey, setShowingKey] = useState<{ full: string } | null>(null);
  // Tracks which key prefixes are currently revealed (expanded).
  const [shownKeys, setShownKeys] = useState<Set<string>>(new Set());

  // Form action states via useActionState
  const [appState, appFormAction, appPending] = useActionState(
    createApplicationAction,
    { status: "idle" },
  );
  const [keyState, keyFormAction, keyPending] = useActionState(
    createKeyAction,
    { status: "idle" },
  );

  const loadKeys = useCallback(
    async (app: Application) => {
      setKeysLoading(true);
      setShownKeys(new Set());
      const result = await getKeysAction({
        workspaceDomain: workspace,
        applicationNanoid: app.nanoid,
      });
      if (result.status === "success") {
        setKeys((result.keys ?? []) as ApiKey[]);
      }
      setKeysLoading(false);
    },
    [workspace],
  );

  const handleRevokeKey = async (nanoid: string, prefix: string) => {
    setRevokingKey({ nanoid, prefix });
    const result = await revokeKeyAction({
      workspaceDomain: workspace,
      keyNanoid: nanoid,
    });
    setRevokingKey(null);
    if (result.status === "success" && selectedApp) {
      await loadKeys(selectedApp);
    }
  };

  const handleCopyKey = (full: string) => {
    navigator.clipboard.writeText(full);
  };

  const backToApps = () => {
    setSelectedApp(null);
    setKeys([]);
  };

  // Reveal the full plaintext key exactly once after creation.
  useEffect(() => {
    if (keyState.status === "success" && keyState.apiKey) {
      setShowingKey({ full: keyState.apiKey });
    }
  }, [keyState.status, keyState.apiKey]);

  return (
    <div className="space-y-6">
      {/* Applications list */}
      {selectedApp === null && (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Applications</h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Machine-to-machine clients that authenticate with API keys.
                Each application owns its scopes and issues keys.
              </p>
            </div>
            {!appPending && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCreatingApp(true)}
              >
                <Plus className="size-3.5" />
                Create application
              </Button>
            )}
          </div>

          <Card className="rounded-3xl border p-5">
            {applications.length === 0 && !appPending && (
              <p className="text-xs text-slate-600">
                No applications yet. Create one to start issuing API keys.
              </p>
            )}

            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Scopes</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Keys</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase text-right">Created</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr
                    key={app.nanoid}
                    className="border-b border-slate-200 last:border-0"
                  >
                    <td className="py-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedApp(app);
                          loadKeys(app);
                        }}
                        className="flex items-center gap-2 text-sm font-medium text-slate-900 hover:underline"
                      >
                        {app.application_name}
                        <ArrowLeft className="size-3.5" />
                      </button>
                      {app.description && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {app.description}
                        </p>
                      )}
                    </td>
                    <td className="py-4 text-xs text-slate-600">
                      {app.scopes.length > 0 ? (
                        <span className="flex flex-wrap gap-1.5">
                          {app.scopes.map((scope) => (
                            <span
                              key={scope}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700"
                            >
                              {scope}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-4 text-sm font-medium text-slate-900">
                      {app.key_count}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          app.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {app.is_active ? (
                          <>
                            <ShieldAlert className="size-3" /> Active
                          </>
                        ) : (
                          <>Inactive</>
                        )}
                      </span>
                    </td>
                    <td className="py-4 text-xs text-slate-500 text-right">
                      {formatMediumDate(app.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {appState.status === "error" && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm text-rose-900">{appState.message}</p>
            </div>
          )}

          {/* Create Application dialog */}
          <Dialog open={creatingApp} onOpenChange={setCreatingApp}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create application</DialogTitle>
                <DialogDescription>
                  Register a new machine-to-machine client. It will be able to
                  issue API keys with the scopes you grant it.
                </DialogDescription>
              </DialogHeader>
              <CreateApplicationForm
                workspace={workspace}
                onClose={() => setCreatingApp(false)}
                formAction={appFormAction}
                pending={appPending}
                state={appState}
              />
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Keys view for selected application */}
      {selectedApp !== null && (
        <>
          <div className="flex items-start justify-between gap-4">
            <Button
              size="sm"
              variant="outline"
              onClick={backToApps}
              className="flex items-center gap-1.5"
            >
              <ArrowLeft className="size-3.5" /> Back to applications
            </Button>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                API Keys — {selectedApp.application_name}
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                The plaintext secret is shown only once at creation. Store it
                securely — it cannot be recovered.
              </p>
            </div>
            {!keysLoading && !keyPending && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCreatingKey(true)}
              >
                <Plus className="size-3.5" />
                Generate key
              </Button>
            )}
          </div>

          <Card className="rounded-3xl border p-5">
            {keys.length === 0 && !keysLoading && (
              <p className="text-xs text-slate-600">
                No API keys yet. Generate one to authenticate machine clients.
              </p>
            )}

            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Prefix</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Created</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Expires</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Last used</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase text-right w-24"></th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => {
                  const isRevoked = key.revoked_at !== null;
                  const isExpired =
                    key.expires_at !== null && new Date(key.expires_at) <= new Date();
                  const isShown = shownKeys.has(key.nanoid);
                  return (
                    <tr
                      key={key.nanoid}
                      className="border-b border-slate-200 last:border-0"
                    >
                      <td className="py-4">
                        <span
                          className={`text-xs font-mono text-slate-900 ${
                            isShown ? "" : "truncate max-w-[8rem]"
                          }`}
                          title={key.prefix}
                        >
                          {isShown ? key.prefix : `${key.prefix.slice(0, 8)}…`}
                        </span>
                        {!isShown && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShownKeys((prev) => {
                                const next = new Set(prev);
                                next.add(key.nanoid);
                                return next;
                              });
                            }}
                            className="ml-2"
                          >
                            Show
                          </Button>
                        )}
                        {isShown && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShownKeys((prev) => {
                                const next = new Set(prev);
                                next.delete(key.nanoid);
                                return next;
                              });
                            }}
                            className="ml-2"
                          >
                            Hide
                          </Button>
                        )}
                      </td>
                      <td className="py-4 text-xs text-slate-500">
                        {formatMediumDate(key.created_at)}
                      </td>
                      <td className="py-4 text-xs text-slate-500">
                        {key.expires_at ? formatMediumDate(key.expires_at) : "—"}
                      </td>
                      <td className="py-4 text-xs text-slate-500">
                        {key.last_used ? formatMediumDate(key.last_used) : "—"}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            isRevoked || isExpired
                              ? "bg-rose-50 text-rose-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {isRevoked ? "Revoked" : isExpired ? "Expired" : "Active"}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyKey(key.prefix)}
                            disabled={revokingKey?.nanoid === key.nanoid}
                            title="Copy key prefix"
                          >
                            <Copy className="size-3.5" />
                          </Button>
                          {!isRevoked && !isExpired && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRevokeKey(key.nanoid, key.prefix)}
                              disabled={revokingKey?.nanoid === key.nanoid}
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {keyState.status === "error" && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm text-rose-900">{keyState.message}</p>
            </div>
          )}

          {/* Create Key dialog */}
          <Dialog open={creatingKey} onOpenChange={setCreatingKey}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate API key</DialogTitle>
                <DialogDescription>
                  Set an optional expiry. The plaintext key is shown only once.
                </DialogDescription>
              </DialogHeader>
              <CreateKeyForm
                workspace={workspace}
                applicationNanoid={selectedApp!.nanoid}
                onClose={() => setCreatingKey(false)}
                formAction={keyFormAction}
                pending={keyPending}
                state={keyState}
              />
            </DialogContent>
          </Dialog>

          {/* Revoke confirm dialog */}
          {revokingKey && (
            <ConfirmDialog
              open={Boolean(revokingKey)}
              onOpenChange={(open) => {
                if (!open) setRevokingKey(null);
              }}
              title="Revoke API key?"
              description={`Revoke access for key ${revokingKey.prefix}…? This cannot be undone.`}
              confirmLabel="Revoke"
              variant="destructive"
              onConfirm={() => handleRevokeKey(revokingKey.nanoid, revokingKey.prefix)}
              confirming={revokingKey !== null}
            />
          )}

          {/* Show key plaintext dialog */}
          {showingKey && (
            <ConfirmDialog
              open={Boolean(showingKey)}
              onOpenChange={(open) => {
                if (!open) setShowingKey(null);
              }}
              title="API key created"
              description={
                <>
                  <p className="mb-3 font-mono text-sm break-all">
                    {showingKey.full}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyKey(showingKey.full)}
                  >
                    <Copy className="size-3.5 mr-2" /> Copy key
                  </Button>
                  <p className="mt-3 text-xs text-slate-500">
                    This is the only time the key is shown. Copy it now — it
                    cannot be recovered.
                  </p>
                </>
              }
              confirmLabel="I've saved the key"
              onConfirm={() => setShowingKey(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

/**
 * Form for creating a new developer application. Bound to the
 * `createApplicationAction` Server Action via `useActionState`.
 */
function CreateApplicationForm({
  workspace,
  onClose,
  formAction,
  pending,
  state,
}: {
  workspace: string;
  onClose: () => void;
  formAction: (formData: FormData) => void;
  pending: boolean;
  state: { status: string; message?: string; fieldErrors?: Record<string, string[] | undefined> };
}) {
  const [scopes, setScopes] = useState("");

  return (
    <form
      action={formAction}
      className="space-y-4"
    >
      <input type="hidden" name="workspace_domain" value={workspace} />
      <input type="hidden" name="scopes" value={scopes} />

      <div className="space-y-3">
        <Label>Application name</Label>
        <Input
          name="application_name"
          defaultValue=""
          required
          maxLength={255}
          placeholder="e.g. My CRM integration"
          disabled={pending}
        />
        {state.status === "error" && state.fieldErrors?.application_name && (
          <p className="text-xs text-rose-600">
            {state.fieldErrors.application_name[0]}
          </p>
        )}

        <Label>Description</Label>
        <Textarea
          name="description"
          defaultValue=""
          placeholder="What does this application do?"
          disabled={pending}
        />

        <Label>Scopes (comma-separated)</Label>
        <Input
          type="text"
          value={scopes}
          onChange={(e) => setScopes(e.target.value)}
          placeholder="prospects:read, campaigns:write"
          disabled={pending}
        />
        <p className="text-xs text-slate-500">
          Available: prospects:create, prospects:read, prospects:update,
          prospects:delete, campaigns:write, campaigns:read
        </p>
        {state.status === "error" && state.fieldErrors?.scopes && (
          <p className="text-xs text-rose-600">
            {state.fieldErrors.scopes[0]}
          </p>
        )}

        <div className="flex items-start gap-3 pt-1">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            defaultChecked
            disabled={pending}
          />
          <Label htmlFor="is_active" className="text-sm text-slate-600">
            Active
          </Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={pending}
        >
          {pending ? "Creating…" : "Create application"}
        </Button>
      </div>

      {state.status === "error" && state.message && (
        <p className="text-xs text-rose-600">{state.message}</p>
      )}
    </form>
  );
}

/**
 * Form for generating a new API key. Bound to the `createKeyAction` Server
 * Action via `useActionState`.
 */
function CreateKeyForm({
  workspace,
  applicationNanoid,
  onClose,
  formAction,
  pending,
  state,
}: {
  workspace: string;
  applicationNanoid: string;
  onClose: () => void;
  formAction: (formData: FormData) => void;
  pending: boolean;
  state: { status: string; message?: string; fieldErrors?: Record<string, string[] | undefined>; apiKey?: string };
}) {
  return (
    <form
      action={formAction}
      className="space-y-4"
    >
      <input type="hidden" name="workspace_domain" value={workspace} />
      <input type="hidden" name="application_nanoid" value={applicationNanoid} />

      <div className="space-y-3">
        <Label>Expires at (optional)</Label>
        <Input
          name="expires_at"
          type="datetime-local"
          defaultValue=""
          disabled={pending}
        />
        <p className="text-xs text-slate-500">
          Leave blank for a key that never expires.
        </p>
        {state.status === "error" && state.fieldErrors?.expires_at && (
          <p className="text-xs text-rose-600">
            {state.fieldErrors.expires_at[0]}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={pending}
        >
          {pending ? "Generating…" : "Generate key"}
        </Button>
      </div>

      {state.status === "error" && state.message && (
        <p className="text-xs text-rose-600">{state.message}</p>
      )}
    </form>
  );
}
