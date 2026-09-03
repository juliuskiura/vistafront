"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Save,
  Edit3,
  Globe,
  Copy,
  Check,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  ContentConstraint,
  MediaConstraint,
  PlatformContentFormat,
  SocialMediaPlatform,
} from "@/lib/api/types";
import { getPlatformTheme } from "@/components/platform-themes";
import {
  createPlatformAction,
  updatePlatformAction,
  deletePlatformAction,
  createContentFormatAction,
  updateContentFormatAction,
  deleteContentFormatAction,
  createConstraintAction,
  updateConstraintAction,
  deleteConstraintAction,
  createMediaSpecAction,
  updateMediaSpecAction,
  deleteMediaSpecAction,
} from "../actions";

/* ──────────────────────────────────────────────────────────────────────
 * Platform Config Client — configure platforms, OAuth credentials,
 * content formats, constraints, and media specs.
 * ────────────────────────────────────────────────────────────────────── */

interface Props {
  platforms: SocialMediaPlatform[];
  contentFormats: PlatformContentFormat[];
  constraints: ContentConstraint[];
  workspaceDomain: string;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PlatformForm({
  platform,
  onSave,
  onDelete,
  isNew,
}: {
  platform: Partial<SocialMediaPlatform>;
  onSave: (data: Record<string, unknown>) => void;
  onDelete?: () => void;
  isNew?: boolean;
}) {
  const [name, setName] = useState(platform.name || "");
  const [slug, setSlug] = useState(platform.slug || "");
  const [clientId, setClientId] = useState(platform.client_id || "");
  const [redirectUri, setRedirectUri] = useState(platform.redirect_uri || "");
  const [scopes, setScopes] = useState(platform.scopes || "");
  const [color, setColor] = useState(platform.color || "");
  const [textColor, setTextColor] = useState(platform.text_color || "");
  const [hoverColor, setHoverColor] = useState(platform.hover_color || "");
  const [svg, setSvg] = useState(platform.svg || "");
  const [isActive, setIsActive] = useState(platform.is_active ?? true);

  const theme = getPlatformTheme(slug);

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${theme.bg} ${theme.border}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">{name || "New Platform"}</span>
          {slug && <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${theme.badge}`}>{slug}</span>}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-[10px] text-slate-600" title="Deployment status — disable to bypass this platform while it is still in development.">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-3 w-3" />
            Deployed
          </label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() =>
              onSave({
                name,
                slug,
                client_id: clientId,
                redirect_uri: redirectUri,
                scopes,
                color,
                text_color: textColor,
                hover_color: hoverColor,
                svg,
                is_active: isActive,
              })
            }
          >
            <Save className="h-3.5 w-3.5" />
          </Button>
          {!isNew && onDelete && (
            <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[10px]">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs bg-white" />
        </div>
        <div>
          <Label className="text-[10px]">Slug</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="h-8 text-xs bg-white font-mono" />
        </div>
        <div className="col-span-2">
          <Label className="text-[10px]">Client ID / App ID</Label>
          <Input value={clientId} onChange={(e) => setClientId(e.target.value)} className="h-8 text-xs bg-white font-mono" />
        </div>
        <div className="col-span-2">
          <Label className="text-[10px]">Redirect URI</Label>
          <Input value={redirectUri} onChange={(e) => setRedirectUri(e.target.value)} className="h-8 text-xs bg-white font-mono" />
        </div>
        <div className="col-span-2">
          <Label className="text-[10px]">Scopes</Label>
          <Input value={scopes} onChange={(e) => setScopes(e.target.value)} className="h-8 text-xs bg-white font-mono" />
        </div>
        <div>
          <Label className="text-[10px]">Color</Label>
          <Input value={color} onChange={(e) => setColor(e.target.value)} className="h-8 text-xs bg-white" />
        </div>
        <div>
          <Label className="text-[10px]">Text Color</Label>
          <Input value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-8 text-xs bg-white" />
        </div>
        <div className="col-span-2">
          <Label className="text-[10px]">SVG Icon</Label>
          <textarea
            value={svg}
            onChange={(e) => setSvg(e.target.value)}
            className="w-full h-16 rounded-lg border border-input bg-white px-3 py-2 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  );
}

function ConstraintList({
  contentFormatNanoid,
  platformSlug,
  ws,
  constraints,
}: {
  contentFormatNanoid: string;
  platformSlug: string;
  ws: string;
  constraints: ContentConstraint[];
}) {
  const [newConstraint, setNewConstraint] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const filtered = constraints.filter((c) => c.content_format === contentFormatNanoid);

  return (
    <div className="space-y-2 pl-2 border-l-2 border-slate-100">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase text-slate-400">Constraints</span>
        <Button type="button" size="sm" variant="ghost" className="h-5 text-[10px] gap-1" onClick={() => setNewConstraint(!newConstraint)}>
          <Plus className="h-2.5 w-2.5" /> Add
        </Button>
      </div>

      {newConstraint && (
        <div className="rounded-lg border border-dashed border-slate-300 p-2 space-y-2 bg-white">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Char limit" type="number" className="h-7 text-xs" id={`nc-${contentFormatNanoid}-cl`} />
            <Input placeholder="Max hashtags" type="number" className="h-7 text-xs" id={`nc-${contentFormatNanoid}-mh`} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setNewConstraint(false)}>Cancel</Button>
            <Button
              type="button"
              size="sm"
              className="h-6 text-xs"
              onClick={() => {
                const cl = (document.getElementById(`nc-${contentFormatNanoid}-cl`) as HTMLInputElement)?.value;
                const mh = (document.getElementById(`nc-${contentFormatNanoid}-mh`) as HTMLInputElement)?.value;
                createConstraintAction(
                  {
                    platform: platformSlug,
                    content_format: contentFormatNanoid,
                    character_limit: cl ? Number(cl) : null,
                    max_hashtags: mh ? Number(mh) : null,
                  },
                  ws,
                );
                setNewConstraint(false);
              }}
            >
              Create
            </Button>
          </div>
        </div>
      )}

      {filtered.map((c) => (
        <div key={c.nanoid} className="rounded border border-slate-100 bg-white overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === c.nanoid ? null : c.nanoid)}
            className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] hover:bg-slate-50 cursor-pointer"
          >
            <span>{c.character_limit ? `${c.character_limit.toLocaleString()} chars` : "No char limit"}</span>
            <span className="flex items-center gap-2 text-slate-400">
              {c.max_hashtags && <span>Max {c.max_hashtags} tags</span>}
              {expanded === c.nanoid ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </span>
          </button>

          {expanded === c.nanoid && (
            <div className="border-t border-slate-100 p-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[9px]">Char Limit</Label>
                  <Input type="number" defaultValue={c.character_limit ?? ""} className="h-7 text-xs" id={`cn-${c.nanoid}-cl`} />
                </div>
                <div>
                  <Label className="text-[9px]">Max Hashtags</Label>
                  <Input type="number" defaultValue={c.max_hashtags ?? ""} className="h-7 text-xs" id={`cn-${c.nanoid}-mh`} />
                </div>
                <div>
                  <Label className="text-[9px]">Publishing API</Label>
                  <Input defaultValue={c.publishing_api ?? ""} className="h-7 text-xs" id={`cn-${c.nanoid}-api`} />
                </div>
                <div>
                  <Label className="text-[9px]">Publishing Endpoint</Label>
                  <Input defaultValue={c.publishing_endpoint ?? ""} className="h-7 text-xs" id={`cn-${c.nanoid}-ep`} />
                </div>
                <div className="col-span-2">
                  <Label className="text-[9px]">Reference URL</Label>
                  <Input defaultValue={c.reference_url ?? ""} className="h-7 text-xs" id={`cn-${c.nanoid}-ref`} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-[10px]">
                  <input type="checkbox" defaultChecked={c.is_ephemeral} className="h-3 w-3" id={`cn-${c.nanoid}-eph`} />
                  Ephemeral
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" size="sm" variant="ghost" className="h-6 text-[10px] text-red-500" onClick={() => deleteConstraintAction(c.nanoid, ws)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-6 text-[10px]"
                  onClick={() => {
                    const cl = (document.getElementById(`cn-${c.nanoid}-cl`) as HTMLInputElement)?.value;
                    const mh = (document.getElementById(`cn-${c.nanoid}-mh`) as HTMLInputElement)?.value;
                    const api = (document.getElementById(`cn-${c.nanoid}-api`) as HTMLInputElement)?.value;
                    const ep = (document.getElementById(`cn-${c.nanoid}-ep`) as HTMLInputElement)?.value;
                    const ref = (document.getElementById(`cn-${c.nanoid}-ref`) as HTMLInputElement)?.value;
                    const eph = (document.getElementById(`cn-${c.nanoid}-eph`) as HTMLInputElement)?.checked;
                    updateConstraintAction(
                      c.nanoid,
                      {
                        character_limit: cl ? Number(cl) : null,
                        max_hashtags: mh ? Number(mh) : null,
                        is_ephemeral: eph,
                        publishing_api: api || "",
                        publishing_endpoint: ep || "",
                        reference_url: ref || "",
                      },
                      ws,
                    );
                  }}
                >
                  <Save className="h-3 w-3 mr-1" /> Save
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MediaSpecList({
  mediaConstraints,
  constraintNanoid,
  ws,
}: {
  mediaConstraints: MediaConstraint[];
  constraintNanoid: string;
  ws: string;
}) {
  const [showNew, setShowNew] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newType, setNewType] = useState("");
  const [newAspect, setNewAspect] = useState("");
  const [newMaxWidth, setNewMaxWidth] = useState("");

  const readNum = (id: string) => {
    const v = (document.getElementById(id) as HTMLInputElement)?.value;
    return v !== "" && v != null ? Number(v) : null;
  };

  return (
    <div className="space-y-2 pl-2 border-l-2 border-slate-100 mt-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase text-slate-400">Media Specs</span>
        <Button type="button" size="sm" variant="ghost" className="h-5 text-[10px] gap-1" onClick={() => setShowNew(!showNew)}>
          <Plus className="h-2.5 w-2.5" /> Add
        </Button>
      </div>

      {showNew && (
        <div className="rounded-lg border border-dashed border-slate-300 p-2 space-y-2 bg-white">
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Type (image/video/text)" className="h-7 text-xs" value={newType} onChange={(e) => setNewType(e.target.value)} />
            <Input placeholder="Aspect (e.g. 1:1)" className="h-7 text-xs" value={newAspect} onChange={(e) => setNewAspect(e.target.value)} />
            <Input placeholder="Max width" type="number" className="h-7 text-xs" value={newMaxWidth} onChange={(e) => setNewMaxWidth(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button
              type="button"
              size="sm"
              className="h-6 text-xs"
              onClick={() => {
                if (newType) {
                  createMediaSpecAction(
                    {
                      content_constraint: constraintNanoid,
                      media_type: newType as MediaConstraint["media_type"],
                      aspect_ratio: newAspect || "",
                      max_width: newMaxWidth ? Number(newMaxWidth) : null,
                    },
                    ws,
                  );
                  setShowNew(false);
                  setNewType("");
                  setNewAspect("");
                  setNewMaxWidth("");
                }
              }}
            >
              Create
            </Button>
          </div>
        </div>
      )}

      {mediaConstraints.length === 0 ? (
        <p className="text-[10px] text-slate-400 py-1">No media specs.</p>
      ) : (
        mediaConstraints.map((s) => (
          <div key={s.nanoid} className="rounded border border-slate-100 bg-white overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === s.nanoid ? null : s.nanoid)}
              className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] hover:bg-slate-50 cursor-pointer"
            >
              <span className="capitalize">{s.media_type}</span>
              <span className="flex items-center gap-2 text-slate-400">
                <span className="font-mono">{s.aspect_ratio || "—"}</span>
                {expanded === s.nanoid ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </span>
            </button>

            {expanded === s.nanoid && (
              <div className="border-t border-slate-100 p-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[9px]">Min Width</Label>
                    <Input type="number" defaultValue={s.min_width ?? ""} className="h-7 text-xs" id={`ms-${s.nanoid}-minw`} />
                  </div>
                  <div>
                    <Label className="text-[9px]">Max Width</Label>
                    <Input type="number" defaultValue={s.max_width ?? ""} className="h-7 text-xs" id={`ms-${s.nanoid}-maxw`} />
                  </div>
                  <div>
                    <Label className="text-[9px]">Min Height</Label>
                    <Input type="number" defaultValue={s.min_height ?? ""} className="h-7 text-xs" id={`ms-${s.nanoid}-minh`} />
                  </div>
                  <div>
                    <Label className="text-[9px]">Max Height</Label>
                    <Input type="number" defaultValue={s.max_height ?? ""} className="h-7 text-xs" id={`ms-${s.nanoid}-maxh`} />
                  </div>
                  <div>
                    <Label className="text-[9px]">Min Duration (s)</Label>
                    <Input type="number" defaultValue={s.min_duration ?? ""} className="h-7 text-xs" id={`ms-${s.nanoid}-mind`} />
                  </div>
                  <div>
                    <Label className="text-[9px]">Max Duration (s)</Label>
                    <Input type="number" defaultValue={s.max_duration ?? ""} className="h-7 text-xs" id={`ms-${s.nanoid}-maxd`} />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" size="sm" variant="ghost" className="h-6 text-[10px] text-red-500" onClick={() => deleteMediaSpecAction(s.nanoid, ws)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-6 text-[10px]"
                    onClick={() =>
                      updateMediaSpecAction(
                        s.nanoid,
                        {
                          min_width: readNum(`ms-${s.nanoid}-minw`),
                          max_width: readNum(`ms-${s.nanoid}-maxw`),
                          min_height: readNum(`ms-${s.nanoid}-minh`),
                          max_height: readNum(`ms-${s.nanoid}-maxh`),
                          min_duration: readNum(`ms-${s.nanoid}-mind`),
                          max_duration: readNum(`ms-${s.nanoid}-maxd`),
                        },
                        ws,
                      )
                    }
                  >
                    <Save className="h-3 w-3 mr-1" /> Save
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function OauthSetupCard({ platformSlug, platformName }: { platformSlug: string; platformName: string }) {
  const [copied, setCopied] = useState(false);
  const secretEnvVar = `${platformSlug.toUpperCase()}_SECRET`;
  const redirectUri = `/oauth/callback/${platformSlug}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(redirectUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable; ignore */
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 space-y-2">
      <p className="text-[11px] font-semibold text-indigo-900">OAuth setup for {platformName}</p>
      <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
        <li>Enter the App ID / Client ID above (from the {platformName} developer console).</li>
        <li>
          Copy the redirect URI below and register it as a &quot;Valid OAuth Redirect URI&quot; in the
          {platformName} app.
        </li>
        <li>
          Set the app secret server-side via the <code className="font-mono">{secretEnvVar}</code> environment
          variable (never stored in the database).
        </li>
      </ol>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded bg-white border border-slate-200 px-2 py-1 text-[10px] font-mono text-slate-700">{redirectUri}</code>
        <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}

function ConfigDetailsTable({ platform }: { platform: SocialMediaPlatform }) {
  const rows: [string, ReactNode][] = [
    ["Name", platform.name],
    ["Slug", <span key="slug" className="font-mono">{platform.slug}</span>],
    ["Status", platform.is_active ? "Active" : "Inactive"],
    ["Client ID", platform.client_id ? <span key="cid" className="font-mono">{platform.client_id.slice(0, 20)}…</span> : "—"],
    ["Redirect URI", platform.redirect_uri ? <span key="ru" className="font-mono text-[10px] break-all">{platform.redirect_uri}</span> : "—"],
    [
      "Scopes",
      platform.scopes
        ? platform.scopes
            .split(",")
            .map((scope) => scope.trim())
            .filter(Boolean)
            .map((scope) => (
              <span key={scope} className="mr-1 inline-block rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono">
                {scope}
              </span>
            ))
        : "none",
    ],
    ["Created", new Date(platform.created_at).toLocaleString()],
    ["Updated", new Date(platform.updated_at).toLocaleString()],
  ];
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k} className="border-b border-slate-100 last:border-0">
            <td className="w-40 py-1.5 text-xs font-medium text-slate-500 align-top">{k}</td>
            <td className="py-1.5 text-xs text-slate-800">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function NewFormatForm({ platformNanoid, ws, onCreated }: { platformNanoid: string; ws: string; onCreated?: () => void }) {
  const [format, setFormat] = useState("");
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-3 space-y-2 bg-white">
      <div className="grid grid-cols-3 gap-2">
        <Input placeholder="Format (e.g. post)" className="h-7 text-xs" value={format} onChange={(e) => setFormat(e.target.value)} />
        <Input placeholder="Code (e.g. fb_post)" className="h-7 text-xs" value={code} onChange={(e) => setCode(e.target.value)} />
        <Input placeholder="Display name" className="h-7 text-xs" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          size="sm"
          className="h-7 text-xs"
          onClick={() => {
            if (format && code && displayName) {
              createContentFormatAction({ platform: platformNanoid, format, code, display_name: displayName }, ws);
              setFormat("");
              setCode("");
              setDisplayName("");
              onCreated?.();
            }
          }}
        >
          Create
        </Button>
      </div>
    </div>
  );
}

function FormatDetail({
  format,
  ws,
  constraints,
  onClose,
}: {
  format: PlatformContentFormat;
  ws: string;
  constraints: ContentConstraint[];
  onClose: () => void;
}) {
  const constraint = constraints.find((c) => c.content_format === format.nanoid) || null;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(format.display_name);
  const [key, setKey] = useState(format.format);
  const [code, setCode] = useState(format.code);
  const [active, setActive] = useState(format.is_active);

  return (
    <div className="rounded-lg border bg-slate-50 p-3 space-y-3 mt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900">{format.display_name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${format.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            {format.is_active ? "Active" : "Disabled"}
          </span>
          <span className="font-mono text-[10px] text-slate-500">{format.code}</span>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing((v) => !v)}>
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onClose}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {editing && (
        <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px]">Format</Label>
              <Input value={key} onChange={(e) => setKey(e.target.value)} className="h-7 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">Code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} className="h-7 text-xs font-mono" />
            </div>
            <div>
              <Label className="text-[10px]">Display Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-7 text-xs" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-[10px] text-slate-600">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-3 w-3" />
              Active
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-red-500" onClick={() => { deleteContentFormatAction(format.nanoid, ws); onClose(); }}>
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  updateContentFormatAction(format.nanoid, { format: key, code, display_name: name, is_active: active }, ws);
                  setEditing(false);
                }}
              >
                <Save className="h-3 w-3 mr-1" /> Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {constraint ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-600">
          <span>Character limit: <b className="text-slate-800">{constraint.character_limit?.toLocaleString() ?? "—"}</b></span>
          <span>Max hashtags: <b className="text-slate-800">{constraint.max_hashtags ?? "—"}</b></span>
          <span>Ephemeral: <b className="text-slate-800">{constraint.is_ephemeral ? "Yes" : "No"}</b></span>
          {constraint.publishing_api && <span>Publishing API: <b className="text-slate-800">{constraint.publishing_api}</b></span>}
          {constraint.publishing_endpoint && <span>Endpoint: <b className="text-slate-800 font-mono">{constraint.publishing_endpoint}</b></span>}
        </div>
      ) : (
        <p className="text-[10px] text-slate-400">No constraint configured for this format.</p>
      )}

      <ConstraintList contentFormatNanoid={format.nanoid} platformSlug={format.platform} ws={ws} constraints={constraints} />
      <MediaSpecList mediaConstraints={constraint?.media_constraints || []} constraintNanoid={constraint?.nanoid || ""} ws={ws} />
    </div>
  );
}

function PlatformDetail({
  platform,
  ws,
  formats,
  constraints,
  onClose,
}: {
  platform: SocialMediaPlatform;
  ws: string;
  formats: PlatformContentFormat[];
  constraints: ContentConstraint[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [showNewFormat, setShowNewFormat] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<PlatformContentFormat | null>(null);
  const platformFormats = formats.filter((f) => f.platform === platform.nanoid);

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Back to platforms
        </Button>
        {!editing && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit platform
          </Button>
        )}
      </div>

      {editing ? (
        <PlatformForm
          platform={platform}
          onSave={(d) => {
            updatePlatformAction(platform.nanoid, d, ws);
            setEditing(false);
            router.refresh();
          }}
          onDelete={() => {
            deletePlatformAction(platform.nanoid, ws);
            onClose();
          }}
        />
      ) : (
        <div className="space-y-3">
          <ConfigDetailsTable platform={platform} />
          <OauthSetupCard platformSlug={platform.slug} platformName={platform.name} />
        </div>
      )}

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold">Content Formats</span>
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setShowNewFormat((v) => !v)}>
            <Plus className="h-3.5 w-3.5" /> Add format
          </Button>
        </div>
        {showNewFormat && (
          <div className="mb-2">
            <NewFormatForm
              platformNanoid={platform.nanoid}
              ws={ws}
              onCreated={() => setShowNewFormat(false)}
            />
          </div>
        )}

        {selectedFormat ? (
          <FormatDetail
            format={selectedFormat}
            ws={ws}
            constraints={constraints}
            onClose={() => setSelectedFormat(null)}
          />
        ) : (
          <div className="rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 text-left">Format</th>
                  <th className="px-4 py-2.5 text-left">Code</th>
                  <th className="px-4 py-2.5 text-left">Display Name</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {platformFormats.length === 0 && (
                  <tr>
                    <td colSpan={4} className="h-20 px-4 text-center text-sm text-muted-foreground">
                      No content formats configured yet.
                    </td>
                  </tr>
                )}
                {platformFormats.map((f) => (
                  <tr
                    key={f.nanoid}
                    onClick={() => setSelectedFormat(f)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-900">{f.format}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{f.code}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-700">{f.display_name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${f.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {f.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function PlatformConfigClient({
  platforms: initialPlatforms,
  contentFormats: initialFormats,
  constraints,
  workspaceDomain,
}: Props) {
  const ws = workspaceDomain.toLowerCase();
  const router = useRouter();
  const [platforms, setPlatforms] = useState(initialPlatforms);
  const [formats, setFormats] = useState(initialFormats);
  const [showNew, setShowNew] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialMediaPlatform | null>(null);

  const formatCountBySlug = useMemo(() => {
    const m: Record<string, number> = {};
    for (const f of formats) m[f.platform] = (m[f.platform] || 0) + 1;
    return m;
  }, [formats]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Platform Configuration</h2>
          <p className="text-sm text-slate-500 mt-1">Configure social media platforms, OAuth credentials, and content constraints.</p>
        </div>
        {!selectedPlatform && (
          <Button size="sm" onClick={() => setShowNew(!showNew)}>
            <Plus className="h-4 w-4 mr-2" /> Add Platform
          </Button>
        )}
      </div>

      {selectedPlatform ? (
        <PlatformDetail
          platform={selectedPlatform}
          ws={ws}
          formats={formats}
          constraints={constraints}
          onClose={() => {
            setSelectedPlatform(null);
            router.refresh();
          }}
        />
      ) : (
        <>
          {showNew && (
            <PlatformForm
              platform={{}}
              isNew
              onSave={(data) => {
                createPlatformAction(data, ws);
                setShowNew(false);
                router.refresh();
              }}
              onDelete={() => setShowNew(false)}
            />
          )}

          <div className="rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 text-left">Platform</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                  <th className="px-4 py-2.5 text-left">Formats</th>
                  <th className="px-4 py-2.5 text-left">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {platforms.length === 0 && (
                  <tr>
                    <td colSpan={4} className="h-24 px-4 text-center text-sm text-muted-foreground">
                      No platforms configured yet.
                    </td>
                  </tr>
                )}
                {platforms.map((p) => {
                  const theme = getPlatformTheme(p.slug);
                  const count = formatCountBySlug[p.nanoid];
                  return (
                    <tr key={p.nanoid} onClick={() => setSelectedPlatform(p)} className="cursor-pointer hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-3">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${theme.border} ${theme.badge}`}>
                            {p.slug.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="text-left">
                            <span className="block text-sm font-bold text-slate-900">{p.name}</span>
                            <span className="block font-mono text-[10px] text-slate-500">{p.slug}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">
                        {count != null ? `${count} format${count === 1 ? "" : "s"}` : "—"}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-xs text-slate-500">{formatDate(p.updated_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
