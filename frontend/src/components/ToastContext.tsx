"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

type Toast = { id: string; message: string; type?: "info" | "success" | "error" };

type ToastContextValue = {
  show: (message: string, type?: Toast["type"]) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 9);
    setToasts((t) => [...t, { id, message, type }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      window.setTimeout(() => {
        setToasts((curr) => curr.filter((x) => x.id !== t.id));
      }, 3500)
    );
    return () => timers.forEach((id) => clearTimeout(id));
  }, [toasts]);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <div className="fixed left-1/2 transform -translate-x-1/2 top-20 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto max-w-xl w-full mx-auto px-4 py-2 rounded-lg border border-gray-700 shadow-lg transition-all transform bg-gray-900 text-white flex items-center justify-between gap-3`}
          >
            <div className="text-sm">{t.message}</div>
            <button
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
              className="text-gray-400 hover:text-gray-200 ml-3"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
