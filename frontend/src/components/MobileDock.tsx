import type { ReactNode } from "react";
import { NavLink } from "react-router";

/** One entry of the bottom bar. */
interface DockItem {
  to: string;
  label: string;
  icon: ReactNode;
  /** true for "/": otherwise it would also be active on every other page. */
  end?: boolean;
}

/**
 * Inline SVG icons (no icon library to install). stroke="currentColor": the icon
 * takes the text color, so it follows the theme and the active state automatically.
 * aria-hidden: the visible label already says what the button does.
 */
const iconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "size-5",
  "aria-hidden": true,
};

const ITEMS: DockItem[] = [
  {
    to: "/",
    label: "Saisie",
    end: true,
    // "plus in a circle": add an expense
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    to: "/recap",
    label: "Récap",
    // "list": the table of expenses
    icon: (
      <svg {...iconProps}>
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
  },
  {
    to: "/account",
    label: "Compte",
    // "person": the account
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
  },
];

/**
 * Bottom navigation bar, phones only (hidden from md = 768px, where the top navbar
 * shows the same links). Fixed at the bottom of the screen, within reach of the
 * thumb, like most mobile apps. Uses daisyUI 5's "dock" component.
 *
 * The layout adds bottom padding on phones so the dock never hides the end of a page.
 */
function MobileDock() {
  return (
    <nav className="dock border-t border-base-300 bg-base-100 md:hidden" aria-label="Navigation">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => (isActive ? "dock-active text-primary" : "")}
        >
          {item.icon}
          <span className="dock-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default MobileDock;
