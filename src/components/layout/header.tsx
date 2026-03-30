import { Clapperboard, Command, ExternalLink } from "lucide-react";
import { PlatformBadge } from "@/components/status/platform-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * App header with logo, title, and quick actions.
 * Features a glass morphism effect and refined styling.
 */
export function Header() {
  return (
    <header className="flex h-[var(--header-height)] items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-5">
      {/* Logo and branding */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20">
          <Clapperboard className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground tracking-tight">
            ClawStation
          </span>
          <span className="text-[10px] text-muted-foreground -mt-0.5">
            OpenClaw Manager
          </span>
        </div>
      </div>

      {/* Center area — keyboard shortcut hint */}
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted/50 text-muted-foreground text-xs">
        <Command className="h-3 w-3" />
        <span>⌘K</span>
        <span className="mx-1">or</span>
        <span>Ctrl+K</span>
        <span className="ml-1 opacity-60">for commands</span>
      </div>

      {/* Right section — status and actions */}
      <div className="flex items-center gap-3">
        <PlatformBadge />

        {/* Docs link */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "text-muted-foreground hover:text-foreground",
            "hidden sm:flex"
          )}
          asChild
        >
          <a
            href="https://docs.openclaw.ai"
            target="_blank"
            rel="noopener noreferrer"
          >
            Docs
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </Button>

        {/* Version indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded bg-muted/30">
          <span className="text-[10px] text-muted-foreground">v0.1.0</span>
        </div>
      </div>
    </header>
  );
}
