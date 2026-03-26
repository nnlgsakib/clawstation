import { useCallback, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  Container,
  Rocket,
  FolderOpen,
  Trash2,
  X,
} from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import {
  useInstallOpenClaw,
  cleanInstallDir,
  cancelInstall,
  type InstallMethod,
} from "@/hooks/use-install";
import { useOnboardingStore } from "@/stores/use-onboarding-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DockerLogViewer } from "@/components/ui/log-viewer";
import { LayerProgress } from "@/components/ui/layer-progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

function getStepIcon(step: string) {
  switch (step) {
    case "checking_docker":
    case "checking_node":
      return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    case "pulling_image":
    case "installing_npm":
      return <Download className="h-5 w-5 text-primary" />;
    case "creating_dirs":
    case "writing_compose":
    case "writing_env":
    case "configuring":
      return <Container className="h-5 w-5 text-primary" />;
    case "starting_gateway":
      return <Rocket className="h-5 w-5 text-primary" />;
    case "verifying":
      return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    case "complete":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    default:
      return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
  }
}

const INSTALL_STEPS = [
  { key: "checking_docker", label: "Check Docker" },
  { key: "creating_dirs", label: "Create Dirs" },
  { key: "pulling_image", label: "Clone Repo" },
  { key: "writing_env", label: "Configure" },
  { key: "starting_gateway", label: "Build & Start" },
  { key: "verifying", label: "Verify" },
  { key: "complete", label: "Done" },
];

function InstallProgressBar({
  step,
  percent,
}: {
  step: string;
  percent: number;
}) {
  const currentIdx = INSTALL_STEPS.findIndex((s) => s.key === step);

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Step {Math.max(1, currentIdx + 1)} of {INSTALL_STEPS.length}
        </span>
        <span className="tabular-nums">{percent}%</span>
      </div>
      <div className="flex gap-1">
        {INSTALL_STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < currentIdx
                ? "bg-primary"
                : i === currentIdx
                  ? "bg-primary/60"
                  : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function getDefaultInstallDir(): string {
  // Use forward slashes for consistency; Tauri/Rust handles path separators
  return "~/.openclaw";
}

interface StepInstallProps {
  method: InstallMethod;
}

export function StepInstall({ method }: StepInstallProps) {
  const { progress, mutate, isPending, isSuccess, isError, error, data } =
    useInstallOpenClaw();
  const {
    transitionToVerify,
    transitionToError,
    isInstalling: storeIsInstalling,
    setIsInstalling,
    installDir: storeInstallDir,
    setInstallDir,
  } = useOnboardingStore();

  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanError, setCleanError] = useState<string | null>(null);

  const installDir = storeInstallDir || getDefaultInstallDir();

  const handleSelectDir = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select OpenClaw Installation Directory",
        defaultPath: installDir.replace("~", ""),
      });
      if (selected && typeof selected === "string") {
        setInstallDir(selected);
      }
    } catch {
      // User cancelled or dialog unavailable
    }
  }, [installDir, setInstallDir]);

  const handleCleanInstall = useCallback(async () => {
    setIsCleaning(true);
    setCleanError(null);
    try {
      await cleanInstallDir(installDir);
    } catch (err) {
      setCleanError(
        err instanceof Error ? err.message : "Failed to clean install directory"
      );
    } finally {
      setIsCleaning(false);
    }
  }, [installDir]);

  const handleStartInstall = useCallback(() => {
    setIsInstalling(true);
    mutate(
      { method, installDir },
      {
        onSuccess: () => {
          setIsInstalling(false);
          transitionToVerify(method);
        },
        onError: (err) => {
          setIsInstalling(false);
          transitionToError(err.message || "Installation failed");
        },
      }
    );
  }, [method, installDir, mutate, transitionToVerify, transitionToError, setIsInstalling]);

  const handleCancel = useCallback(async () => {
    try {
      await cancelInstall(installDir);
    } catch {
      // Best-effort cancellation
    }
    setIsInstalling(false);
  }, [installDir, setIsInstalling]);

  // Determine UI state — use store flag so state persists across navigation
  const isInstalling = isPending || storeIsInstalling;
  const isComplete = isSuccess;
  const hasFailed = isError;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Installing OpenClaw
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {method === "docker"
            ? "Setting up OpenClaw via Docker Compose"
            : "Installing OpenClaw natively via npm"}
        </p>
      </div>

      {/* Idle state — show config + start button */}
      {!isInstalling && !isComplete && !hasFailed && (
        <Card>
          <CardContent className="flex flex-col gap-6 p-8">
            {/* Install directory picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Installation Directory</label>
              <div className="flex gap-2">
                <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono">
                  {installDir}
                </div>
                <Button variant="outline" size="icon" onClick={handleSelectDir}>
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                OpenClaw configs, workspace, and repository will be stored here.
              </p>
            </div>

            {/* Clean install */}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCleanInstall}
                disabled={isCleaning}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isCleaning ? "Cleaning..." : "Clean Install Directory"}
              </Button>
              {cleanError && (
                <p className="text-xs text-destructive">{cleanError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Removes the directory above for a fresh start. Safe to skip if this is
                your first install.
              </p>
            </div>

            {/* Start button */}
            <div className="text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                {method === "docker"
                  ? "This will clone the OpenClaw repository and start services via Docker Compose."
                  : "This will install OpenClaw globally via npm and run the setup wizard."}
              </p>
              <Button size="lg" onClick={handleStartInstall}>
                {method === "docker" ? (
                  <Container className="mr-2 h-4 w-4" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Start Installation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Installing state — real-time Docker logs with layer progress */}
      {isInstalling && !progress?.step && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Preparing Installation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-48" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2 space-y-2">
                <Skeleton className="h-80 w-full" />
              </div>
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2 flex-1" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isInstalling && progress?.step && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {getStepIcon(progress.step)}
              {progress.message}
            </CardTitle>
            <InstallProgressBar step={progress.step} percent={progress.percent} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="h-80">
                <DockerLogViewer />
              </div>
              <div className="h-80 overflow-y-auto rounded-lg border p-4">
                <LayerProgress className="space-y-1" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel Installation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success state */}
      {isComplete && data && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div className="text-center">
              <h2 className="text-lg font-semibold">Installation Complete!</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                OpenClaw {data.version ?? "latest"} installed via {data.method}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Gateway: {data.gatewayUrl}
              </p>
            </div>
            <Button onClick={() => transitionToVerify(method)}>
              Continue to Verification
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {hasFailed && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Installation Failed</AlertTitle>
          <AlertDescription>
            {error?.message ?? "An unexpected error occurred during installation."}
          </AlertDescription>
          <div className="mt-4">
            <Button variant="outline" onClick={handleStartInstall}>
              Retry Installation
            </Button>
          </div>
        </Alert>
      )}
    </div>
  );
}
