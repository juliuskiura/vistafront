#!/usr/bin/env node
/**
 * Fail the build if a browser bundle contains a loopback backend origin.
 *
 * The app and Django share one public host, so client code has no reason to
 * name a backend address: it uses relative paths and `window.location.origin`.
 * When a build-time constant did leak into the client bundle, the OAuth popup
 * silently rejected every valid postMessage event -- the page believed it was
 * talking to `http://localhost:8000` while Django was posting from
 * `https://app.vistasolve.net`, and the origin check threw the message away.
 *
 * That failure is invisible at build time and obvious only in the browser, which
 * is exactly the kind of bug worth a hard build failure. This runs after
 * `next build` (see the `build` / `build:prod` scripts) and scans only the
 * client bundle. Server bundles legitimately contain `http://127.0.0.1:8000`,
 * because server-to-server requests to the Django dev port are intended.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const CLIENT_DIR = join(ROOT, ".next", "static");

/** Loopback hosts that must never appear in a browser-facing URL. */
const LOOPBACK_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"];
/** URL schemes worth checking, including WebSocket variants. */
const SCHEMES = ["https?", "wss?"];

/** Escape a host so it can be embedded in a RegExp source string. */
const escapeHost = (host) => host.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const PATTERNS = SCHEMES.flatMap((scheme) =>
  LOOPBACK_HOSTS.map((host) => ({
    // Matches the origin prefix, e.g. http://localhost:8000 or ws://127.0.0.1.
    // The optional group covers userinfo (user:pass@host) and stops at
    // whitespace, quotes and backslashes.
    regex: new RegExp(
      `${scheme}://(?:[^\\s"'\\\\]*@)?${escapeHost(host)}(?::\\d+)?`,
      "gi",
    ),
    label: `${scheme}://${host}`,
  })),
);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

let scanned = 0;
const offenders = [];

for (const file of walk(CLIENT_DIR)) {
  // Only text-ish assets can contain a URL literal.
  if (!/\.(js|mjs|cjs|html|css|map|json|txt)$/i.test(file)) continue;
  const contents = readFileSync(file, "utf8");
  scanned += 1;

  for (const { regex, label } of PATTERNS) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(contents)) !== null) {
      const at = match.index;
      offenders.push({
        file: relative(ROOT, file),
        label,
        excerpt: contents
          .slice(Math.max(0, at - 60), at + 80)
          .replace(/\s+/g, " ")
          .trim(),
      });
    }
  }
}

if (offenders.length > 0) {
  console.error(
    `\n✗ Loopback origin found in ${offenders.length} place(s) in the client bundle.\n` +
      "  Browser code must stay same-origin: use a relative path or\n" +
      "  window.location.origin, never a compiled-in backend address.\n",
  );
  for (const { file, label, excerpt } of offenders) {
    console.error(`  ${file}\n    found: ${label}\n    ...${excerpt}...`);
  }
  console.error("");
  process.exit(1);
}

console.log(
  `✓ No loopback origins in the client bundle (${scanned} files scanned).`,
);
