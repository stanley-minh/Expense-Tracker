import { Link, NavLink, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";
import type { User } from "../types/user";

/**
 * Top bar shown on every page of a logged-in user.
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
      <div className="flex-1">
        <Link to="/" className="text-lg font-bold">
          Gestion des dépenses
        </Link>
      </div>
      <nav className="flex items-center gap-1" aria-label="Menu du compte">
        <span className="hidden text-sm text-base-content/70 sm:inline">{user.name}</span>
        <NavLink to="/account" className="btn btn-ghost btn-sm">
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
