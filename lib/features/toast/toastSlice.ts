import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastState {
  toasts: Toast[];
}

const initialState: ToastState = {
  toasts: [],
};

const defaultTitles: Record<ToastType, string> = {
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Info",
};

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    addToast: (
      state,
      action: PayloadAction<{
        type: ToastType;
        title?: string;
        message: string;
      }>
    ) => {
      const id = Date.now();
      const { type, title, message } = action.payload;
      state.toasts.push({
        id,
        type,
        title: title || defaultTitles[type],
        message,
      });
    },
    removeToast: (state, action: PayloadAction<number>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
    clearErrors: (state) => {
      state.toasts = state.toasts.filter((toast) => toast.type !== "error");
    },
  },
});

export const { addToast, removeToast, clearToasts, clearErrors } = toastSlice.actions;

export default toastSlice.reducer;
