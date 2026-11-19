import { Link, NavLink, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";
import type { User } from "../types/user";

/**
 * Top bar shown on every page of a logged-in user: app name, page tabs, account menu.
 *
 * @remarks
 * On phones (below md), the page tabs and "Mon compte" are hidden here: they live in
 * the bottom bar (MobileDock), within reach of the thumb. Only the app name and
 * "Se déconnecter" stay at the top.
 */
function Navbar({ user }: { user: User }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="navbar bg-base-100 px-4 shadow-sm">
      <div className="flex flex-1 items-center gap-2">
        <Link to="/" className="mr-2 text-lg font-bold text-primary">
          Gestion des dépenses
        </Link>
        {/* NavLink: knows whether its page is the current one (isActive) to highlight it.
            "end" on "/": otherwise "/" would also be active on /recap (every URL starts with /) */}
        <nav className="hidden gap-1 md:flex" aria-label="Pages">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `btn btn-sm ${isActive ? "btn-primary" : "btn-ghost"}`}
          >
            Saisie
          </NavLink>
          <NavLink
            to="/recap"
            className={({ isActive }) => `btn btn-sm ${isActive ? "btn-primary" : "btn-ghost"}`}
          >
            Récapitulatif
          </NavLink>
        </nav>
      </div>
      <nav className="flex items-center gap-1" aria-label="Menu du compte">
        <span className="hidden text-sm text-base-content/70 lg:inline">{user.name}</span>
        <NavLink to="/account" className="btn btn-ghost btn-sm hidden md:inline-flex">
          Mon compte
        </NavLink>
        <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
          Se déconnecter
        </button>
      </nav>
    </header>
  );
}

export default Navbar;
