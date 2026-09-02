"use client";

import { createContext, useContext } from "react";

import type { User } from "@/lib/auth/server";

interface AuthContextType {
  user: User | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * AuthProvider - Client Component that exposes the server-resolved user
 * to Client Components in the (app) tree.
 *
 * The user is read on the server by `requireAuth()` in the (app) layout
 * and passed in as `initialUser`. We never re-fetch the user from the
 * client; if a mutation needs to refresh the user, the Server Action
 * calls `revalidatePath('/')` or we expose a new server-resolved user via
 * a fresh navigation.
 */
export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: User | null;
  children: React.ReactNode;
}) {
  return (
    <AuthContext.Provider value={{ user: initialUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook for Client Components to read the current user. Throws if used
 * outside an `AuthProvider` to make integration mistakes loud.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
