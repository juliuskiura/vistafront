"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: number;
  variant: ToastVariant;
  title: string;
  message: string;
}

export type ToastInput = {
  variant?: ToastVariant;
  title?: string;
  message: string;
};

interface ToastContextValue {
  toasts: Toast[];
  push: (toast: ToastInput) => number;
  dismiss: (id: number) => void;
  clear: () => void;
  clearErrors: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_TITLE: Record<ToastVariant, string> = {
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Info",
};

const DEFAULT_DURATION_MS: Record<ToastVariant, number> = {
  success: 4000,
  info: 4000,
  warning: 6000,
  error: 8000,
};

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (input: ToastInput): number => {
      const variant = input.variant ?? "info";
      const id = nextId++;
      const toast: Toast = {
        id,
        variant,
        title: input.title ?? DEFAULT_TITLE[variant],
        message: input.message,
      };
      setToasts((prev) => [...prev, toast]);
      const timer = setTimeout(() => {
        timers.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, DEFAULT_DURATION_MS[variant]);
      timers.current.set(id, timer);
      return id;
    },
    [],
  );

  const clear = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
    setToasts([]);
  }, []);

  const clearErrors = useCallback(() => {
    setToasts((prev) => {
      const survivors: Toast[] = [];
      const dropped: Toast[] = [];
      for (const toast of prev) {
        if (toast.variant === "error") {
          dropped.push(toast);
        } else {
          survivors.push(toast);
        }
      }
      for (const t of dropped) {
        const timer = timers.current.get(t.id);
        if (timer) {
          clearTimeout(timer);
          timers.current.delete(t.id);
        }
      }
      return survivors;
    });
  }, []);

  useEffect(() => {
    const active = timers.current;
    return () => {
      active.forEach((t) => clearTimeout(t));
      active.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, push, dismiss, clear, clearErrors }),
    [toasts, push, dismiss, clear, clearErrors],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

/**
 * Convenience API for Client Components: `useToast().success("Saved")`.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-destructive/40 bg-destructive/10 text-destructive",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
};

const VARIANT_DOT: Record<ToastVariant, string> = {
  success: "bg-emerald-500",
  error: "bg-destructive",
  warning: "bg-amber-500",
  info: "bg-sky-500",
};

function ToastViewport() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;
  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 sm:right-4 sm:left-auto sm:items-end"
    >
      {ctx.toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.variant === "error" ? "alert" : "status"}
          className={`pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 shadow-lg backdrop-blur ${VARIANT_STYLES[toast.variant]}`}
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${VARIANT_DOT[toast.variant]}`}
            />
            <div className="flex-1 text-sm">
              <p className="font-semibold">{toast.title}</p>
              <p className="mt-0.5 whitespace-pre-line text-xs opacity-90">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => ctx.dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="-m-1 rounded p-1 text-current opacity-60 transition hover:opacity-100"
            >
              <span aria-hidden>×</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
