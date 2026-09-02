"use client";

import {
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileEdit,
  FileText,
  Flag,
  Folder,
  FolderOpen,
  Globe,
  Handshake,
  Images,
  LayoutDashboard,
  ListOrdered,
  type LucideIcon,
  Mail,
  Search,
  Settings,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  User,
  Users,
  Wrench,
} from "lucide-react";

/**
 * Map of the `icon` strings the backend issues from
 * ``regwakes.navigation.services.NavigationService._serialize`` to the
 * matching ``lucide-react`` export. The icon name comes from each
 * ``NavigationItem.icon`` in ``regwakes/<app>/navitems.py``.
 *
 * Keep this in sync when a new icon is added on the backend. Unknown
 * names fall back to ``LayoutDashboard`` so the UI never collapses.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Globe,
  Mail,
  Users,
  User,
  Building2,
  CalendarDays,
  ListOrdered,
  Upload,
  BarChart3,
  Settings,
  Share2,
  CheckCircle2,
  FileText,
  Flag,
  Handshake,
  Images,
  Trash2,
  FolderOpen,
  Sparkles,
  Folder,
  Search,
  Wrench,
  CreditCard,
  FileEdit,
};

const FALLBACK: LucideIcon = LayoutDashboard;

export function resolveIcon(name: string | null | undefined): LucideIcon {
  if (!name) return FALLBACK;
  return ICON_MAP[name] ?? FALLBACK;
}
