import { useMemo } from "react";
import { useConfigStore, type ProviderConfig } from "@/stores/use-config-store";
import { useOpenClawMetadata } from "@/hooks/use-openclaw-metadata";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PROVIDER_OPTIONS = [
  { value: "anthropic", label: "Anthropic (Claude)" },
  { value: "openai", label: "OpenAI" },
  { value: "google", label: "Google (Gemini)" },
  { value: "ollama", label: "Ollama (local)" },
  { value: "azure", label: "Azure OpenAI" },
];

const DEFAULT_MODELS: Record<string, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  google: "gemini-2.0-flash",
  ollama: "llama3",
  azure: "gpt-4o",
};

const DEFAULT_PROVIDER: ProviderConfig = { provider: "", model: "" };

export function ProviderSection() {
  const { config, setProvider } = useConfigStore();
  const provider: ProviderConfig = {
    ...DEFAULT_PROVIDER,
    ...(config.provider as Partial<ProviderConfig> | undefined),
  };

  // Dynamic metadata from OpenClaw
  const { data: metadata } = useOpenClawMetadata();
  const providerOptions = useMemo(() => {
    if (!metadata) return PROVIDER_OPTIONS;
    return metadata.providers.map((p) => ({
      value: p.id,
      label: p.name,
    }));
  }, [metadata]);

  const defaultModels = useMemo(() => {
    if (!metadata) return DEFAULT_MODELS;
    const models: Record<string, string> = {};
    for (const p of metadata.providers) {
      if (p.models.length > 0) {
        models[p.id] = p.models[0].id.split("/").pop() ?? p.models[0].id;
      }
    }
    // Merge with hardcoded defaults as fallback
    return { ...DEFAULT_MODELS, ...models };
  }, [metadata]);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value;
    const newModel = defaultModels[newProvider] || "";
    setProvider({
      provider: newProvider,
      model: newModel,
      apiKeyEnv: provider.apiKeyEnv,
    });
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProvider({
      provider: provider.provider,
      model: e.target.value,
      apiKeyEnv: provider.apiKeyEnv,
    });
  };

  const handleApiKeyEnvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProvider({
      provider: provider.provider,
      model: provider.model,
      apiKeyEnv: e.target.value || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider</CardTitle>
        <CardDescription>Select your AI provider and model</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Provider Dropdown */}
        <div className="space-y-2">
          <label htmlFor="provider" className="text-sm font-medium">
            AI Provider
          </label>
          <select
            id="provider"
            value={provider.provider}
            onChange={handleProviderChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select a provider</option>
            {providerOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Model Input */}
        <div className="space-y-2">
          <label htmlFor="model" className="text-sm font-medium">
            Model
          </label>
          <input
            id="model"
            type="text"
            value={provider.model}
            onChange={handleModelChange}
            placeholder="e.g., claude-sonnet-4-20250514"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* API Key Environment Variable (Optional) */}
        <div className="space-y-2">
          <label htmlFor="apiKeyEnv" className="text-sm font-medium">
            API Key Env Var{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </label>
          <input
            id="apiKeyEnv"
            type="text"
            value={provider.apiKeyEnv || ""}
            onChange={handleApiKeyEnvChange}
            placeholder="e.g., ANTHROPIC_API_KEY"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <p className="text-xs text-muted-foreground">
            Name of the environment variable containing your API key
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
