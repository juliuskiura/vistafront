import type { CompanySocialLink } from "@/lib/api/types";

/**
 * The textarea format for a company's social links.
 *
 * One link per line: `name | url`, or just `url` when the link has no name.
 * A leading `*` marks the primary link — the one the record header stars.
 *
 * The `*` marker matters: without it the round trip through the textarea
 * would silently drop `is_primary`, and the header would stop starring the
 * link the user picked.
 */
export const SOCIAL_LINK_PRIMARY_MARKER = "*";

/**
 * Render social links as the textarea's contents.
 *
 * Inverse of `parseSocialLinks` — formatting then parsing returns the same
 * links, primary flag included.
 */
export function formatSocialLinks(
  links: CompanySocialLink[] | undefined | null,
): string {
  return (links ?? [])
    .map((link) => {
      const primary = link.is_primary ? `${SOCIAL_LINK_PRIMARY_MARKER} ` : "";
      const name = link.name ? `${link.name} | ` : "";
      return `${primary}${name}${link.url}`;
    })
    .join("\n");
}

/**
 * Parse the textarea back into social links.
 *
 * A malformed line is skipped rather than failing the whole save — losing
 * one typo is better than losing the edit.
 */
export function parseSocialLinks(value: string): CompanySocialLink[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      let rest = line;
      let isPrimary = false;
      if (rest.startsWith(SOCIAL_LINK_PRIMARY_MARKER)) {
        isPrimary = true;
        rest = rest.slice(SOCIAL_LINK_PRIMARY_MARKER.length).trim();
      }

      const [maybeName, maybeUrl] = rest.includes("|")
        ? rest.split("|").map((part) => part.trim())
        : [undefined, rest];

      const url = (maybeUrl ?? maybeName ?? "").trim();
      const name = rest.includes("|") ? maybeName : undefined;

      return {
        url,
        ...(name ? { name } : {}),
        ...(isPrimary ? { is_primary: true } : {}),
      };
    })
    .filter((link) => link.url.length > 0);
}
