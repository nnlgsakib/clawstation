import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Container,
  Download,
  Settings2,
  Activity,
  MessageSquare,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const mainNavItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, description: "Overview" },
  { to: "/install", label: "Install", icon: Download, description: "Setup OpenClaw" },
  { to: "/channels", label: "Channels", icon: MessageSquare, description: "Messaging" },
];

const manageNavItems: NavItem[] = [
  { to: "/docker", label: "Docker", icon: Container, description: "Containers" },
  { to: "/configure", label: "Configure", icon: Settings2, description: "Settings" },
  { to: "/monitor", label: "Monitor", icon: Activity, description: "Logs" },
  { to: "/settings", label: "Settings", icon: Settings, description: "App" },
];

/**
 * Sidebar navigation with grouped items and refined styling.
 * Features:
 * - Grouped navigation (Main vs Management)
 * - Active state with left accent bar and subtle background
 * - Hover effects with smooth transitions
 * - Icon + label + description layout
 */
export function SidebarNav() {
  return (
    <nav className="flex flex-col gap-6">
      {/* Main navigation */}
      <div className="space-y-1">
        <NavGroupLabel>Main</NavGroupLabel>
        {mainNavItems.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </div>

      {/* Management navigation */}
      <div className="space-y-1">
        <NavGroupLabel>Manage</NavGroupLabel>
        {manageNavItems.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </div>
    </nav>
  );
}

function NavGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 mb-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {children}
      </span>
    </div>
  );
}

function NavItem({ item }: { item: NavItem }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg",
          "text-sm transition-all duration-200 ease-out",
          "hover:bg-sidebar-hover",
          isActive
            ? [
                "bg-sidebar-active text-foreground font-medium",
                "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2",
                "before:w-0.5 before:h-5 before:rounded-full before:bg-primary",
              ]
            : "text-muted-foreground hover:text-foreground"
        )
      }
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors duration-200",
          "group-hover:text-foreground"
        )}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <span className="truncate">{item.label}</span>
        {item.description && (
          <span className="text-[10px] text-muted-foreground/60 truncate">
            {item.description}
          </span>
        )}
      </div>
      <ChevronRight
        className={cn(
          "h-3 w-3 opacity-0 -translate-x-1 transition-all duration-200",
          "group-hover:opacity-40 group-hover:translate-x-0"
        )}
      />
    </NavLink>
  );
}
