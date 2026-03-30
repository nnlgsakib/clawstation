import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, Download, Loader2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useWizardStore, TOTAL_STEPS, MODEL_PROVIDERS } from "@/stores/use-wizard-store";
import { WelcomeStep } from "@/components/wizard/welcome-step";
import { ModelStep } from "@/components/wizard/model-step";
import { ApiKeysStep } from "@/components/wizard/api-keys-step";
import { SandboxStep } from "@/components/wizard/sandbox-step";
import { ChannelsStep } from "@/components/wizard/channels-step";
import { ReviewStep } from "@/components/wizard/review-step";
import { cn } from "@/lib/utils";

const STEP_LABELS = [
  "Welcome",
  "Model",
  "API Key",
  "Sandbox",
  "Channels",
  "Review",
];

export default function SetupWizard() {
  const navigate = useNavigate();
  const {
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    getGeneratedConfig,
    workspacePath,
    apiKey,
    modelProvider,
    selectedModel,
    customModelId,
  } = useWizardStore();
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const config = getGeneratedConfig();
      await invoke("write_config", { config });
      await invoke("write_desktop_config", {
        config: {
          workspacePath: workspacePath || null,
          gatewayPort: 18789,
          apiKey: apiKey || null,
          apiKeyEnv: null,
          selectedProvider: modelProvider,
          selectedModel: customModelId || selectedModel || null,
        },
      });
      if (apiKey && modelProvider) {
        const provider = MODEL_PROVIDERS.find((p) => p.id === modelProvider);
        if (provider && provider.authType === "api-key") {
          await invoke("write_auth_profile", {
            provider: modelProvider,
            apiKey,
            mode: "api_key",
          });
          if (provider.envVar) {
            await invoke("write_env_key", {
              envVar: provider.envVar,
              value: apiKey,
            });
          }
          toast.info(`API key saved to OpenClaw auth store`);
        }
      }
      toast.success("Configuration saved! Starting installation...");
      navigate("/install");
    } catch (err) {
      toast.error(`Failed to save config: ${err}`);
      setIsInstalling(false);
    }
  };

  const steps = [
    <WelcomeStep key="welcome" />,
    <ModelStep key="model" />,
    <ApiKeysStep key="apikeys" />,
    <SandboxStep key="sandbox" />,
    <ChannelsStep key="channels" />,
    <ReviewStep key="review" />,
  ];

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-background">
      {/* Progress bar */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm px-6 py-5">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between">
            {STEP_LABELS.map((label, i) => (
              <button
                key={label}
                onClick={() => i < currentStep && goToStep(i)}
                disabled={i > currentStep}
                className={cn(
                  "flex flex-col items-center gap-2 transition-all duration-200",
                  i <= currentStep ? "cursor-pointer" : "cursor-not-allowed opacity-40"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all duration-200",
                    i < currentStep
                      ? "bg-success text-success-foreground shadow-sm"
                      : i === currentStep
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-xs transition-colors",
                    i === currentStep
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Progress line */}
          <div className="mt-4 h-1 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80"
              initial={false}
              animate={{
                width: `${(currentStep / (TOTAL_STEPS - 1)) * 100}%`,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          {/* Step counter */}
          <div className="flex justify-center mt-3">
            <span className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {TOTAL_STEPS}
            </span>
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {steps[currentStep]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="border-t border-border bg-card/30 backdrop-blur-sm px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {/* Step dots for mobile */}
          <div className="flex items-center gap-1.5 sm:hidden">
            {STEP_LABELS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  i === currentStep ? "bg-primary" : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          {currentStep < TOTAL_STEPS - 1 ? (
            <Button onClick={nextStep} className="gap-2">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleInstall} disabled={isInstalling} className="gap-2">
              {isInstalling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isInstalling ? "Saving..." : "Start Installation"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
