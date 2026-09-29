import { SocialIcon, SocialIconSolid, hasSocialIconSolid } from "@/components/social-icons";
import { cn } from "@/lib/utils";
import { discClassName } from "./disc";

/**
 * One platform logo inside a white disc.
 *
 * Three tiers, because the icon registry is not uniformly populated and an
 * empty hole in the row would read as a rendering bug:
 *
 * 1. **Solid glyph** — a filled mark reads as a logo at 18px; an outline of the
 *    same shape reads as a wireframe. Preferred wherever one is registered.
 * 2. **Outline glyph** — for a brand with no filled variant (`start_page`).
 * 3. **Two-letter badge** — a platform seeded in the backend before anyone drew
 *    a glyph for it. The caller filters these out via `selectShowcasePlatforms`,
 *    so this is the belt to that braces.
 */
export function PlatformCircle({
  brand,
  name,
  className,
}: {
  /** Brand slug — the key `SocialIconSolid` / `SocialIcon` resolve. */
  brand: string;
  /** Display name, used for the hover title and the screen-reader summary. */
  name: string;
  className?: string;
}) {
  return (
    <span className={cn(discClassName(), className)} title={name}>
      {hasSocialIconSolid(brand) ? (
        <SocialIconSolid name={brand} size={18} className="text-slate-800" />
      ) : (
        <SocialIcon
          name={brand}
          size={18}
          strokeWidth={2.25}
          className="text-slate-700"
        />
      )}
    </span>
  );
}
