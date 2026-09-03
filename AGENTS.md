<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

## Core Next.js App Router Principles

1. **Server Components are the default** — Every page/layout starts as a Server Component. Add `"use client"` ONLY when hooks or browser APIs are required.

2. **Fetch data on the server** — All data fetching happens in Server Components or Server Actions. No client-side fetching except for real-time features that cannot be server-rendered.

3. **Server Actions for mutations** — All writes (create, update, delete) use Server Actions. No client-side mutation logic.

4. **Progressive enhancement** — Forms work without JavaScript. Server Actions provide this by default.

5. **Minimize client JavaScript** — Avoid unnecessary "use client" boundaries. Keep them as low in the component tree as possible.

6. **Use Next.js built-in features** — `next/image`, `next/font`, metadata APIs, `loading.tsx`, `error.tsx`, `not-found.tsx`.

---

## FORBIDDEN PATTERNS (Do NOT Use)

### 1. NEVER use `window.location` for navigation

```tsx
// ❌ FORBIDDEN
window.location.assign("/path");
window.location.href = "/path";
window.location.reload();

// ✅ CORRECT
// In Server Components:
redirect("/path");

// In Client Components:
const router = useRouter();
router.push("/path");
router.replace("/path");
```

**Why:** `window.location` causes a full page reload, breaking client-side navigation and losing React state. Next.js provides proper navigation APIs for both server and client contexts.

---

### 2. NEVER fetch data in `useEffect`

```tsx
// ❌ FORBIDDEN
useEffect(() => {
  fetch("/api/data").then(setData);
}, []);

// ✅ CORRECT
// In Server Components:
export default async function Page() {
  const data = await fetch("/api/data", { cache: "no-store" });
  return <Dashboard data={data} />;
}
```

**Why:** `useEffect` fetching creates waterfalls (server renders → client mounts → fetches → re-renders). Server Components fetch during render, no waterfall.

---

### 3. NEVER use Redux for server state

```tsx
// ❌ FORBIDDEN
const workspaces = useSelector(selectWorkspaces);
const { data } = useGetWorkspacesQuery();

// ✅ CORRECT
// In Server Components:
const workspaces = await getWorkspaces();

// For interactive client features (rare):
import { useQuery } from "@tanstack/react-query";
const { data } = useQuery({
  queryKey: ["workspaces"],
  queryFn: () => fetch("/api/workspaces").then(r => r.json()),
});
```

**Why:** Server state should be fetched on the server. Redux adds complexity for data the server already has. For client-side live data, use TanStack Query v5 with the SSR-hydration pattern described in §5 — never raw `fetch` from `useEffect`.

---

### 4. NEVER use RTK Query

```tsx
// ❌ FORBIDDEN
export const apiSlice = createApi({
  baseQuery: fetchBaseQuery(...),
  endpoints: (builder) => ({
    getWorkspaces: builder.query(...),
  }),
});

// ✅ CORRECT
// Server fetcher utility:
export async function serverFetch<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const access = cookieStore.get("access");
  
  const response = await fetch(`${process.env.BACKEND_URL}${path}`, {
    headers: { Cookie: `access=${access?.value}` },
    cache: "no-store",
  });
  
  return response.json();
}

// Use in Server Components:
const workspaces = await serverFetch<Workspace[]>("/apis/workspaces/");
```

**Why:** RTK Query is a client-side caching library designed for SPAs. Server Components fetch directly, eliminating the need for client caches.

---

### 5. NEVER use navigation bridges or global navigators

```tsx
// ❌ FORBIDDEN
let navigator = null;
export function registerNavigator(n) { navigator = n; }
export function appNavigate(path) { navigator?.(path) || window.location.assign(path); }

// ✅ CORRECT
// Navigate from Server Components:
redirect("/path");

// Navigate from Server Actions:
"use server";
export async function submitForm() {
  // ... mutation logic
  redirect("/success");
}

// Navigate from Client Components:
const router = useRouter();
router.push("/path");
```

**Why:** Navigation should only happen in components (via hooks) or server code (via `redirect`). Global navigators are an anti-pattern that indicates architecture problems.

---

### 6. NEVER make auth decisions on the client

```tsx
// ❌ FORBIDDEN
const user = useAppSelector(selectUser);
if (!user) return <Navigate to="/login" />;

// ✅ CORRECT
// In Server Component layout:
import { getAuthUser } from "@/lib/auth/server";

export default async function AppLayout({ children }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  return <>{children}</>;
}
```

**Why:** Auth must be verified on the server before rendering. Client-side checks can be bypassed and cause flash-of-wrong-content.

---

### 7. NEVER store JWT tokens in client-accessible storage

```tsx
// ❌ FORBIDDEN
localStorage.setItem("token", token);
sessionStorage.setItem("token", token);
const token = cookies.get("token"); // client-side cookie read

// ✅ CORRECT
// Django sets HttpOnly cookies in response headers
// Server reads them:
const cookieStore = await cookies();
const token = cookieStore.get("access");
```

**Why:** JWT tokens must be HttpOnly to prevent XSS attacks. Client JavaScript should never access them directly.

---

### 8. NEVER use client-side interceptors for auth

```tsx
// ❌ FORBIDDEN
const baseQuery = fetchBaseQuery({
  prepareHeaders: (headers, { getState }) => {
    const token = selectToken(getState());
    headers.set("Authorization", `Bearer ${token}`);
  },
});

// ✅ CORRECT
// Server fetcher forwards cookies automatically:
export async function serverFetch<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const access = cookieStore.get("access");
  
  return fetch(process.env.BACKEND_URL + path, {
    headers: { Cookie: `access=${access?.value}` },
  });
}
```

**Why:** Auth should be handled server-side with cookie forwarding, not client-side interceptors.

---

## REQUIRED PATTERNS

### Data Fetching

| Scenario | Solution |
|----------|----------|
| Page initial data | Server Component `fetch()` with Next.js cache |
| User-specific data | Server Component reads cookies, forwards to backend |
| Live data on a long-lived page (background refetch, polling) | Server Component prefetch + `<HydrationBoundary>` + Client `useQuery` (see §5) |
| Search/filter/pagination | Server Component with `searchParams` |

### Mutations

| Scenario | Solution |
|----------|----------|
| Form submission | Server Action + Zod schema (see §6) |
| Button click → API call | Server Action |
| Single-button optimistic UI (no rollback needed) | Server Action + React 19 `useOptimistic` |
| Optimistic UI with rollback / cross-query invalidation | Client `useMutation` against a Next Route Handler that forwards cookies + `X-Workspace` |

### State Management

| State Type | Solution |
|------------|----------|
| Server data (default) | Server Component + `serverFetch` |
| Server data (live, shared across components) | Server Component prefetch + TanStack Query cache (see §5) |
| Auth user | Server Component reads cookie, passes to tree |
| UI state (sidebar, modal) | React Context + `useState` |
| Form state (default) | Server Action + Zod + `useActionState` |
| Form state (rich client validation, multi-step, conditional fields) | React Hook Form + Zod resolver (see §7) |
| Toasts | React Context or Server Action returns |

### Navigation

| Context | Method |
|---------|--------|
| Server Component | `redirect("/path")` |
| Server Action | `redirect("/path")` after mutation |
| Client Component event | `const router = useRouter(); router.push("/path")` |
| Client Component effect | `useEffect(() => router.push(...))` |

---

## FEATURE PORTS (Sidebar & Dashboard Routes)

The sidebar nav returned by the backend (`getNavigationSidebar()`) maps to many feature routes that all live under the active workspace segment:

```
/[workspace]/dashboard/<feature>/...
```

Every one of those routes **must** be implemented using the same three-layer pattern. No feature is exempt — adding a sidebar link without a matching route is a bug.

### The required structure

1. **Server Component page** — the route entry. Path:
   ```
   app/(app)/[workspace]/dashboard/<feature>/page.tsx
   ```
   For routes with dynamic segments (e.g. `/projects/:id`), also add:
   ```
   app/(app)/[workspace]/dashboard/<feature>/[id]/page.tsx
   ```

2. **Server Actions** — colocated next to the page:
   ```
   app/(app)/[workspace]/dashboard/<feature>/actions.ts
   ```
   `"use server"` at the top. All mutations (create / update / delete / invite / move / etc.) call `serverMutate` and end with `redirect(...)` or `revalidatePath(...)`. Never use a client-side `fetch` for mutations.

3. **Client Components** — only where interactivity is genuinely required:
   ```
   app/(app)/[workspace]/dashboard/<feature>/<feature>-client.tsx
   ```
   Use `"use client"` only when you need hooks (`useState`, `useActionState`, `useRouter`), browser APIs, or `onClick`/`onChange` event handlers. Render the bulk of the UI as Server Components, then drop a Client Component in for the interactive slice (dialogs, forms, drag-and-drop, etc.).

### Per-feature checklist

Before merging a feature port, verify:

- [ ] `app/(app)/[workspace]/dashboard/<feature>/page.tsx` exists and is a Server Component (no `"use client"`).
- [ ] The page calls `requireWorkspace(slug)` (or relies on the `[workspace]/layout.tsx` guard already in place) before fetching.
- [ ] Data is fetched via `lib/api/<feature>.ts` → `serverFetch`, **never** in `useEffect`.
- [ ] All mutations are Server Actions in `actions.ts`; no client-side `POST`/`PUT`/`DELETE`.
- [ ] Client Components are scoped to the smallest subtree that needs interactivity.
- [ ] `npm run build` passes for the new route.
- [ ] No `window.location`, no Redux, no RTK Query, no client-side token reads.

### Reference implementation

See `app/(app)/[workspace]/dashboard/workspaces/` for a working example: Server Component page, Server Actions file, Client Component for the invite dialog, all bound through `useActionState` and `revalidatePath`.

### Why a catch-all is NOT a substitute

`app/(app)/[workspace]/dashboard/[...rest]/page.tsx` exists as a safety net for truly unknown paths — it redirects to `/dashboard`. It is **not** a stand-in for a real route. Every backend-issued sidebar `to` must have a real `page.tsx` behind it.

---

## Explaining Technical Concepts

When the user asks you to explain how something works — a technical decision, a pattern, an architectural choice, a bug, or a piece of code — explain it like you're teaching someone who is NEW to React and Next.js. Assume they are new to programming basics but not the specific framework concepts. Follow these rules:

1. **Start with the problem in plain language.** Before explaining the solution, start by mentioning whether that is a server component or a client. Then from there, describe the challenge in everyday terms. Example: "In Next.js, navigation works differently depending on where you are in the code."


2. **Use concrete examples with actual code.** Show the "easy case" and the "hard case" side by side with real code snippets. Don't just describe abstractly — show actual function signatures and calls.

3. **Explain the "why" behind each constraint.** When you say "you can't do X here," explain why that limitation exists. Example: "`useRouter()` is a hook — you can only call it inside a component, not in a plain function."

4. **Build up the solution step-by-step.** Don't jump to the final answer. Show Step 1, then Step 2, then Step 3, so the user sees how pieces connect. Use numbered steps with descriptive headers.

5. **Include a comparison table or summary.** End with a visual table or bullet list that captures the key decision points. Example: "Location | Can use `useRouter()`? | Solution"

6. **Use analogies sparingly but effectively.** If a framework concept maps well to a real-world analogy (bridge, checkpoint, cache, etc.), use it once and stick with it through the explanation. Don't force analogies where code examples are clearer.

7. **Acknowledge trade-offs honestly.** If your implementation is a compromise or has a downside, say so plainly and offer the cleaner alternative. Example: "This is a compromise. A cleaner approach would be..."

8. **Define framework-specific terms on first use.** When you say "hook," "Server Component," "middleware," "interceptor," "hydration," — add a one-line plain definition in parentheses the first time you use it in an explanation.

## TanStack Query v5 — SSR hydration pattern

When a route needs data to stay live while the user lingers on the page, use TanStack Query v5's SSR-hydration pattern. The library is stable (not experimental) since v5; only `@tanstack/react-query-next-experimental` carries the experimental flag and you do **not** need it.

### When to reach for TanStack Query

Use it for **any** of these — they are not "rare":

1. **Background refetch while the user stays on the page.** Long-lived screens like `/dashboard/today` and `/dashboard/schedule` should refresh automatically (`refetchInterval`, `refetchOnWindowFocus: true`).
2. **Cross-component live state.** A notification count read by both the sidebar and a header bell belongs in the TanStack cache so both components share it.
3. **Dependent queries.** One query needs another's result before it can run. Use `useQuery({ enabled })` instead of a `useEffect` chain.
4. **Optimistic UI with rollback.** `useMutation` + `setQueryData` + `onError` rollback. Use this only when you genuinely need the rollback — single-button toggles should use React 19's `useOptimistic` + Server Action instead (see the Mutations table above).
5. **Polling / WebSocket fallback.** `refetchInterval` for polling; for streams, `queryFn` returns a Promise that subscribes.

### The pattern (Server Component prefetch → HydrationBoundary → Client `useQuery`)

```tsx
// app/(app)/[workspace]/dashboard/today/page.tsx — Server Component
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { getTodaySummary } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { TodayBoard } from "./today-board";

export default async function TodayPage({ params }) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  // Prefetch on the server so first paint ships with data.
  const qc = new QueryClient();
  await qc.prefetchQuery({
    queryKey: ["today", active.domain],
    queryFn: () => getTodaySummary(active.domain),
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <TodayBoard workspace={active.domain} />
    </HydrationBoundary>
  );
}

// app/(app)/[workspace]/dashboard/today/today-board.tsx — Client Component
"use client";
import { useQuery } from "@tanstack/react-query";
import { getTodaySummary } from "@/lib/api";

export function TodayBoard({ workspace }: { workspace: string }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["today", workspace],
    queryFn: () => getTodaySummary(workspace),
    refetchInterval: 60_000,       // refresh every 60s while open
    refetchOnWindowFocus: true,    // refresh when user returns to the tab
  });
  // render …
}
```

### Rules

- **Always pair the client `useQuery` with a server-side `prefetchQuery` under `<HydrationBoundary>`.** First paint must contain real data — never show a spinner when the data was already known server-side.
- **Include the workspace slug in the query key.** `["companies", workspace]`, `["today", workspace]`. Never use a bare `["companies"]` — it leaks data across workspaces in the cache.
- **Don't fetch from a Client Component alone** (no `useQuery({ queryFn: () => fetch(...) })` against the backend). The query function must go through `serverFetch` or a Next Route Handler that forwards `Cookie` + `X-Workspace`. If you only need a tiny piece of client data that doesn't go through Django, you can use a Next Route Handler — but the default is `serverFetch`.
- **Don't add `@tanstack/react-query-next-experimental`.** The integration is ~20 lines per route; the experimental helper is not worth the version risk.

---

## Zod schemas — the validation contract for every form

TypeScript types are erased at runtime. Anything coming off `FormData`, a JSON body, or the wire needs runtime validation. **Zod** is the single validation contract.

### Schema lives next to the action

```ts
// app/(app)/[workspace]/dashboard/workspaces/actions.ts
"use server";
import { z, flattenError } from "zod";

export const InviteSchema = z.object({
  workspace: z.string().min(1, "Missing workspace."),
  email: z.string().email("Enter a valid email."),
  first_name: z.string().min(1, "First name is required.").max(80),
  last_name: z.string().min(1, "Last name is required.").max(80),
  role: z.enum(["admin", "member"]).default("member"),
});
export type InviteInput = z.infer<typeof InviteSchema>;

export async function sendInviteAction(_prev, formData: FormData) {
  const parsed = InviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    // Zod v4: `flattenError` is a top-level helper, not `parsed.error.flatten()`.
    const { fieldErrors } = flattenError(parsed.error);
    return { status: "error", fieldErrors };
  }
  await createInvitation(parsed.data, parsed.data.workspace);
  revalidatePath("/", "layout");
  return { status: "success", message: `Invitation sent to ${parsed.data.email}.` };
}
```

### Rules

- **One Zod schema per Server Action that takes a payload.** The schema is the contract: backend serializer, frontend form, error map — all derived from it.
- **Use `safeParse`, not `parse`.** `safeParse` returns `{ success, data, error }`; `parse` throws and you lose the field map.
- **Use `parsed.error` + `flattenError` (Zod v4) to drive `useActionState`'s field-level error display.** `import { flattenError } from "zod"`; then `const { fieldErrors } = flattenError(parsed.error)`. The keys match form field names; the values are `string[]`. (In Zod v3 this was `parsed.error.flatten().fieldErrors` — the method was removed in v4.)
- **Reuse the same schema on the client** if you add React Hook Form validation (§7). One source of truth, no drift.
- **Schema lives in `*.ts`, not `*.tsx`.** Importable from both Server Actions and Client Components.

---

## React Hook Form + Zod — for forms with rich client validation

Use the `useActionState` + Zod-server-validation pattern (§6) by default. Reach for **React Hook Form + `@hookform/resolvers/zod`** only when:

- The form has **conditional fields** (e.g. show field B only when field A has value X).
- The form is **multi-step** and you need per-step validation before advancing.
- You want **live field errors** as the user types (without round-tripping the Server Action).
- The form lives **entirely client-side** and submits via `fetch()` to a Next Route Handler.

```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InviteSchema } from "@/app/(app)/[workspace]/dashboard/workspaces/actions";

type InviteInput = z.infer<typeof InviteSchema>;

export function InviteForm({ workspace, action }: { workspace: string; action: (input: InviteInput) => Promise<void> }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<InviteInput>({
    resolver: zodResolver(InviteSchema),
    defaultValues: { workspace, role: "member" },
  });
  return (
    <form onSubmit={handleSubmit(action)} className="space-y-3">
      <input type="hidden" {...register("workspace")} />
      <label className="block text-sm">
        Email
        <input type="email" {...register("email")} className="…" />
        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
      </label>
      {/* … rest of fields … */}
      <button disabled={isSubmitting} type="submit">Send invite</button>
    </form>
  );
}
```

### Rules

- **The schema lives in `*.ts`** (next to the Server Action or in `lib/schemas/`), not in the `*.tsx`. Import it into both the Client form and the Server Action.
- **`defaultValues` must include every required field** — RHF warns loudly otherwise. Use `""` for optional strings.
- **Don't combine RHF with `useActionState`.** They are two form-state systems. Pick one per form: `useActionState` for the default Server-Action flow, RHF for rich client validation.
- **Server Actions remain the only mutation mechanism.** RHF's `onSubmit` calls a Server Action, not a raw `fetch`. The cookie/CSRF forwarding story stays the same.
- **Use `react-hook-form` + `@hookform/resolvers` + `zod`**, not Formik/Yup/RHF-final-form. They are the standard trio.

---

## `X-Workspace` header — required on every tenant-scoped API call

Django's `workspaces/middleware.py::WorkspaceResolutionMiddleware` resolves the active workspace for each request, in order:

1. The `/{workspace}` URL path prefix.
2. Fallback: the `X-Workspace` request header.
3. Fallback: the shared `app` workspace (silently empty for tenant data).

The Django endpoints under `/apis/<app>/*` (CRM, projects, schedules, notebook, deals, …) carry **no `/{workspace}` path segment**. Without `X-Workspace`, the middleware falls into case 3 and the response is `200 OK` with `{count: 0, results: []}` — silently empty. This is a common source of "why is my list blank?" bugs.

### What sends `X-Workspace`

| Caller | Sends header? | Notes |
|---|---|---|
| `/[workspace]/dashboard/*` (Server Component, Server Action) | **Yes — mandatory.** Pass `active.domain` from `requireWorkspace(slug)`. | All `lib/api/crm.ts`, `lib/api/projects.ts`, `lib/api/schedules.ts`, `lib/api/notebook.ts`, tenant-scoped calls. |
| `/onboarding/*` (Server Actions) | No. | Pre-tenant — the user doesn't yet belong to a workspace. The backend resolves to the `app` workspace and `WorkspaceViewSet` membership-scopes the response. |
| `/login`, `/signup`, `/password/*`, `/activate/*`, `/verify-email` | No. | These use raw `fetch()` directly (not `serverFetch`) and bypass the data layer entirely. |
| `createClientBusiness`, `createWorkspace`, `redeemInvitation`, `checkDomainAvailability`, `getCsrfToken`, `refreshAccessToken` | No. | Workspace-bootstrap mutations and pre-tenant reads. |
| `lib/api/workspaces.ts`, `lib/api/invitations.ts` (tenant-side wrappers) | When called from a tenant route, the wrapper requires `workspace` and forwards it. When called from onboarding, the wrapper omits it. | The wrapper signature decides. |

### How `serverFetch` / `serverMutate` know

Both accept an options object with `workspace?: string`. When present, it's set as the `X-Workspace` header. When absent, no header is sent. There is no automatic detection — every call site passes it explicitly.

### Tenant-scoped wrappers require it

`listCompanies({ workspace })`, `listProjects({ workspace })`, `listNotes({ workspace })`, etc. — `workspace: string` is a **required** field on the options bag. TypeScript will refuse to compile any call that forgets it. This is the enforcement mechanism.

### Pre-tenant wrappers omit it

`createWorkspace(body)`, `createClientBusiness(body)`, `redeemInvitation(body)` — these functions do not accept `workspace` at all. The Server Action calls them without forwarding a header, and the backend resolves to the `app` workspace (which is what you want for bootstrap mutations).

### Where to find the active workspace

The single source of truth is `requireWorkspace(slug)` in `lib/auth/server.ts`. It returns the `Workspace` object whose `.domain` is the URL slug. Every Server Component / Server Action under `/[workspace]/dashboard/*` already has `active` in scope — pass `active.domain` to every tenant call.

```tsx
// ✅ correct — always pass active.domain
const all = await listCompanies({ workspace: active.domain });
await createProject(body, active.domain);

// ❌ wrong — TypeScript will refuse; runtime would silently return empty results
const all = await listCompanies();
await createProject(body);
```

### Verification (every PR)

- New Server Component under `/[workspace]/dashboard/*` passes `active.domain` (or `active.nanoid` — both are accepted by Django) into every `serverFetch` / `serverMutate` call, directly or via a wrapper.
- New onboarding / auth route does **not** set `X-Workspace`.
- No `serverFetch` / `serverMutate` call in a tenant route is missing the header (the type system enforces this for CRM/projects/schedules/notebook — other wrappers still need a manual check).

---

### 7. Django Backend code is read-only. Should NEVER be changed

Do not change the backend code. Your is to call the endpoint and ensure the frontend and nextjs use the backend as-is
---

## Verification Checklist

Before marking any work complete:

- [ ] `npm run build` passes with no errors
- [ ] No `window.location` calls in any file
- [ ] No `useEffect` data fetching (unless real-time)
- [ ] No Redux state for server data
- [ ] All mutations use Server Actions
- [ ] All auth checks happen in Server Components
- [ ] No navigation bridges or global navigators
- [ ] JWT tokens never accessed by client JavaScript
- [ ] Every `serverFetch` / `serverMutate` under `/[workspace]/dashboard/*` carries `X-Workspace` (`active.domain`)
- [ ] No `serverFetch` / `serverMutate` under `/onboarding/*`, `/login`, `/signup`, `/password/*`, `/activate/*`, `/verify-email` sets `X-Workspace`
- [ ] TanStack Query callers prefetch on the server under `<HydrationBoundary>` and include the workspace in the query key
- [ ] Forms with rich client validation use React Hook Form + the Zod schema that the Server Action also uses

<!-- END:nextjs-agent-rules -->
