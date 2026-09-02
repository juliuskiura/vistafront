import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { FetchBaseQueryArgs } from "@reduxjs/toolkit/query/react";
import type { FetchBaseQueryError, FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, QueryReturnValue } from "@reduxjs/toolkit/query";
import { clearCredentials } from "@/lib/features/auth/authSlice";
import { addToast } from "@/lib/features/toast/toastSlice";
import { AppTagTypes } from "./appTagTypes";
import { parseApiError, userSafeMessage } from "@/lib/apiErrors";

export const getApiBaseUrl = () => {
  // Same-origin: Django serves both the SPA and the /apis backend, so no host
  // prefix is needed. In Next.js, set NEXT_PUBLIC_API_BASE_URL to point at the
  // backend (e.g. http://127.0.0.1:8000) or rely on the dev proxy.
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
};

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookieValue = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));
  return cookieValue ? decodeURIComponent(cookieValue.split("=")[1]) : null;
}

/**
 * Single-flight guard for token refresh. When the access token expires,
 * several in-flight requests 403 at once. Each would independently call
 * `/apis/auth/jwt/refresh/`, but the backend rotates and blacklists the refresh
 * cookie on every refresh. Sharing one in-flight promise makes every concurrent
 * 403 reuse the same refresh result.
 */
let refreshInFlight: Promise<QueryReturnValue<unknown, FetchBaseQueryError, FetchBaseQueryMeta>> | null = null;

function refreshToken(
  api: any,
  extraOptions: any,
): Promise<QueryReturnValue<unknown, FetchBaseQueryError, FetchBaseQueryMeta>> {
  if (!refreshInFlight) {
    refreshInFlight = Promise.resolve(
      baseQuery(
        {
          url: "/apis/auth/jwt/refresh/",
          method: "POST",
          credentials: "include",
          body: {},
        },
        api,
        extraOptions,
      ) as Promise<QueryReturnValue<unknown, FetchBaseQueryError, FetchBaseQueryMeta>>,
    ).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

const baseQuery = fetchBaseQuery({
  baseUrl: getApiBaseUrl(),
  credentials: "include",
});

/** URLs that should NOT trigger a global error toast when a mutation fails */
const toastExclusionList = [
  "/apis/auth/jwt/create/",
  "/apis/auth/jwt/refresh/",
  "/apis/auth/users/",
];

const baseQueryWithReauth: BaseQueryFn<
  string | FetchBaseQueryArgs,
  unknown,
  FetchBaseQueryError
> = async (args: any, api: any, extraOptions: any) => {
  let requestArgs: FetchBaseQueryArgs;
  if (typeof args === "string") {
    requestArgs = { url: args } as FetchBaseQueryArgs;
  } else {
    requestArgs = args;
  }

  const unsafeMethods = ["POST", "PUT", "PATCH", "DELETE"];
  if (
    requestArgs.method &&
    unsafeMethods.includes(requestArgs.method.toUpperCase())
  ) {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) {
      requestArgs.headers = {
        ...requestArgs.headers,
        "X-CSRFToken": csrfToken,
      };
    }
  }
  let result = await baseQuery(args, api, extraOptions);

  const refreshExclusionList = [
    "/apis/auth/jwt/create/",
    "/apis/auth/users/",
    "/apis/auth/users/activation/",
    "/apis/auth/jwt/refresh/",
    "/apis/auth/users/resend_activation/",
  ];

  const currentUrl = typeof args === "string" ? args : args.url;
  const isExcluded = refreshExclusionList.some((url) =>
    currentUrl.includes(url),
  );

  if (
    (result?.error?.status === 401 || result?.error?.status === 403) &&
    !isExcluded
  ) {
    const refreshResult = await refreshToken(api, extraOptions);
    const refreshStatus = refreshResult?.meta?.response?.status;
    if (refreshStatus === 200 || refreshStatus === 204) {
      result = await baseQuery(args, api, extraOptions);
    } else {
      if (
        refreshResult?.error?.status === 401 ||
        refreshResult?.error?.status === 403
      ) {
        api.dispatch(clearCredentials());
        api.dispatch(apiSlice.util.resetApiState());
      } else {
        console.warn(
          "Token refresh failed but not due to auth error:",
          refreshResult?.error,
        );
      }
    }
  }

  // Global error toast for mutation failures (POST / PUT / PATCH / DELETE).
  if (result.error && result.error.status !== 401) {
    const requestMethod = (
      typeof args === "string" ? "GET" : (args.method || "GET")
    ).toUpperCase();
    if (["POST", "PUT", "PATCH", "DELETE"].includes(requestMethod)) {
      const isToastExcluded = toastExclusionList.some((url) =>
        currentUrl.includes(url),
      );
      if (!isToastExcluded) {
        console.error("API request failed:", parseApiError(result.error));
        if (result.error.status === 409) {
          api.dispatch(
            addToast({ type: "error", message: parseApiError(result.error) }),
          );
        } else {
          const anticipatedAttrs = [
            "workspace",
            "title",
            "note_type",
            "relatable_nanoid",
            "object_nanoid",
            "domain",
          ];
          const parsed = parseApiError(result.error);
          const isMediaError = parsed.includes("Error ML");
          const isAnticipated =
            isMediaError ||
            anticipatedAttrs.some((attr) => parsed.startsWith(`${attr}: `));
          const message = isAnticipated
            ? parsed
            : userSafeMessage(result.error.status);
          api.dispatch(addToast({ type: "error", message }));
        }
      }
    }
  }

  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: AppTagTypes,
  endpoints: (builder) => ({
    getCsrfToken: builder.query<void, void>({
      query: () => ({
        url: "/apis/accounts/csrf/",
        method: "GET",
      }),
    }),
  }),
});

export const { useGetCsrfTokenQuery } = apiSlice;
