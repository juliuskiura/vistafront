import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes note HTML before it reaches `dangerouslySetInnerHTML`.
 *
 * Note bodies are stored as an HTML blob authored by any workspace member,
 * and Django does not sanitize them. Rendering that blob raw means a
 * `<script>` tag or an `onerror` attribute stored in one note would execute
 * in every other member's browser with their session — stored XSS across the
 * workspace. This is the only barrier between that and the reader view.
 *
 * The allowlist is deliberately narrow: formatting, links, lists, tables, and
 * code. Anything not named here is stripped, so a tag added to the editor
 * later is inert until it is added here too.
 *
 * Notes:
 *   - `isomorphic-dompurify` pulls in `jsdom` on the server so this can run
 *     inside a Server Component; the browser build uses the native DOM.
 *   - `_blank` links get `rel="noopener noreferrer"`, which
 *     `ALLOWED_ATTR` alone would not force on a link the author wrote.
 *   - `data:` URIs are permitted on `<img>` only. The legacy frontapp editor
 *     fell back to an inline base64 data URL whenever its upload route was
 *     unavailable, so existing notes contain them; blocking them would blank
 *     every image written while uploads were broken.
 *
 * `ALLOWED_URI_REGEXP` is deliberately NOT overridden. DOMPurify's default
 * already rejects `javascript:` and friends, and already permits `data:` only
 * on its `DATA_URI_TAGS` (`img`, `video`, `audio`, …) — which covers the
 * base64-image case. Overriding it with a custom pattern silently strips
 * `colspan` and `rowspan` from every table, because DOMPurify runs the URI
 * test across attribute values; verified against
 * `isomorphic-dompurify@4`, where `ALLOWED_URI_REGEXP` + `ALLOWED_ATTR`
 * containing `colspan` still dropped the attribute.
 */
const ALLOWED_TAGS = [
  "p", "br", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "strike", "del", "ins", "mark", "small",
  "sub", "sup",
  "ul", "ol", "li",
  "a",
  "blockquote",
  "pre", "code",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col",
  "img", "figure", "figcaption",
  "span", "div",
];

const ALLOWED_ATTR = [
  "href",
  "title",
  "target",
  "rel",
  "src",
  "srcset",
  "alt",
  "width",
  "height",
  "align",
  "colspan",
  "rowspan",
  "loading",
  "data-type",
  "data-checked",
  "class",
];

/** `data:image/svg+xml` can carry script; other raster types cannot. */
const SVG_DATA_URI = /^data:image\/svg\+xml/i;

let hooksInstalled = false;

/**
 * Force safe `rel` on every outbound link, and drop SVG data-URIs.
 *
 * DOMPurify hooks are global, so installing on each call would stack them and
 * run the handler N times for the Nth note on a page.
 */
function installHooks() {
  if (hooksInstalled) return;

  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
      node.setAttribute("rel", "noopener noreferrer");
    }
    if (node.tagName === "IMG") {
      const src = node.getAttribute("src") ?? "";
      if (SVG_DATA_URI.test(src)) {
        node.removeAttribute("src");
      }
    }
  });

  hooksInstalled = true;
}

/** Returns an HTML string safe to pass to `dangerouslySetInnerHTML`. */
export function sanitizeNoteHtml(html: string): string {
  if (!html) return "";
  installHooks();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

/**
 * A short plain-text excerpt of a note body, used for card previews.
 *
 * Deriving this on the client from sanitized HTML keeps the card renderer
 * free of the raw `dangerouslySetInnerHTML` call, so only the reader view
 * ever touches markup.
 */
export function excerptFromHtml(html: string, maxLength = 180): string {
  if (!html) return "";
  const text = html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}
