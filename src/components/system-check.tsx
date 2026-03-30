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
  ShieldCheck,
} from "lucide-react";
import {
  useOnboardingStore,
  type SystemCheckResult,
} from "@/stores/use-onboarding-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

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
      value: result.nodeAvailable ? result.nodeVersion ?? "Installed" : "Not found",
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

  const checks = systemCheckResult ? getCheckItems(systemCheckResult) : [];
  const canProceed = systemCheckResult ? allChecksPass(systemCheckResult) : false;
  const failedChecks = checks.filter((c) => !c.passed);
  const passedChecks = checks.length - failedChecks.length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          System Check
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Verifying your system meets the requirements for OpenClaw installation
        </p>
      </div>

      {/* Loading state */}
      {isLoading && !systemCheckResult && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Running system checks...</p>
              <p className="text-xs text-muted-foreground mt-1">
                This may take a few seconds
              </p>
            </div>
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
          {/* Summary card */}
          <Card
            className={cn(
              canProceed && "border-success/30 bg-success/5"
            )}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-xl",
                      canProceed ? "bg-success/10" : "bg-warning/10"
                    )}
                  >
                    {canProceed ? (
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    ) : (
                      <XCircle className="h-6 w-6 text-warning" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {canProceed ? "All checks passed" : "Some checks failed"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {passedChecks} of {checks.length} requirements met
                    </p>
                  </div>
                </div>
                <Badge
                  variant={canProceed ? "success" : "warning"}
                  className="text-base px-3 py-1"
                >
                  {passedChecks}/{checks.length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Individual checks */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Check Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {checks.map((check) => (
                <div
                  key={check.label}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    check.passed
                      ? "border-border bg-card/50"
                      : "border-warning/30 bg-warning/5"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg",
                      check.passed ? "bg-muted" : "bg-warning/10"
                    )}
                  >
                    <span className={check.passed ? "text-muted-foreground" : "text-warning"}>
                      {check.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {check.label}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {check.value}
                      </span>
                    </div>
                    {check.suggestion && (
                      <p className="mt-1 text-xs text-warning">{check.suggestion}</p>
                    )}
                  </div>
                  {check.passed ? (
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-warning shrink-0" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={runCheck}
              disabled={isLoading}
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
              Retry Check
            </Button>
            <Button onClick={() => setStep("install")} disabled={!canProceed}>
              Proceed to Install
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
