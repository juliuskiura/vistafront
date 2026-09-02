"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  useLoginMutation,
  useRefreshTokenMutation,
  useLazyGetMeQuery,
  useLogoutMutation,
} from "@/lib/features/accounts/api/accountsApiSlice";
import { apiSlice } from "@/lib/features/shared/api/apiBaseSlice";
import {
  setCredentials,
  clearCredentials,
  markLoggedOut,
  setLoading,
  selectExplicitlyLoggedOut,
  selectUser,
} from "@/lib/features/auth/authSlice";
import { clearToasts } from "@/lib/features/toast/toastSlice";

/**
 * Restores an existing session once on mount by refreshing the access token
 * and fetching the current user. Runs only on the client (via useEffect), so
 * it does not cause SSR hydration mismatches.
 */
export function useInitAuth() {
  const dispatch = useAppDispatch();
  const explicitlyLoggedOut = useAppSelector(selectExplicitlyLoggedOut);
  const [refresh] = useRefreshTokenMutation();
  const [triggerGetMe] = useLazyGetMeQuery();

  useEffect(() => {
    // After an explicit logout, do NOT attempt to restore a session from a
    // lingering refresh cookie.
    if (explicitlyLoggedOut) {
      dispatch(setLoading(false));
      return;
    }
    refresh()
      .unwrap()
      .then(() => triggerGetMe().unwrap())
      .then((user) => dispatch(setCredentials({ user })))
      .catch(() => dispatch(clearCredentials()))
      .finally(() => dispatch(setLoading(false)));
  }, [dispatch, refresh, triggerGetMe, explicitlyLoggedOut]);
}

export function useAuth() {
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [loginMut] = useLoginMutation();
  const [logoutMut] = useLogoutMutation();

  async function login(email: string, password: string) {
    const result = await loginMut({ email, password }).unwrap();
    dispatch(clearToasts());
    dispatch(setCredentials({ user: result.user }));
    // Start every session with a cold cache.
    dispatch(apiSlice.util.resetApiState());
    if (result.user?.redirect_url) {
      router.push(result.user.redirect_url);
    }
  }

  async function logout() {
    try {
      await logoutMut().unwrap();
    } catch {
      // If the API call fails, still clear local state.
    }
    dispatch(markLoggedOut());
    dispatch(apiSlice.util.resetApiState());
  }

  return { user, login, logout };
}
