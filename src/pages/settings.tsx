import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useUninstallOpenClaw } from "@/hooks/use-uninstall";
import { toast } from "sonner";

export function Settings() {
  const [preserveConfig, setPreserveConfig] = useState(true);
  const uninstall = useUninstallOpenClaw();

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
