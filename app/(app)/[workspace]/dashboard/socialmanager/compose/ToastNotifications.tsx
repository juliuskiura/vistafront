"use client";

interface ToastProps {
  status: "idle" | "submitting" | "success" | "error";
  errorMsg: string;
  editPost: boolean;
}

export function ToastNotifications({ status, errorMsg, editPost }: ToastProps) {
  if (status === "success") {
    return (
      <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-lg">
        {editPost ? "Post updated" : "Post created successfully"}{"! Redirecting..."}
      </div>
    );
  }
  if (status === "error" && errorMsg) {
    return (
      <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
        {errorMsg}
      </div>
    );
  }
  return null;
}