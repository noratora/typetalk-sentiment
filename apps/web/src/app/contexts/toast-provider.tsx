"use client";

import { ProviderRequiredError } from "@/app/lib/errors";
import clsx from "clsx";
import {
  ReactNode,
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface Toast {
  id: number;
  message: string;
  type: "error" | "success";
}

interface ToastContextProps {
  showToast: (message: string, type: "error" | "success") => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

const ToastItem = memo(function ToastItem({ toast }: { toast: Toast }) {
  return (
    <div
      {...(toast.type === "error" ? { role: "alert" } : {})}
      className={clsx("alert", {
        "alert-error": toast.type === "error",
        "alert-success": toast.type === "success",
      })}
    >
      <span>{toast.message}</span>
    </div>
  );
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<{ [key: number]: NodeJS.Timeout }>({});

  const showToast = useCallback(
    (message: string, type: "error" | "success") => {
      const id = Date.now();
      setToasts((prevToasts) => [...prevToasts, { id, message, type }]);

      const timer = setTimeout(() => {
        setToasts((prevToasts) =>
          prevToasts.filter((toast) => toast.id !== id)
        );
        delete timersRef.current[id];
      }, 5000);

      timersRef.current[id] = timer;
    },
    []
  );

  /**
   * 全てのトースト通知のタイマーをクリアする
   */
  const clearAllTimers = useCallback(() => {
    Object.values(timersRef.current).forEach(clearTimeout);
    timersRef.current = {};
  }, []);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast toast-top toast-center">
        <div role="log" aria-live="polite">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

/**
 * トースト通知を表示するためのカスタムフック
 * @throws {ProviderRequiredError} ToastProviderの外部で使用された場合
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new ProviderRequiredError("useToast", "ToastProvider");
  }
  return context;
}
