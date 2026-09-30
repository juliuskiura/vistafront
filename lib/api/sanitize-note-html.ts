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
  // Filtered down by `sanitizeStyle` in the hook below — `style` is the one
  // attribute on this list that can carry behaviour, so it is never allowed
  // through on DOMPurify's say-so alone.
  "style",
];

/**
 * The only CSS properties a note may carry in a `style` attribute.
 *
 * The editor writes exactly three: `color` and `background-color` from the
 * colour pickers, and `text-align` from the alignment controls. Anything
 * else is stripped. `position`, `z-index`, `overflow`, and the `url()` family
 * are the ones that matter — a note body is author-supplied HTML rendered in
 * every member's session, and an allowed `style` is the classic way to
 * overlay a fake login form on the page it is rendered in.
 */
const ALLOWED_STYLE_PROPERTIES = new Set(["color", "background-color", "text-align"]);

/** `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, or a keyword. */
const SAFE_STYLE_VALUE =
  /^(#[0-9a-f]{3,8}|(rgb|rgba|hsl|hsla)\([0-9a-z%.,\s/]+\)|inherit|transparent|currentcolor|[a-z]{3,20})$/i;

const ALIGNMENTS = new Set(["left", "center", "right", "justify"]);

/**
 * Rebuilds a `style` attribute from scratch out of allowed properties only.
 *
 * Declaration-by-declaration rather than a substring test: a naive
 * `value.includes("color")` check passes `background-image: url(...)` and
 * `-moz-binding`, both of which are worse than what we are filtering.
 */
function sanitizeStyle(value: string): string {
  const kept: string[] = [];

  for (const declaration of value.split(";")) {
    const separator = declaration.indexOf(":");
    if (separator < 0) continue;

    const property = declaration.slice(0, separator).trim().toLowerCase();
    const raw = declaration.slice(separator + 1).trim();
    if (!raw || !ALLOWED_STYLE_PROPERTIES.has(property)) continue;

    if (property === "text-align") {
      if (!ALIGNMENTS.has(raw.toLowerCase())) continue;
    } else if (!SAFE_STYLE_VALUE.test(raw)) {
      continue;
    }

    kept.push(`${property}: ${raw}`);
  }

  return kept.join("; ");
}

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
    // Narrow the one attribute on the allowlist that can carry behaviour.
    // Done here rather than in the config because DOMPurify has no
    // per-property allowlist for CSS.
    if (node.hasAttribute("style")) {
      const safe = sanitizeStyle(node.getAttribute("style") ?? "");
      if (safe) node.setAttribute("style", safe);
      else node.removeAttribute("style");
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
