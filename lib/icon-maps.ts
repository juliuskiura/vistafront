import {
  Layers,
  Share2,
  FolderGit2,
  Cpu,
  FileText,
  FolderKanban,
  Sparkles,
  ShieldCheck,
  Clock,
  BarChart3,
  Users,
  Database,
  ListChecks,
  PackageCheck,
  Plug,
  BrainCircuit,
} from "@/lib/icons";
import type { LucideIcon } from "lucide-react";

export type Tone =
  | "primary"
  | "secondary"
  | "emerald"
  | "amber"
  | "purple"
  | "rose"
  | "sky"
  | "slate";

export const TONES: Record<Tone, { iconBg: string; iconColor: string }> = {
  primary: { iconBg: "bg-primary-50", iconColor: "text-primary-600" },
  secondary: { iconBg: "bg-secondary-50", iconColor: "text-secondary-600" },
  emerald: { iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  amber: { iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  purple: { iconBg: "bg-purple-50", iconColor: "text-purple-600" },
  rose: { iconBg: "bg-rose-50", iconColor: "text-rose-600" },
  sky: { iconBg: "bg-sky-50", iconColor: "text-sky-600" },
  slate: { iconBg: "bg-slate-50", iconColor: "text-slate-600" },
};

export type CapabilityGlyph = { icon: LucideIcon; tone: Tone };

/**
 * App-level defaults — every feature in this app uses these unless overridden
 * in FEATURES_STYLES below.
 */
export const APP_STYLES: Record<string, CapabilityGlyph> = {
  workspaces: { icon: Layers, tone: "primary" },
  socialmanager: { icon: Share2, tone: "secondary" },
  media_libary: { icon: FolderGit2, tone: "purple" },
  media_processing: { icon: Cpu, tone: "rose" },
  notebook: { icon: FileText, tone: "emerald" },
  projectmanager: { icon: FolderKanban, tone: "amber" },
  aimodels: { icon: Sparkles, tone: "sky" },
};

/**
 * Feature-level overrides — map full `featureKey` (e.g. "socialmanager.posts")
 * to a specific icon + tone. Features not listed here fall back to APP_STYLES
 * by app_key prefix, then to FALLBACK.
 */
export const FEATURES_STYLES: Record<string, CapabilityGlyph> = {
  // workspaces
  "workspaces.workspaces": { icon: Layers, tone: "primary" },
  "workspaces.membership": { icon: ShieldCheck, tone: "emerald" },

  // socialmanager
  "socialmanager.posts": { icon: Share2, tone: "secondary" },
  "socialmanager.scheduling": { icon: Clock, tone: "secondary" },
  "socialmanager.analytics": { icon: BarChart3, tone: "amber" },
  "socialmanager.comments": { icon: Users, tone: "amber" },

  // media_libary
  "media_libary.assets": { icon: FolderGit2, tone: "purple" },
  "media_libary.collections": { icon: Database, tone: "purple" },

  // media_processing
  "media_processing.transforms": { icon: Cpu, tone: "rose" },

  // notebook
  "notebook.notes": { icon: FileText, tone: "emerald" },

  // projectmanager
  "projectmanager.projects": { icon: FolderKanban, tone: "amber" },
  "projectmanager.tasks": { icon: ListChecks, tone: "amber" },
  "projectmanager.deliverables": { icon: PackageCheck, tone: "emerald" },

  // aimodels
  "aimodels.system": { icon: Sparkles, tone: "sky" },
  "aimodels.bring_your_own": { icon: Plug, tone: "sky" },
  "aimodels.advanced_ai": { icon: BrainCircuit, tone: "sky" },
};

export const FALLBACK: CapabilityGlyph = { icon: Sparkles, tone: "slate" };

export function resolveCapabilityStyle(featureKey?: string | null) {
  // 1. Exact feature match
  if (featureKey && FEATURES_STYLES[featureKey]) {
    const glyph = FEATURES_STYLES[featureKey];
    return { icon: glyph.icon, ...TONES[glyph.tone] };
  }

  // 2. App-level fallback
  const appKey = featureKey?.split(".")[0];
  if (appKey && APP_STYLES[appKey]) {
    const glyph = APP_STYLES[appKey];
    return { icon: glyph.icon, ...TONES[glyph.tone] };
  }

  // 3. Global fallback
  return { icon: FALLBACK.icon, ...TONES[FALLBACK.tone] };
}