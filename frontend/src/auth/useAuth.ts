import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "./AuthContext";

/**
 * Reads the authentication context (logged-in user, logout...).
 * @throws Error when used outside of <AuthProvider>: fails loudly instead of silently returning null
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }

  return context;
}
