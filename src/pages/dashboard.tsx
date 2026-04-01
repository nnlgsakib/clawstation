import {
  Rocket,
  Monitor,
  Settings,
  ArrowRight,
  Play,
  Globe,
  Loader2,
  Zap,
  Shield,
  MessageSquare,
  Container,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGatewayStore } from "@/stores/use-gateway-store";
import { Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Dashboard landing page with status overview and quick actions.
 * Features refined card layouts, status indicators, and clear CTAs.
 */
export default function DashboardPage() {
  const { connected } = useGatewayStore();
  const [starting, setStarting] = useState(false);

  const handleStartGateway = async () => {
    setStarting(true);
    try {
      await invoke("start_gateway", { port: 18789 });
      toast.success("Gateway is running");
    } catch (e) {
      toast.error(`Failed to start: ${e}`);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          {connected
            ? "Your OpenClaw gateway is running and ready."
            : "Get started with OpenClaw in a few simple steps."}
        </p>
      </div>

      {/* Status banner */}
      {connected ? (
        <StatusBannerConnected />
      ) : (
        <StatusBannerDisconnected
          starting={starting}
          onStart={handleStartGateway}
        />
      )}

      {/* Quick actions grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Quick Actions
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {connected ? (
            <>
              <ActionCard
                icon={Globe}
                title="OpenClaw UI"
                description="Access the web control interface"
                to="/webapp"
                variant="primary"
              />
              <ActionCard
                icon={Monitor}
                title="Monitor"
                description="View logs and gateway status"
                to="/monitor"
              />
              <ActionCard
                icon={Settings}
                title="Configure"
                description="Adjust settings and providers"
                to="/configure"
              />
            </>
          ) : (
            <>
              <ActionCard
                icon={Settings}
                title="Setup"
                description="Configure model, API keys, sandbox"
                to="/setup"
                step={1}
              />
              <ActionCard
                icon={Container}
                title="Install"
                description="Install OpenClaw & start Gateway"
                to="/install"
                step={2}
              />
              <ActionCard
                icon={MessageSquare}
                title="Channels"
                description="Connect messaging platforms"
                to="/channels"
                step={3}
              />
            </>
          )}
        </div>
      </div>

      {/* Features section */}
      {!connected && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            What you can do with ClawStation
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FeatureCard
              icon={Shield}
              title="Sandboxed & Secure"
              description="Run AI agents in isolated Docker containers with configurable permissions"
            />
            <FeatureCard
              icon={MessageSquare}
              title="Multi-Channel"
              description="Connect WhatsApp, Telegram, Discord, and 20+ messaging platforms"
            />
            <FeatureCard
              icon={Zap}
              title="One-Click Updates"
              description="Keep OpenClaw and ClawStation up to date with automatic updates"
            />
            <FeatureCard
              icon={Monitor}
              title="Real-time Monitoring"
              description="Watch agent activity, container status, and logs in real-time"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBannerConnected() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-success/20 bg-success-muted/30 p-5">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
          <CheckCircle2 className="h-5 w-5 text-success" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Gateway Running</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            OpenClaw is connected and ready to handle requests. All systems
            operational.
          </p>
        </div>
        <Badge className="bg-success hover:bg-success/90 text-success-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white pulse-status" />
            Active
          </span>
        </Badge>
      </div>
    </div>
  );
}

interface StatusBannerDisconnectedProps {
  starting: boolean;
  onStart: () => void;
}

function StatusBannerDisconnected({
  starting,
  onStart,
}: StatusBannerDisconnectedProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />

      <div className="relative p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">
                Get Started
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Set up your AI assistant in three simple steps. Configure your
                model, install OpenClaw, and connect your messaging channels.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={onStart} disabled={starting} variant="outline">
              {starting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {starting ? "Starting..." : "Start Gateway"}
            </Button>
            <Button asChild>
              <Link to="/setup">
                Run Setup
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mt-5 pt-5 border-t border-border">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Typical setup takes 2-3 minutes
          </span>
        </div>
      </div>
    </div>
  );
}

interface ActionCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  to: string;
  variant?: "default" | "primary";
  step?: number;
}

function ActionCard({
  icon: Icon,
  title,
  description,
  to,
  variant,
  step,
}: ActionCardProps) {
  return (
    <Link to={to} className="block group">
      <Card
        className={cn(
          "h-full transition-all duration-200",
          "hover:border-border-hover hover:shadow-md",
          "hover:-translate-y-0.5",
          variant === "primary" && "border-primary/30 bg-primary-subtle",
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
                variant === "primary"
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            {step && (
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {step}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <CardDescription className="text-xs mt-1">
            {description}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-card/50 border border-border/50">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}
