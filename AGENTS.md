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

**Why:** Server state should be fetched on the server. Redux adds complexity for data the server already has. Use TanStack Query only for real-time/interactive features that must be client-side.

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
| Interactive/real-time data | TanStack Query in Client Components (rare) |
| Search/filter/pagination | Server Component with `searchParams` |

### Mutations

| Scenario | Solution |
|----------|----------|
| Form submission | Server Action |
| Button click → API call | Server Action |
| Optimistic updates | TanStack Query in Client Components (rare) |

### State Management

| State Type | Solution |
|------------|----------|
| Server data | No client state — fetch in Server Components |
| Auth user | Server Component reads cookie, passes to tree |
| UI state (sidebar, modal) | React Context + `useState` |
| Form state | Server Actions + `useFormState` |
| Toasts | React Context or Server Action returns |

### Navigation

| Context | Method |
|---------|--------|
| Server Component | `redirect("/path")` |
| Server Action | `redirect("/path")` after mutation |
| Client Component event | `const router = useRouter(); router.push("/path")` |
| Client Component effect | `useEffect(() => router.push(...))` |

---

## Explaining Technical Concepts

When the user asks you to explain how something works — a technical decision, a pattern, an architectural choice, a bug, or a piece of code — explain it like you're teaching someone who is NEW to React and Next.js. Assume they understand programming basics but not the specific framework concepts. Follow these rules:

1. **Start with the problem in plain language.** Before explaining the solution, describe the challenge in everyday terms. Example: "In Next.js, navigation works differently depending on where you are in the code."

2. **Use concrete examples with actual code.** Show the "easy case" and the "hard case" side by side with real code snippets. Don't just describe abstractly — show actual function signatures and calls.

3. **Explain the "why" behind each constraint.** When you say "you can't do X here," explain why that limitation exists. Example: "`useRouter()` is a hook — you can only call it inside a component, not in a plain function."

4. **Build up the solution step-by-step.** Don't jump to the final answer. Show Step 1, then Step 2, then Step 3, so the user sees how pieces connect. Use numbered steps with descriptive headers.

5. **Include a comparison table or summary.** End with a visual table or bullet list that captures the key decision points. Example: "Location | Can use `useRouter()`? | Solution"

6. **Use analogies sparingly but effectively.** If a framework concept maps well to a real-world analogy (bridge, checkpoint, cache, etc.), use it once and stick with it through the explanation. Don't force analogies where code examples are clearer.

7. **Acknowledge trade-offs honestly.** If your implementation is a compromise or has a downside, say so plainly and offer the cleaner alternative. Example: "This is a compromise. A cleaner approach would be..."

8. **Define framework-specific terms on first use.** When you say "hook," "Server Component," "middleware," "interceptor," "hydration," — add a one-line plain definition in parentheses the first time you use it in an explanation.

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

<!-- END:nextjs-agent-rules -->
