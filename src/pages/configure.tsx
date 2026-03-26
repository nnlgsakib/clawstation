import { useEffect } from "react";
import { useConfig, useSaveConfig, useValidateConfig } from "@/hooks/use-config";
import { useConfigStore } from "@/stores/use-config-store";
import { ProviderSection } from "@/components/config/provider-section";
import { SandboxSection } from "@/components/config/sandbox-section";
import { ToolsSection } from "@/components/config/tools-section";
import { AgentsSection } from "@/components/config/agents-section";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { showError } from "@/lib/toast-errors";
import { Save, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function Configure() {
  const { data: config, isLoading, error, isError } = useConfig();
  const saveConfig = useSaveConfig();
  const validateConfig = useValidateConfig();
  const { config: storeConfig, isDirty, setConfig, markClean } = useConfigStore();
  const [isSaving, setIsSaving] = useState(false);

  // Load config into store on mount
  useEffect(() => {
    if (config) {
      setConfig(config);
    }
  }, [config, setConfig]);

  // Show error if query fails
  if (isError && error) {
    showError(error);
  }

  const handleSave = async () => {
    if (!isDirty) return;

    setIsSaving(true);
    try {
      // Track sandbox transition before save
      const wasSandboxDisabled = !storeConfig?.sandbox?.enabled;
      const isSandboxNowEnabled = storeConfig?.sandbox?.enabled;

      // First validate
      const validation = await validateConfig.mutateAsync(storeConfig);

      if (!validation.valid && validation.errors.length > 0) {
        const errorMessages = validation.errors
          .map((e) => `${e.field}: ${e.message}`)
          .join(", ");
        showError(new Error(errorMessages));
        setIsSaving(false);
        return;
      }

      // Then save
      await saveConfig.mutateAsync(storeConfig);
      markClean();
      toast.success("Configuration saved successfully");

      // Trigger sandbox setup if sandbox was just enabled
      if (wasSandboxDisabled && isSandboxNowEnabled) {
        toast.info("Setting up sandbox environment...");
        try {
          await invoke("setup_sandbox", { config: storeConfig });
          toast.success("Sandbox setup complete");
        } catch (err) {
          const msg = String(err);
          if (msg.includes("not found") || msg.includes("unknown")) {
            toast.info("Sandbox setup pending — backend command not yet implemented");
          } else {
            toast.error(`Sandbox setup failed: ${err}`);
          }
        }
      }
    } catch (err) {
      showError(err as Error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Save button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configure</h1>
          <p className="text-muted-foreground">
            Configure your OpenClaw AI provider and sandbox settings
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save
        </Button>
      </div>

      {/* Loading state — skeleton matching config sections layout */}
      {isLoading && <ConfigureSkeleton />}

      {/* Configuration sections */}
      {!isLoading && (
        <div className="space-y-6">
          <ProviderSection />
          <SandboxSection />
          <ToolsSection />
          <AgentsSection />
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton loading state matching the configuration page layout.
 * Shows 4 section skeletons matching ProviderSection, SandboxSection,
 * ToolsSection, and AgentsSection.
 */
function ConfigureSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56 mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}