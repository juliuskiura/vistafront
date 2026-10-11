import { cn } from "@/lib/utils";

/**
 * A small unread-count pill for the workspace inner nav.
 *
 * Renders nothing at or below zero, so callers can pass a raw count without a
 * surrounding `>{count > 0 &&` guard and without risking a stray "0". Counts
 * over 99 collapse to "99+", matching the thread row and the live-chat badge.
 */
export function NavCountBadge({
  count,
  className,
}: {
  count: number | undefined;
  className?: string;
}) {
  if (!count || count <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
