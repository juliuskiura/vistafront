import { sanitizeNoteHtml } from "@/lib/api/sanitize-note-html";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";

interface Props {
  /** The stored HTML. Empty renders nothing. */
  html?: string | null;
  className?: string;
  /** When set, collapse content beyond this many words behind a Read more toggle. */
  words?: number;
}

function truncateHtmlByWords(
  html: string,
  maxWords: number,
): { truncated: string; isTruncated: boolean } {
  const tokens = html.match(/<[^>]+>|[^<]+/g) ?? [];
  let remaining = maxWords;
  const out: string[] = [];
  const stack: string[] = [];
  let ellipsisAdded = false;
  let hasOverflow = false;

  for (const token of tokens) {
    if (remaining <= 0) {
      if (!ellipsisAdded) {
        out.push("…");
        ellipsisAdded = true;
      }
      hasOverflow = true;
      break;
    }

    if (token.startsWith("<")) {
      const isClosing = /^<\s*\//.test(token);
      const isSelfClosing =
        /\/\s*>$/.test(token) ||
        /^<\s*(br|hr|img|input|meta|link|col|embed|source|wbr)\b/i.test(token);
      out.push(token);
      if (isClosing) {
        const name = token
          .match(/^<\s*\/\s*([a-zA-Z0-9]+)/)?.[1]
          ?.toLowerCase();
        if (name && stack.length && stack[stack.length - 1] === name)
          stack.pop();
      } else if (!isSelfClosing) {
        const name = token
          .match(/^<\s*([a-zA-Z0-9]+)/)?.[1]
          ?.toLowerCase();
        if (name) stack.push(name);
      }
    } else {
      const pieces = token.split(/(\s+)/);
      let wordCount = 0;
      let result = "";
      let cut = false;
      for (const piece of pieces) {
        if (piece === "") continue;
        if (/^\s+$/.test(piece)) {
          result += piece;
          continue;
        }
        if (wordCount < remaining) {
          result += piece;
          wordCount++;
        } else {
          cut = true;
          break;
        }
      }
      if (wordCount > 0) out.push(result);
      remaining -= wordCount;

      const originalWords = token.trim().split(/\s+/).filter(Boolean).length;
      if (cut || originalWords > wordCount) {
        if (!ellipsisAdded) {
          out.push("…");
          ellipsisAdded = true;
        }
        hasOverflow = true;
        remaining = 0;
      }
    }
  }

  if (hasOverflow) {
    for (let i = stack.length - 1; i >= 0; i--) {
      out.push(`</${stack[i]}>`);
    }
  }

  return { truncated: out.join(""), isTruncated: hasOverflow };
}

/**
 * A read-only rendering of a rich-text body.
 *
 * Project and task descriptions are stored as HTML — the
 * legacy app wrote them through a rich-text editor, so a textarea over
 * them would destroy the formatting on the first save. The markup is
 * sanitised before it reaches `dangerouslySetInnerHTML`: the description is
 * author-supplied HTML that Django does not clean, and it is rendered in
 * every member's session.
 */
export function RichText({ html, className, words }: Props) {
  const sanitized = html ? sanitizeNoteHtml(html) : "";
  const [expanded, setExpanded] = useState(false);

  const { truncated, isTruncated } = useMemo(() => {
    if (!sanitized || !words) {
      return { truncated: sanitized, isTruncated: false };
    }
    return truncateHtmlByWords(sanitized, words);
  }, [sanitized, words]);

  if (!sanitized) return null;

  const displayHtml = expanded || !isTruncated ? sanitized : truncated;

  return (
    <div>
      <div
        className={cn("nb-prose max-w-[68ch] text-sm", className)}
        dangerouslySetInnerHTML={{ __html: displayHtml }}
      />
      {isTruncated ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-medium text-indigo-600 hover:underline"
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
