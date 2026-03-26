import { useCallback } from "react";
import {
  XCircle,
  RefreshCw,
  FileText,
  ArrowLeft,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { useOnboardingStore } from "@/stores/use-onboarding-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function StepError() {
  const {
    error,
    verificationResult,
    installMethod,
    retryVerification,
    retryInstallation,
  } = useOnboardingStore();

  const handleViewLogs = useCallback(() => {
    if (installMethod === "docker") {
      // Show a helpful message about docker compose logs
      alert(
        "Run this command in your terminal:\n\ndocker compose -f ~/.openclaw/docker-compose.yml logs openclaw-gateway"
      );
    }
  }, [installMethod]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Installation Error
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong during the installation or verification process.
        </p>
      </div>

      {/* Error details */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error ?? "An unexpected error occurred."}
        </AlertDescription>
      </Alert>

      {/* Suggestions */}
      {verificationResult?.suggestion && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {verificationResult.suggestion}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button size="lg" onClick={retryVerification}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry Verification
        </Button>

        {installMethod === "docker" && (
          <Button size="lg" variant="outline" onClick={handleViewLogs}>
            <FileText className="mr-2 h-4 w-4" />
            View Logs
          </Button>
        )}

        <Button size="lg" variant="outline" onClick={retryInstallation}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>

      {/* Troubleshooting tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {installMethod === "docker" ? (
            <>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-xs font-medium text-muted-foreground">
                  1.
                </span>
                <p className="text-sm text-muted-foreground">
                  Check if Docker Desktop is running: open Docker Desktop and
                  ensure the engine is started
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-xs font-medium text-muted-foreground">
                  2.
                </span>
                <p className="text-sm text-muted-foreground">
                  Check container logs:{" "}
                  <code className="rounded bg-muted px-1 text-xs">
                    docker compose -f ~/.openclaw/docker-compose.yml logs
                  </code>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-xs font-medium text-muted-foreground">
                  3.
                </span>
                <p className="text-sm text-muted-foreground">
                  Verify port availability: ensure port 18789 is not in use by
                  another application
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-xs font-medium text-muted-foreground">
                  1.
                </span>
                <p className="text-sm text-muted-foreground">
                  Run OpenClaw doctor manually:{" "}
                  <code className="rounded bg-muted px-1 text-xs">
                    openclaw doctor --fix
                  </code>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-xs font-medium text-muted-foreground">
                  2.
                </span>
                <p className="text-sm text-muted-foreground">
                  Check that Node.js 22+ is installed:{" "}
                  <code className="rounded bg-muted px-1 text-xs">
                    node --version
                  </code>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-xs font-medium text-muted-foreground">
                  3.
                </span>
                <p className="text-sm text-muted-foreground">
                  Reinstall OpenClaw:{" "}
                  <code className="rounded bg-muted px-1 text-xs">
                    npm install -g openclaw@latest
                  </code>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
