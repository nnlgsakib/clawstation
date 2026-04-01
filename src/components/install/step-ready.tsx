import { useCallback } from "react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe,
  Key,
  PartyPopper,
} from "lucide-react";
import { useOnboardingStore } from "@/stores/use-onboarding-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function StepReady() {
  const { verificationResult, installMethod, reset } = useOnboardingStore();

  const handleCopyToken = useCallback(async () => {
    if (verificationResult?.gatewayToken) {
      await navigator.clipboard.writeText(verificationResult.gatewayToken);
    }
  }, [verificationResult]);

  const handleOpenDashboard = useCallback(() => {
    const url = verificationResult?.gatewayUrl ?? "http://127.0.0.1:18789";
    window.open(url, "_blank");
  }, [verificationResult]);

  const handleDone = useCallback(() => {
    reset();
  }, [reset]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <PartyPopper className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Installation Complete!
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          OpenClaw has been successfully installed
          {installMethod === "docker" ? " via Docker" : " natively"}.
        </p>
      </div>

      {/* Gateway info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5" />
            Gateway
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">URL</span>
            <code className="rounded bg-muted px-2 py-1 text-sm">
              {verificationResult?.gatewayUrl ?? "http://127.0.0.1:18789"}
            </code>
          </div>

          {/* Gateway token - Docker only */}
          {installMethod === "docker" && verificationResult?.gatewayToken && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Key className="h-3 w-3" />
                Token
              </span>
              <div className="flex items-center gap-2">
                <code className="rounded bg-muted px-2 py-1 text-xs max-w-[200px] truncate">
                  {verificationResult.gatewayToken.substring(0, 16)}...
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyToken}
                  title="Copy full token"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
            <div>
              <p className="text-sm font-medium">Open the dashboard</p>
              <p className="text-xs text-muted-foreground">
                Access the OpenClaw gateway at{" "}
                {verificationResult?.gatewayUrl ?? "http://127.0.0.1:18789"}
              </p>
            </div>
          </div>

          {installMethod === "docker" && verificationResult?.gatewayToken && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Save your gateway token</p>
                <p className="text-xs text-muted-foreground">
                  Copy the token above — you&apos;ll need it to authenticate API
                  requests
                </p>
              </div>
            </div>
          )}

          {installMethod === "native" && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Run OpenClaw commands</p>
                <p className="text-xs text-muted-foreground">
                  Use{" "}
                  <code className="rounded bg-muted px-1">openclaw --help</code>{" "}
                  to see available commands
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button size="lg" onClick={handleOpenDashboard}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Open Dashboard
        </Button>
        <Button size="lg" variant="outline" onClick={handleDone}>
          Done
        </Button>
      </div>

      {/* Warning for native installs */}
      {installMethod === "native" && (
        <Alert>
          <AlertDescription className="text-xs">
            If the dashboard doesn&apos;t open, try running{" "}
            <code className="rounded bg-muted px-1">
              openclaw gateway start
            </code>{" "}
            in your terminal first.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
