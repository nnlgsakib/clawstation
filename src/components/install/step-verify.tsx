import { useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useMutation } from "@tanstack/react-query";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import {
  useOnboardingStore,
  type VerificationResult,
} from "@/stores/use-onboarding-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface VerifyProgress {
  step: string;
  percent: number;
  message: string;
}

function getVerifyStepIcon(step: string) {
  switch (step) {
    case "verify_starting":
      return <ShieldCheck className="h-5 w-5 text-primary" />;
    case "verify_gateway":
    case "verify_doctor":
      return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    case "verify_gateway_ready":
    case "verify_doctor_ok":
    case "verify_complete":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "verify_failed":
      return <XCircle className="h-5 w-5 text-destructive" />;
    default:
      return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
  }
}

export function StepVerify() {
  const {
    installMethod,
    verificationProgress,
    setVerificationProgress,
    transitionToReady,
    transitionToError,
  } = useOnboardingStore();

  const verifyMutation = useMutation<VerificationResult, Error, string>({
    mutationFn: async (method: string) => {
      return await invoke<VerificationResult>("verify_installation", {
        method,
      });
    },
    onSuccess: (result) => {
      if (result.success) {
        transitionToReady(result);
      } else {
        transitionToError(result.error ?? "Verification failed");
      }
    },
    onError: (err) => {
      transitionToError(err.message ?? "Verification failed");
    },
  });

  // Listen for verification progress events
  useEffect(() => {
    const unlisten = listen<VerifyProgress>("install-progress", (event) => {
      setVerificationProgress(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [setVerificationProgress]);

  // Auto-start verification on mount
  useEffect(() => {
    if (
      !verifyMutation.isPending &&
      !verifyMutation.isSuccess &&
      !verifyMutation.isError
    ) {
      verifyMutation.mutate(installMethod ?? "docker");
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = useCallback(() => {
    verifyMutation.reset();
    setVerificationProgress(null);
    verifyMutation.mutate(installMethod ?? "docker");
  }, [installMethod, verifyMutation, setVerificationProgress]);

  const isVerifying = verifyMutation.isPending;
  const hasFailed = verifyMutation.isError;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Verifying Installation
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {installMethod === "docker"
            ? "Checking that the OpenClaw gateway is running and healthy"
            : "Running OpenClaw doctor to verify the installation"}
        </p>
      </div>

      {/* Verifying state */}
      {isVerifying && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {getVerifyStepIcon(verificationProgress?.step ?? "")}
              Verification in Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={verificationProgress?.percent ?? 10} />
            <div className="text-center">
              <p className="text-sm font-medium">
                {verificationProgress?.message ?? "Starting verification..."}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {verificationProgress?.percent ?? 10}% complete
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed state */}
      {hasFailed && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <XCircle className="h-5 w-5 text-destructive" />
              Verification Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {verifyMutation.error?.message ??
                "An unexpected error occurred during verification."}
            </p>
            <div className="flex gap-3">
              <Button onClick={handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Verification
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
