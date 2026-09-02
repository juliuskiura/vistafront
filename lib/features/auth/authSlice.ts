import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface User {
  id: number
  nanoid: string
  email: string
  username: string | null
  first_name: string | null
  last_name: string | null
  signup_date: string
  is_active: boolean
  is_superuser: boolean
  is_admin: boolean
  is_banned: boolean
  agree_terms: boolean
  redirect_url?: string
}

interface AuthState {
  user: User | null
  loading: boolean
  // Set only on an explicit user-initiated logout. Used to short-circuit the
  // session-restore refresh on the next mount so a lingering (possibly stale)
  // refresh cookie cannot silently re-establish a session and re-issue the
  // access/refresh cookies.
  explicitlyLoggedOut: boolean
}

const initialState: AuthState = {
  user: null,
  loading: true,
  explicitlyLoggedOut: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: User }>) {
      state.user = action.payload.user
      state.explicitlyLoggedOut = false
    },
    clearCredentials(state) {
      state.user = null
    },
    markLoggedOut(state) {
      state.user = null
      state.explicitlyLoggedOut = true
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
  },
})

export const { setCredentials, clearCredentials, markLoggedOut, setLoading } = authSlice.actions
export const selectExplicitlyLoggedOut = (state: { auth: AuthState }) => state.auth.explicitlyLoggedOut
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.user !== null
export const selectUser = (state: { auth: AuthState }) => state.auth.user

export type { AuthState }
export default authSlice.reducer
