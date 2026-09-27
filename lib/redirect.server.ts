import { NextResponse } from "next/server";

/**
 * Server-only redirects whose `Location` is a PATH, never an absolute URL.
 *
 * ## The trap
 *
 * The pattern Next.js documents is `NextResponse.redirect(new URL(path, request.url))`.
 * Behind a reverse proxy that quietly bakes "whatever origin Next.js thinks this
 * request has" into the `Location` header, and `request.url` is derived from the
 * incoming `Host` header. If a request ever reaches Next without nginx's
 * `Host` / `X-Forwarded-Proto` — a direct hit on 127.0.0.1:3000, an internal
 * self-request, a dev asset/HMR request — then `request.url` is
 * `http://localhost:3000/...` and the browser gets navigated clean off
 * app.vistasolve.net onto the developer's own machine. The same `Host`
 * dependency is a host-header-poisoning hole: a crafted `Host` steers the
 * redirect anywhere.
 *
 * (Next does normalise an absolute Location back to a relative one when it
 * matches the request origin — which is why this usually looks fine and only
 * misbehaves in the loopback case. That normalisation is a safety net, not a
 * guarantee, and it cannot help when the origin itself is wrong.)
 *
 * ## Why not just pass a relative path to `NextResponse.redirect`
 *
 * It throws: `URL is malformed "/login". Please use only absolute URLs`.
 *
 * ## Why not `new NextResponse(null, { headers: { Location: path } })`
 *
 * Next 16 validates the `Location` header inside the `NextResponse`
 * constructor too, so that also throws `ERR_INVALID_URL` with `input: '/login'`.
 *
 * ## What this does
 *
 * Construct the response with no `Location`, then set the header afterwards --
 * the validation only runs during construction, so a relative value survives.
 * A relative `Location` is explicitly allowed (RFC 7231 section 7.1.2) and the
 * browser resolves it against the origin it is already on, so the user stays
 * on app.vistasolve.net no matter what any header claims.
 *
 * Cookies are unaffected: this returns a real `NextResponse`, so `.cookies.set`
 * and `.cookies.delete` behave exactly as on a `NextResponse.redirect` result.
 */
export function redirectTo(path: string, status: 307 | 308 = 307): NextResponse {
  // A leading "//" would be read as protocol-relative and send the browser to
  // another host, so only same-origin paths are allowed through.
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error(
      `redirectTo() requires a same-origin path, received ${JSON.stringify(path)}.`,
    );
  }

  const response = new NextResponse(null, { status });
  response.headers.set("Location", path);
  return response;
}
