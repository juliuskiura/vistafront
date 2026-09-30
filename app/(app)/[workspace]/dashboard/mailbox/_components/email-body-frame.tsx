"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { Attachment } from "@/lib/api/mailbox";

const CID_PATTERN = /cid:([^"')\s]+)/gi;

/**
 * Build a self-contained HTML document for the sandboxed iframe.
 *
 * The body arrives already sanitized server-side (`mailbox.renderers.html.HtmlSanitizer`
 * strips <script>, event handlers and `javascript:`/`vbscript:`/`data:` URLs).
 * This function only does presentation transforms:
 *  - inject `<base target="_blank">` so links open in a new tab
 *  - rewrite inline `cid:` image references to their attachment URLs
 *  - optionally neutralise remote images (Gmail's "display images" toggle)
 *
 * The one script in the document is the height reporter we inject ourselves.
 */
function buildSrcDoc(
  html: string,
  attachments: Attachment[],
  blockRemoteImages: boolean,
): string {
  let body = html;

  if (attachments.length > 0) {
    const byCid = new Map<string, string>();
    for (const att of attachments) {
      const cid = att.content_id || att.nanoid;
      if (cid) byCid.set(String(cid).toLowerCase().replace(/[<>]/g, ""), att.url || "");
    }
    body = body.replace(CID_PATTERN, (_m, raw: string) => {
      const url = byCid.get(raw.replace(/[<>]/g, "").toLowerCase());
      return url ? `src="${url}"` : 'src=""';
    });
  }

  if (blockRemoteImages) {
    // Rename src -> data-src so the browser never issues the request, and add
    // no-referrer for when the user does allow images.
    body = body.replace(
      /<img([^>]*?)\ssrc="(https?:\/\/[^"]*)"([^>]*)>/gi,
      '<img$1 data-src="$2" referrerpolicy="no-referrer"$3>',
    );
  } else {
    body = body.replace(
      /<img([^>]*?)\ssrc="(https?:\/\/[^"]*)"([^>]*)>/gi,
      '<img$1 src="$2" referrerpolicy="no-referrer"$3>',
    );
  }

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base target="_blank" rel="noopener noreferrer" />
    <style>
      html, body { margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px; line-height: 1.5; color: #1f2937; word-wrap: break-word;
      }
      img { max-width: 100%; height: auto; }
      a { color: #2563eb; }
      table { border-collapse: collapse; }
      img[data-src] {
        background: #f1f5f9; min-height: 18px;
        outline: 1px dashed #cbd5e1; outline-offset: -1px;
      }
    </style>
  </head>
  <body>
    ${body}
    <script>
      (function () {
        function report() {
          parent.postMessage({ __emailFrameHeight: document.body.scrollHeight }, "*");
        }
        window.addEventListener("load", report);
        setTimeout(report, 300);
        setTimeout(report, 1200);
        document.addEventListener("click", function (e) {
          var a = e.target && e.target.closest && e.target.closest("a");
          if (a && a.getAttribute("href")) {
            a.setAttribute("target", "_blank");
            a.setAttribute("rel", "noopener noreferrer");
          }
        });
      })();
    </script>
  </body>
</html>`;
}

interface EmailBodyFrameProps {
  /** Server-sanitized HTML body. */
  html: string;
  /** Inline (cid:) attachments, used to resolve embedded images. */
  attachments?: Attachment[];
  /** When true, remote images stay unloaded until the user allows them. */
  blockRemoteImages?: boolean;
}

/**
 * Renders an email body the way a mail client does: inside a sandboxed
 * `<iframe srcdoc>`.
 *
 * ## Security
 *
 * The sandbox omits `allow-same-origin`, so the frame runs in an opaque origin:
 * it cannot read our cookies, our `localStorage`, or the parent DOM, and email
 * CSS cannot reach the app shell. The message may also open links in a new tab
 * (hence `allow-popups allow-popups-to-escape-sandbox`), which is why the body
 * must already be sanitized server-side — sandboxing isolates the message, it
 * does not sanitise it.
 *
 * The height reporter posts to `parent` with target origin `"*"`, which is
 * unavoidable: the frame's own origin is opaque, so it cannot name ours. That
 * is safe *because* the listener below checks `event.source` against this
 * specific frame's content window — a message from any other window is
 * ignored, so nothing else on the page can drive our height state.
 */
export function EmailBodyFrame({
  html,
  attachments = [],
  blockRemoteImages = false,
}: EmailBodyFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(200);

  const srcDoc = useMemo(
    () => buildSrcDoc(html, attachments, blockRemoteImages),
    [html, attachments, blockRemoteImages],
  );

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // Only trust the height report from this frame — see the class comment.
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as { __emailFrameHeight?: unknown } | null;
      if (data && typeof data.__emailFrameHeight === "number") {
        const next = data.__emailFrameHeight;
        setHeight(Math.max(80, Math.min(next, 20000)));
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      title="Email message body"
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      srcDoc={srcDoc}
      className="w-full border-0 bg-transparent"
      style={{ height }}
    />
  );
}
