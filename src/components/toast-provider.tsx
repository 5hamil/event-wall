"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Toast = { id: number; message: string; type: "success" | "error" };
type ToastContextValue = { toast: (message: string, type?: Toast["type"]) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4000);
  }, []);

  return <ToastContext.Provider value={{ toast }}>{children}<div aria-live="polite" aria-atomic="false" className="fixed bottom-4 right-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">{toasts.map((item) => <div key={item.id} role={item.type === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm font-medium shadow-lift ${item.type === "error" ? "bg-red-50 text-red-800" : "bg-neutral-900 text-white"}`}>{item.message}</div>)}</div></ToastContext.Provider>;
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used within ToastProvider");
  return value.toast;
}
