import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useGatewayStore } from "@/stores/use-gateway-store";
import { Wifi, WifiOff, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
}

/**
 * Main application shell with sidebar navigation and header.
 * Features a refined dark theme with subtle gradients and better visual hierarchy.
 */
export function AppShell({ children }: AppShellProps) {
  const { connected, startupPhase } = useGatewayStore();

  const isStarting = startupPhase === 'starting' || startupPhase === 'health_checking';
  const isReady = connected || startupPhase === 'ready';
  const isFailed = startupPhase === 'failed';

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-[var(--sidebar-width)] shrink-0 flex-col bg-sidebar border-r border-sidebar-border">
          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-3 px-2">
            <SidebarNav />
          </div>

          {/* Gateway connection status */}
          <div className="border-t border-sidebar-border p-3 mt-auto">
            <div className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 rounded-lg",
              "transition-all duration-200",
              isReady
                ? "bg-success-muted/50 text-success"
                : isStarting
                ? "bg-warning-muted/50 text-warning"
                : isFailed
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
            )}>
              <div className="relative">
                {isStarting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isReady ? (
                  <Wifi className="h-4 w-4" />
                ) : isFailed ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <WifiOff className="h-4 w-4" />
                )}
                {/* Status dot */}
                <span
                  className={cn(
                    "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-sidebar",
                    connected
                      ? "bg-success"
                      : isStarting
                      ? "bg-warning pulse-status"
                      : isFailed
                      ? "bg-destructive"
                      : "bg-muted-foreground"
                  )}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium">
                  {connected
                    ? "Gateway Connected"
                    : isStarting
                    ? "Starting..."
                    : isFailed
                    ? "Startup Failed"
                    : "Disconnected"}
                </span>
                <span className="text-[10px] opacity-60">
                  {connected
                    ? "All systems operational"
                    : isStarting
                    ? "Health check in progress"
                    : isFailed
                    ? "Click to retry"
                    : "Click to reconnect"}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-background">
          {/* Subtle gradient overlay at the top */}
          <div className="sticky top-0 z-10 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
