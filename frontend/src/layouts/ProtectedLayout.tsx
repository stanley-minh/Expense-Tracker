import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../auth/useAuth";
import Navbar from "../components/Navbar";

/**
 * Layout of the pages reserved to logged-in users.
 *
 * @remarks
 * - While the session is being checked: a spinner (no flash of the login page).
 * - Nobody logged in: redirect to /login, remembering the requested page in `state`
 *   so the login page can send the user back there afterwards.
 * - Logged in: navbar + the child route (<Outlet /> = "the page that matches the URL").
 *
 * This only protects the INTERFACE: the real protection is the API, which answers
 * 401 to every request without a valid session.
 */
function ProtectedLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg" aria-label="Chargement" />
      </div>
    );
  }

  if (user === null) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar user={user} />
      <Outlet />
    </div>
  );
}

export default ProtectedLayout;
