import { useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  Monitor,
  Container,
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi,
} from "lucide-react";
import {
  useOnboardingStore,
  type SystemCheckResult,
} from "@/stores/use-onboarding-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CheckItem {
  label: string;
  icon: React.ReactNode;
  passed: boolean;
  value: string;
  suggestion?: string;
}

function getCheckItems(result: SystemCheckResult): CheckItem[] {
  return [
    {
      label: "Platform",
      icon: <Monitor className="h-5 w-5" />,
      passed: true,
      value: result.platform,
    },
    {
      label: "Docker Installed",
      icon: <Container className="h-5 w-5" />,
      passed: result.dockerAvailable,
      value: result.dockerAvailable ? "Available" : "Not found",
      suggestion: result.dockerAvailable
        ? undefined
        : "Install Docker Desktop from https://docker.com/get-started",
    },
    {
      label: "Docker Running",
      icon: <Container className="h-5 w-5" />,
      passed: result.dockerRunning,
      value: result.dockerRunning ? "Running" : "Not running",
      suggestion: result.dockerRunning
        ? undefined
        : "Start Docker Desktop (Windows) or run: sudo systemctl start docker (Linux)",
    },
    {
      label: "Node.js",
      icon: <Cpu className="h-5 w-5" />,
      passed: result.nodeAvailable,
      value: result.nodeAvailable
        ? (result.nodeVersion ?? "Installed")
        : "Not found",
      suggestion: result.nodeAvailable
        ? undefined
        : "Install Node.js 22+ from https://nodejs.org",
    },
    {
      label: "Disk Space",
      icon: <HardDrive className="h-5 w-5" />,
      passed: result.diskFreeGb >= 2,
      value: `${result.diskFreeGb} GB free`,
      suggestion: result.diskFreeGb >= 2
        ? undefined
        : "Free up at least 2 GB of disk space before installing",
    },
    {
      label: "Available RAM",
      icon: <MemoryStick className="h-5 w-5" />,
      passed: result.ramAvailableGb >= 2,
      value: `${result.ramAvailableGb} GB available`,
      suggestion: result.ramAvailableGb >= 2
        ? undefined
        : "Close other applications to free up at least 2 GB of RAM",
    },
    {
      label: "Port 18789",
      icon: <Wifi className="h-5 w-5" />,
      passed: result.port18789Free,
      value: result.port18789Free ? "Available" : "In use",
      suggestion: result.port18789Free
        ? undefined
        : "Port 18789 is occupied. Stop the conflicting service or change OPENCLAW_GATEWAY_PORT",
    },
  ];
}

function allChecksPass(result: SystemCheckResult): boolean {
  return (
    result.dockerAvailable &&
    result.dockerRunning &&
    result.nodeAvailable &&
    result.diskFreeGb >= 2 &&
    result.ramAvailableGb >= 2 &&
    result.port18789Free
  );
}

export function SystemCheck() {
  const {
    systemCheckResult,
    isLoading,
    error,
    setSystemCheckResult,
    setLoading,
    setError,
    setStep,
  } = useOnboardingStore();

  const runCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<SystemCheckResult>("run_system_check");
      setSystemCheckResult(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [setSystemCheckResult, setError, setLoading]);

  // Run check on mount
  useEffect(() => {
    if (!systemCheckResult) {
      runCheck();
    }
  }, [systemCheckResult, runCheck]);

  const checks = systemCheckResult
    ? getCheckItems(systemCheckResult)
    : [];
  const canProceed = systemCheckResult
    ? allChecksPass(systemCheckResult)
    : false;
  const failedChecks = checks.filter((c) => !c.passed);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          System Check
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Verifying your system meets the requirements for OpenClaw installation
        </p>
      </div>

      {/* Loading state */}
      {isLoading && !systemCheckResult && (
        <Card>
          <CardContent className="flex items-center justify-center gap-3 p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              Running system checks...
            </span>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>System check failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Check results */}
      {systemCheckResult && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Check Results</CardTitle>
                <Badge
                  variant={failedChecks.length === 0 ? "default" : "destructive"}
                >
                  {checks.length - failedChecks.length}/{checks.length} passed
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {checks.map((check) => (
                <div
                  key={check.label}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="text-muted-foreground">{check.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {check.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {check.value}
                      </span>
                    </div>
                    {check.suggestion && (
                      <p className="mt-1 text-xs text-destructive">
                        {check.suggestion}
                      </p>
                    )}
                  </div>
                  {check.passed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={runCheck}
              disabled={isLoading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Retry Check
            </Button>
            <Button
              onClick={() => setStep("install")}
              disabled={!canProceed}
            >
              Proceed to Install
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
