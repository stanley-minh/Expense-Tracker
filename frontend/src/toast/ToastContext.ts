import { createContext } from "react";

/** Visual style of a toast: green for a success, red for an error. */
export type ToastType = "success" | "error";

/** What every component can call through useToast(). */
export interface ToastContextValue {
  /**
   * Shows a short message in the corner of the screen, which disappears by itself.
   * @param message Text shown to the user (in French)
   * @param type "success" (default) or "error"
   */
  showToast: (message: string, type?: ToastType) => void;
}

/**
 * Context: lets any component show a toast without passing a function through
 * the props of every intermediate component. null = used outside of <ToastProvider>.
 */
export const ToastContext = createContext<ToastContextValue | null>(null);
