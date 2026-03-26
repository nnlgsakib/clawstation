import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useUninstallOpenClaw } from "@/hooks/use-uninstall";
import { useAppUpdate } from "@/hooks/use-app-update";
import { toast } from "sonner";
import { Loader2, Download, RefreshCw } from "lucide-react";
import { getName, getVersion } from "@tauri-apps/api/app";

export function Settings() {
  const [preserveConfig, setPreserveConfig] = useState(true);
  const uninstall = useUninstallOpenClaw();

  // App update state
  const {
    update,
    checking,
    downloading,
    progress,
    checkForUpdates,
    installUpdate,
  } = useAppUpdate();
  const [appName, setAppName] = useState("OpenClaw Desktop");
  const [appVersion, setAppVersion] = useState("...");

  useEffect(() => {
    getName().then(setAppName).catch(() => {});
    getVersion().then(setAppVersion).catch(() => {});
  }, []);

  function handleUninstall() {
    const confirmed = window.confirm(
      "Are you sure you want to uninstall OpenClaw? This will remove containers, images, and " +
        (preserveConfig ? "Docker artifacts. Your configuration will be preserved." : "ALL configuration files. This cannot be undone.")
    );
    if (!confirmed) return;

    uninstall.mutate(
      { preserveConfig },
      {
        onSuccess: (result) => {
          if (result.error) {
            toast.warning(`OpenClaw uninstalled with warnings: ${result.error}`);
          } else {
            toast.success("OpenClaw uninstalled successfully");
          }
        },
        onError: (err) => {
          toast.error(`Uninstall failed: ${err.message}`);
        },
      }
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your OpenClaw Desktop preferences</p>
      </div>

      {/* Desktop App Update */}
      <Card>
        <CardHeader>
          <CardTitle>Desktop App Update</CardTitle>
          <CardDescription>
            Check for and install updates to {appName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-muted-foreground">Current version:</span>{" "}
              <span className="font-mono font-medium">{appVersion}</span>
              {update && (
                <>
                  <span className="text-muted-foreground"> → </span>
                  <span className="font-mono font-medium text-primary">
                    v{update.version}
                  </span>
                </>
              )}
            </div>
          </div>

          {update && !downloading && (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
              <p className="font-medium text-primary">
                Update available: v{update.version}
              </p>
              {update.body && (
                <p className="mt-1 text-muted-foreground">{update.body}</p>
              )}
            </div>
          )}

          {downloading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Downloading update... {progress}%</span>
              </div>
              <Progress value={progress} max={100} />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={checkForUpdates}
              disabled={checking || downloading}
            >
              {checking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Check for Updates
            </Button>

            {update && !downloading && (
              <Button onClick={installUpdate}>
                <Download className="mr-2 h-4 w-4" />
                Install Update
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your OpenClaw installation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will remove OpenClaw containers, images, and optionally your configuration.
            This cannot be undone.
          </p>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <label htmlFor="preserve-config" className="text-sm font-medium">
                Preserve my configuration
              </label>
              <p className="text-sm text-muted-foreground">
                Keep config.yaml and workspace/ directory after uninstall
              </p>
            </div>
            <Switch
              id="preserve-config"
              checked={preserveConfig}
              onCheckedChange={setPreserveConfig}
            />
          </div>

          <Button
            variant="destructive"
            onClick={handleUninstall}
            disabled={uninstall.isPending}
            className="w-full"
          >
            {uninstall.isPending ? "Uninstalling..." : "Uninstall OpenClaw"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
