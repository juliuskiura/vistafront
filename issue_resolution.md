# Production Login Routing Issue Resolution

## Summary

The Next.js login failure was caused by production routing and environment mismatches, not by the submitted credentials.

The production services are:

- `vistasolve.com` Django site: port `8000`
- `app.vistasolve.com` application Django service (Daphne): port `8001`
- Next.js frontend: port `5173`

The login Server Action sends credentials to `/apis/auth/jwt/create/`. The browser-facing app domain must route `/apis/` to the app's Django service on port `8001`, with the public app hostname preserved as the `Host` header.

## Symptoms

1. A POST to the Next.js port with a trailing slash received `308 Permanent Redirect` to the slashless URL.
2. Django then returned `301 Permanent Redirect` from the slashless endpoint back to its slashful canonical URL.
3. The frontend displayed `Invalid email or password` even though the public app API request succeeded. The Server Action used `BACKEND_URL` directly, and its fallback/error handling made upstream routing failures look like credential failures.
4. After routing production server-side requests through the public app origin, requests to `/apis/` returned nginx `500`. The app nginx vhost sent `/` to Next.js and had no `/apis/` location, so the Next rewrite routed back to the same public origin.

## Root Causes

### Next.js slash normalization

Next.js's default trailing-slash normalization removed the slash before the API rewrite. The resulting slashless request reached Django, whose `APPEND_SLASH` behavior redirected it back to the slashful URL. Redirecting a POST can interfere with method/body handling.

### Production target and status

The frontend PM2 definition initially lacked the required live environment values, including `NEXT_STATUS`. Without the explicit production status, Next's environment resolver could select the development backend on port `8000`. That is the `vistasolve.com` Django service, not the app's service on `8001`.

Directly connecting to loopback port `8001` also presents `127.0.0.1` as the request Host. Production Django allows the app hostname, not loopback. Node's `fetch` replaces a manually supplied `Host` header, so the production Server Actions use the canonical public app origin instead.

### Missing nginx API route

The active `app.vistasolve.com` nginx vhost sent ordinary paths to Next.js and had no `/apis/` location. Requests to the public API URL therefore fell through to Next.js, whose API rewrite targeted the same public origin and looped back through nginx.

## Changes Made

### Next.js routing

- `next.config.ts` enables `skipTrailingSlashRedirect` so Next does not strip API slashes before rewrites.
- An explicit slash-preserving `/apis/:path*/` rewrite is placed before the generic `/apis/:path*` rewrite.
- `proxy.ts` exempts `/apis` paths from manual slash normalization. Other non-root paths retain the existing canonical slashless `308` behavior.

### Production backend environment

- `lib/env.server.ts` keeps the development backend at `http://127.0.0.1:8000` and uses `APP_BASE_URL` for production server-side requests.
- `ecosystem.config.js` explicitly sets `NEXT_STATUS: "production"`, `BACKEND_URL: "https://app.vistasolve.com"`, and `API_PROXY_TARGET: "https://app.vistasolve.com"`.
- The `vistafront` PM2 process was reloaded with the updated ecosystem file. Its live status and those three environment values were verified.

### nginx routing

Added this location to the `app.vistasolve.com` server block, before the catch-all `location /`:

```nginx
location /apis/ {
    proxy_pass http://127.0.0.1:8001;

    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

The nginx file was root-owned and could not be saved directly from the editor. A full local copy containing the change was saved at `deploy/nginx/vistasolve.com`; it was used to install the vhost with elevated privileges.

## Validation and Deployment

- `npx tsc --noEmit` passed.
- ESLint passed for the changed Next.js files and PM2 config.
- PM2 reported `vistafront` online with `NEXT_STATUS=production` and both production API URLs set to `https://app.vistasolve.com`.
- `http://127.0.0.1:5173/login` returned HTTP 200 after the PM2 reload.
- A direct, credential-free GET to `127.0.0.1:8001/apis/auth/jwt/create/` with `Host: app.vistasolve.com` returned Daphne's expected `405 Method Not Allowed` and `Allow: POST, OPTIONS`.
- Before the nginx route was installed, public API requests returned nginx HTTP 500. The updated vhost was installed and nginx reloaded by the operator; the operator then confirmed the fix worked.

For future installations, the saved full vhost can be copied and activated with:

```bash
sudo cp /etc/nginx/sites-available/vistasolve.com \
  /etc/nginx/sites-available/vistasolve.com.bak.$(date +%Y%m%d%H%M%S)

sudo install -o root -g root -m 644 \
  /home/vistech/vstsuite/frontapp/vistafront/deploy/nginx/vistasolve.com \
  /etc/nginx/sites-available/vistasolve.com

sudo nginx -t && sudo systemctl reload nginx
```

A credential-free GET to `https://app.vistasolve.com/apis/auth/jwt/create/` should return Daphne's `405 Method Not Allowed`, not nginx's `500`. No credentials are included in this document.
