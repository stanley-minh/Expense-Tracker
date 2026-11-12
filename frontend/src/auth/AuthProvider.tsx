import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCurrentUser, logout as logoutRequest, setUnauthorizedHandler } from "../api/client";
import type { User } from "../types/user";
import { AuthContext, type AuthContextValue } from "./AuthContext";

/**
 * Holds the logged-in user for the whole app.
 *
 * @remarks
 * On startup it asks the API who is logged in (GET /api/auth/me): the session
 * cookie survives a page reload, so the user stays logged in.
 * It also registers the global 401 handler: if the session expires while the
 * app is open, the user is forgotten and the routes redirect to /login.
 */
function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    getCurrentUser(controller.signal)
      .then(setUser)
      .catch(() => {
        // 401 = nobody logged in: a normal situation, not an error to display
        if (!controller.signal.aborted) setUser(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    // Any later 401 (expired session, deleted account) logs the user out of the app
    setUnauthorizedHandler(() => setUser(null));

    return () => {
      controller.abort();
      setUnauthorizedHandler(null);
    };
  }, []);

  // useCallback: the same function object across renders (it is part of the context value)
  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null); // forget the user even if the server could not be reached
    }
  }, []);

  // useMemo: a new value object only when something changed, so the components
  // using the context do not re-render for nothing
  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, setUser, logout }),
    [user, isLoading, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
