import {
  BarChart3,
  CalendarDays,
  ListOrdered,
  PenLine,
  Upload,
  Users,
} from "@/lib/icons";
import type { InnerNavItem } from "@/components/workspace/workspace-inner-nav";

/**
 * Quick actions — the shortcuts behind the header's "Quick Actions" dropdown.
 *
 * This is the single list for the section: `SocialManagerLayout` feeds it to
 * the inner nav, and nothing else re-declares a shortcut of its own. The data
 * and its presentation live in one place, so a new action is one entry here
 * rather than a label in the nav plus a card somewhere below the fold.
 *
 * `href` is a path *fragment* after `/…/dashboard/socialmanager` — the nav
 * composes the absolute path, which is why each one is written with its
 * leading slash.
 *
 * `iconColor` / `iconBg` are full class strings, dark variants included: the
 * tints are light-mode washes, and the nav menu is dark-mode aware, so each
 * tone has to name both. They render as a tinted badge around the icon in the
 * dropdown, so each action is recognisable before its label is read.
 */
export const QUICK_ACTIONS: InnerNavItem[] = [
  {
    label: "Compose",
    description: "Create and schedule posts",
    icon: PenLine,
    href: "/compose",
    iconColor: "text-primary-600 dark:text-primary-300",
    iconBg: "bg-primary-50 dark:bg-primary-950/60",
  },
  {
    label: "Calendar",
    description: "Drag-and-drop scheduling",
    icon: CalendarDays,
    href: "/calendar",
    iconColor: "text-violet-600 dark:text-violet-300",
    iconBg: "bg-violet-50 dark:bg-violet-950/60",
  },
  {
    label: "Queues",
    description: "Repeating post schedules",
    icon: ListOrdered,
    href: "/queues",
    iconColor: "text-emerald-600 dark:text-emerald-300",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/60",
  },
  {
    label: "Bulk Upload",
    description: "Import posts from CSV",
    icon: Upload,
    href: "/bulk-upload",
    iconColor: "text-amber-600 dark:text-amber-300",
    iconBg: "bg-amber-50 dark:bg-amber-950/60",
  },
  {
    label: "Analytics",
    description: "Per-platform insights",
    icon: BarChart3,
    href: "/analytics",
    iconColor: "text-rose-600 dark:text-rose-300",
    iconBg: "bg-rose-50 dark:bg-rose-950/60",
  },
  {
    label: "Connected Channels",
    description: "Connect social channels",
    icon: Users,
    href: "/channels",
    iconColor: "text-sky-600 dark:text-sky-300",
    iconBg: "bg-sky-50 dark:bg-sky-950/60",
  },
];
