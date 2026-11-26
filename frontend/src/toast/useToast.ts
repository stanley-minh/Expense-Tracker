import { useContext } from "react";
import { ToastContext, type ToastContextValue } from "./ToastContext";

/**
 * Gives access to showToast() to display a confirmation message.
 * @throws Error when used outside of <ToastProvider>: fails loudly instead of silently doing nothing
 * @example
 * const { showToast } = useToast();
 * showToast("Dépense enregistrée.");
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (context === null) {
    throw new Error("useToast must be used inside <ToastProvider>.");
  }

  return context;
}
