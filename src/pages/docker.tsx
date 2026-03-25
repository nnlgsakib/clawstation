import { useDockerHealth } from "@/hooks/use-docker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { showError } from "@/lib/toast-errors"
import { RefreshCw, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

export function Docker() {
  const { data: dockerStatus, isLoading, error, isError } = useDockerHealth()
  const queryClient = useQueryClient()

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["docker"] })
  }

  // Error state (Tauri command failed)
  if (isError && error) {
    showError(error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Docker</h1>
          <p className="text-muted-foreground">
            Docker engine status and management
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Docker Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Docker Engine
            </CardTitle>
            <DockerStatusBadge status={dockerStatus} isLoading={isLoading} />
          </div>
          <CardDescription>
            {dockerStatus?.platform === "windows"
              ? "Docker Desktop with WSL2 backend"
              : "Native Docker installation"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Not installed */}
          {dockerStatus && !dockerStatus.installed && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Docker Not Found</AlertTitle>
              <AlertDescription>
                Docker is not installed on this system. Install Docker Desktop to use sandboxed OpenClaw features.
                {dockerStatus.platform === "windows" ? (
                  <span className="mt-2 block">
                    Download from: <a href="https://www.docker.com/products/docker-desktop/" className="underline" target="_blank" rel="noopener noreferrer">docker.com/products/docker-desktop</a>
                  </span>
                ) : (
                  <span className="mt-2 block">
                    Run: <code className="bg-muted px-1 rounded">sudo apt install docker.io</code> or download Docker Desktop
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Installed but not running */}
          {dockerStatus?.installed && !dockerStatus.running && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Docker Not Running</AlertTitle>
              <AlertDescription>
                {dockerStatus.platform === "windows"
                  ? "Open Docker Desktop from the Start menu and wait for it to start."
                  : "Start the Docker service: sudo systemctl start docker"}
              </AlertDescription>
            </Alert>
          )}

          {/* Running — show details */}
          {dockerStatus?.running && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Version</p>
                <p className="text-sm font-mono">{dockerStatus.version ?? "Unknown"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">API Version</p>
                <p className="text-sm font-mono">{dockerStatus.apiVersion ?? "Unknown"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Platform</p>
                <p className="text-sm capitalize">{dockerStatus.platform}</p>
              </div>
              {dockerStatus.platform === "windows" && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Backend</p>
                  <p className="text-sm">
                    {dockerStatus.wslBackend ? "WSL2" : "Hyper-V"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Checking Docker status...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DockerStatusBadge({
  status,
  isLoading,
}: {
  status: ReturnType<typeof useDockerHealth>["data"]
  isLoading: boolean
}) {
  if (isLoading) {
    return <Badge variant="secondary">Checking...</Badge>
  }
  if (!status) {
    return <Badge variant="secondary">Unknown</Badge>
  }
  if (status.running) {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Running
      </Badge>
    )
  }
  if (status.installed) {
    return (
      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Not Running
      </Badge>
    )
  }
  return (
    <Badge variant="destructive">
      <XCircle className="mr-1 h-3 w-3" />
      Not Installed
    </Badge>
  )
}
