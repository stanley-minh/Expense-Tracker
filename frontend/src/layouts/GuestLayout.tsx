import { Navigate, Outlet } from "react-router";
import logo from "../assets/logo-elohim.webp";
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
    // overflow-clip: the halo is bigger than a phone screen, it must not create
    // scrollbars ("clip" instead of "hidden": no scroll container created)
    <main className="flex min-h-screen flex-col items-center justify-center overflow-clip bg-base-200 p-4">
      {/* auth-enter: entrance animation (index.css). On this wrapper, which stays
          mounted: switching between /login and /register does not replay it */}
      <div className="auth-enter flex w-full flex-col items-center gap-6">
        {/* Shown once here for both /login and /register.
            <p>, not <h1>: each page already has its own <h1> ("Connexion", "Créer un compte") */}
        <div className="auth-halo flex flex-col items-center gap-3">
          <p className="font-serif text-2xl font-bold tracking-widest text-primary uppercase sm:text-3xl">
            Expense Tracker
          </p>
          <img src={logo} alt="ELOHIM" width={160} height={128} className="h-32 w-auto" />
        </div>
        <Outlet />
      </div>
    </main>
  );
}

export default GuestLayout;
