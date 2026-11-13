import { createContext } from "react";
import type { User } from "../types/user";

/** What every component can read through useAuth(). */
export interface AuthContextValue {
  /** Logged-in user, or null when nobody is logged in. */
  user: User | null;
  /** true while the app checks, on startup, whether a session already exists. */
  isLoading: boolean;
  /** Stores the user after a successful login / registration / account update. */
  setUser: (user: User | null) => void;
  /** Logs out on the server, then forgets the user. */
  logout: () => Promise<void>;
}

/**
 * Context: lets any component read the logged-in user without passing it
 * through the props of every intermediate component ("prop drilling").
 * null = used outside of <AuthProvider> (a programming error, see useAuth).
 */
export const AuthContext = createContext<AuthContextValue | null>(null);
