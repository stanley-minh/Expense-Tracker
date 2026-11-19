import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { ToastContext, type ToastType } from "./ToastContext";

/** How long a toast stays on screen, in milliseconds. */
const TOAST_DURATION_MS = 3000;

interface Toast {
  /** Unique key for React's list rendering. */
  id: number;
  message: string;
  type: ToastType;
}

/**
 * Holds the list of visible toasts and displays them in the bottom corner.
 *
 * @remarks
 * - Each toast removes itself after TOAST_DURATION_MS (setTimeout).
 * - role="status" + aria-live="polite": screen readers read the message
 *   without interrupting what the user is doing.
 * - The container sits above the mobile dock (bottom-20 on phones).
 */
function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // useRef: a counter that survives renders without causing new ones
  const nextId = useRef(1);

  // useCallback: the same function object on every render, so components that
  // depend on showToast (e.g. in a useEffect) are not re-run for nothing
  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, type }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  // useMemo: a new context object only when showToast changes (never, here)
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className="toast toast-end bottom-20 z-50 md:bottom-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`alert ${toast.type === "error" ? "alert-error" : "alert-success"}`}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
