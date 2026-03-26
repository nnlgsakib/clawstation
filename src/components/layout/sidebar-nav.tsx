import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Container,
  Download,
  Settings2,
  Activity,
  MessageSquare,
  Cog,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/docker", label: "Docker", icon: Container },
  { to: "/install", label: "Install", icon: Download },
  { to: "/channels", label: "Channels", icon: MessageSquare },
  { to: "/configure", label: "Configure", icon: Settings2 },
  { to: "/monitor", label: "Monitor", icon: Activity },
  { to: "/settings", label: "Settings", icon: Cog },
];

/**
 * Sidebar navigation with 7 items using Lucide icons.
 * Active state: blue-600 left border (3px) + blue-50 background.
 */
export function SidebarNav() {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              isActive
                ? "border-l-[3px] border-blue-600 bg-blue-50 font-medium text-blue-700"
                : "border-l-[3px] border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`
          }
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
