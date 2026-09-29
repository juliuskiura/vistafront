import { MessageCircle } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * Round participant avatar with an initials fallback.
 *
 * Hand-rolled because the repo has no `Avatar` primitive, and because the
 * fallback is not decorative: `participant_picture_url` is an empty string
 * whenever the platform did not supply one, and a bare `<img src="">` renders
 * as a broken-image glyph in the middle of the list.
 *
 * A plain `<img>` rather than `next/image` is deliberate — these are Facebook
 * CDN URLs on arbitrary domains, which would each need a `remotePatterns`
 * entry, and the surrounding chat surfaces do the same.
 */
export function InboxAvatar({
  src,
  name,
  className,
}: {
  src: string;
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-xs font-medium text-primary-700",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" loading="lazy" />
      ) : (
        <AvatarFallback name={name} />
      )}
    </span>
  );
}

/** Up to two letters from the display name, or a glyph when there are none. */
function AvatarFallback({ name }: { name: string }) {
  const initials = (name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  if (!initials) {
    return <MessageCircle className="size-4" aria-hidden="true" />;
  }
  return <span aria-hidden="true">{initials}</span>;
}
