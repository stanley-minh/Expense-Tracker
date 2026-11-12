import { Navigate, Outlet } from "react-router";
import { useAuth } from "../auth/useAuth";

/**
 * Layout of the login and registration pages: only for visitors who are NOT logged in.
 * A logged-in user who opens /login is sent to the home page.
 */
function GuestLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg" aria-label="Chargement" />
      </div>
    );
  }

  if (user !== null) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 p-4">
      <Outlet />
    </main>
  );
}

export default GuestLayout;
