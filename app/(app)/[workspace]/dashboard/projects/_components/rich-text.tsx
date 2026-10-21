import { sanitizeNoteHtml } from "@/lib/api/sanitize-note-html";
import { cn } from "@/lib/utils";

interface Props {
  /** The stored HTML. Empty renders nothing. */
  html?: string | null;
  className?: string;
}

/**
 * A read-only rendering of a rich-text body.
 *
 * Project, task and deliverable descriptions are stored as HTML — the
 * legacy app wrote them through a rich-text editor, so a textarea over
 * them would destroy the formatting on the first save. The markup is
 * sanitised before it reaches `dangerouslySetInnerHTML`: the description is
 * author-supplied HTML that Django does not clean, and it is rendered in
 * every member's session.
 */
export function RichText({ html, className }: Props) {
  if (!html) return null;

  return (
    <div
      className={cn("nb-prose max-w-[68ch] text-sm", className)}
      dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(html) }}
    />
  );
}
