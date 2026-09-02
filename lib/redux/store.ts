import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "@/lib/features/shared/api/apiBaseSlice";
import authReducer from "@/lib/features/auth/authSlice";
import toastReducer from "@/lib/features/toast/toastSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
      auth: authReducer,
      toast: toastReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
