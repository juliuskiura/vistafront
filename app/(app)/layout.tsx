import { requireAuth } from "@/lib/auth/server";
import { AuthProvider } from "@/lib/auth/context";

/**
 * Server-side auth guard for the (app) route group.
 *
 * `requireAuth()` reads the HttpOnly `access` cookie, validates it with
 * Django, and redirects to `/login` when no user is found. The resulting
 * `user` is then passed to Client Components via `AuthProvider`, so client
 * code never has to read tokens or guess whether the user is signed in.
 */
export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return <AuthProvider initialUser={user}>{children}</AuthProvider>;
}
