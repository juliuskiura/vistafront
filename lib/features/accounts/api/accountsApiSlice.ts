import { apiSlice } from "@/lib/features/shared/api/apiBaseSlice";
import type { User } from "@/lib/features/auth/authSlice";

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: string;
  user: User;
}

interface ActivateLoginResponse {
  success: string;
  user: User;
}

export const accountsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: "/apis/auth/jwt/create/",
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
      invalidatesTags: ["User"],
    }),

    register: builder.mutation<
      User,
      {
        email: string;
        first_name: string;
        last_name: string;
        password: string;
        re_password: string;
        agree_terms: boolean;
      }
    >({
      query: (body) => ({
        url: "/apis/auth/users/",
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
      invalidatesTags: ["User"],
    }),

    refreshToken: builder.mutation<void, void>({
      query: () => ({
        url: "/apis/auth/jwt/refresh/",
        method: "POST",
      }),
    }),

    getMe: builder.query<User, void>({
      query: () => "/apis/auth/users/me/",
      providesTags: ["User"],
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/apis/auth/jwt/logout/",
        method: "POST",
      }),
    }),

    activate: builder.mutation<void, { uid: string; token: string }>({
      query: (body) => ({
        url: "/apis/auth/users/activation/",
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
    }),

    activateAndLogin: builder.mutation<
      ActivateLoginResponse,
      { uid: string; token: string }
    >({
      query: (body) => ({
        url: "/apis/auth/activate-and-login/",
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
    }),

    requestPasswordReset: builder.mutation<void, { email: string }>({
      query: (body) => ({
        url: "/apis/auth/users/reset_password/",
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
    }),

    confirmPasswordReset: builder.mutation<
      void,
      { uid: string; token: string; new_password: string }
    >({
      query: (body) => ({
        url: "/apis/auth/users/reset_password_confirm/",
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useLogoutMutation,
  useActivateAndLoginMutation,
  useRequestPasswordResetMutation,
  useConfirmPasswordResetMutation,
} = accountsApiSlice;
