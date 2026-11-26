import { Link, NavLink, useNavigate } from "react-router";
// Imported (not referenced as "/logo.webp"): Vite gives the file a hashed name
// (logo-elohim-3f9a1c.webp) so browsers can cache it for a long time and still
// get the new version the day the logo changes.
import logo from "../assets/logo-elohim.webp";
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
    // Gold line under the bar: the gold of the logo, as a brand touch on every page
    <header className="navbar border-b-2 border-accent bg-base-100 px-4 shadow-sm">
      <div className="flex flex-1 items-center gap-2">
        <Link to="/" className="mr-2 flex items-center gap-2 text-lg font-bold text-primary">
          {/* width/height = real ratio (320x256): the browser reserves the space before
              the image loads, so the bar does not jump (no layout shift) */}
          <img src={logo} alt="ELOHIM" width={50} height={40} className="h-10 w-auto" />
          {/* Phones: logo only, the text would push "Se déconnecter" off the bar */}
          <span className="hidden sm:inline">Gestion des dépenses</span>
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
