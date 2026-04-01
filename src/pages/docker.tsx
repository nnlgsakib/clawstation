import { useDockerHealth } from "@/hooks/use-docker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { showError } from "@/lib/toast-errors";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Container,
  Server,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export function Docker() {
  const { data: dockerStatus, isLoading, error, isError } = useDockerHealth();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["docker"] });
  };

  if (isError && error) {
    showError(error);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Docker
          </h1>
          <p className="text-sm text-muted-foreground">
            Docker engine status and management
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw
            className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      {/* Docker Status Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-lg",
                  dockerStatus?.running ? "bg-success/10" : "bg-muted",
                )}
              >
                <Container
                  className={cn(
                    "h-5 w-5",
                    dockerStatus?.running
                      ? "text-success"
                      : "text-muted-foreground",
                  )}
                />
              </div>
              <div>
                <CardTitle className="text-lg">Docker Engine</CardTitle>
                <CardDescription>
                  {dockerStatus?.platform === "windows"
                    ? "Docker Desktop with WSL2 backend"
                    : "Native Docker installation"}
                </CardDescription>
              </div>
            </div>
            <DockerStatusBadge status={dockerStatus} isLoading={isLoading} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Not installed */}
          {dockerStatus && !dockerStatus.installed && (
            <Alert variant="destructive" className="border-destructive/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Docker Not Found</AlertTitle>
              <AlertDescription>
                Docker is not installed on this system. Install Docker Desktop
                to use sandboxed OpenClaw features.
                {dockerStatus.platform === "windows" ? (
                  <span className="mt-3 block">
                    Download from:{" "}
                    <a
                      href="https://www.docker.com/products/docker-desktop/"
                      className="font-medium underline hover:text-foreground"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      docker.com/products/docker-desktop
                    </a>
                  </span>
                ) : (
                  <span className="mt-3 block">
                    Run:{" "}
                    <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">
                      sudo apt install docker.io
                    </code>{" "}
                    or download Docker Desktop
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Installed but not running */}
          {dockerStatus?.installed && !dockerStatus.running && (
            <Alert className="border-warning/30 bg-warning/5">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertTitle className="text-warning">
                Docker Not Running
              </AlertTitle>
              <AlertDescription>
                {dockerStatus.platform === "windows"
                  ? "Open Docker Desktop from the Start menu and wait for it to start."
                  : "Start the Docker service: sudo systemctl start docker"}
              </AlertDescription>
            </Alert>
          )}

          {/* Running — show details */}
          {dockerStatus?.running && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatusCard
                  icon={Server}
                  label="Version"
                  value={dockerStatus.version ?? "Unknown"}
                  mono
                />
                <StatusCard
                  icon={Server}
                  label="API Version"
                  value={dockerStatus.apiVersion ?? "Unknown"}
                  mono
                />
                <StatusCard
                  icon={Container}
                  label="Platform"
                  value={dockerStatus.platform}
                  capitalize
                />
                {dockerStatus.platform === "windows" && (
                  <StatusCard
                    icon={Server}
                    label="Backend"
                    value={dockerStatus.wslBackend ? "WSL2" : "Hyper-V"}
                  />
                )}
              </div>

              {/* Success message */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-success-muted/30 border border-success/20">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-sm text-success">
                  Docker is running and ready for sandboxed OpenClaw deployments
                </span>
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Checking Docker status...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-info/10 shrink-0">
              <Container className="h-5 w-5 text-info" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                About Docker Sandboxing
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Docker provides isolated environments for running OpenClaw
                agents safely. With sandboxing enabled, each agent runs in its
                own container with configurable permissions, network access, and
                resource limits.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  mono,
  capitalize,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="p-4 rounded-lg border border-border bg-card/50">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p
        className={cn(
          "text-sm font-medium text-foreground",
          mono && "font-mono",
          capitalize && "capitalize",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function DockerStatusBadge({
  status,
  isLoading,
}: {
  status: ReturnType<typeof useDockerHealth>["data"];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Badge variant="outline">
        <RefreshCw className="mr-1.5 h-3 w-3 animate-spin" />
        Checking...
      </Badge>
    );
  }
  if (!status) {
    return <Badge variant="outline">Unknown</Badge>;
  }
  if (status.running) {
    return (
      <Badge variant="success">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success pulse-status" />
          Running
        </span>
      </Badge>
    );
  }
  if (status.installed) {
    return (
      <Badge variant="warning">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Not Running
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">
      <XCircle className="mr-1 h-3 w-3" />
      Not Installed
    </Badge>
  );
}
