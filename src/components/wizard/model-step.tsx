import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  ChevronDown,
  Search,
  RefreshCw,
  Loader2,
  Globe,
  Layers,
  Server,
  Sparkles,
} from "lucide-react";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  useWizardStore,
  MODEL_PROVIDERS,
  PROVIDER_CATEGORIES,
} from "@/stores/use-wizard-store";
import { useProviderModels } from "@/hooks/use-models";
import { useOpenClawMetadata } from "@/hooks/use-openclaw-metadata";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ModelProvider } from "@/stores/use-wizard-store";

// ─── Category icons ──────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, typeof Sparkles> = {
  major: Sparkles,
  "multi-provider": Layers,
  other: Globe,
  local: Server,
};

// ─── Click outside hook ──────────────────────────────────────────────

function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void
) {
  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

// ─── Provider Combobox ───────────────────────────────────────────────

function ProviderCombobox({
  providers,
  categories,
  value,
  onSelect,
}: {
  providers: ModelProvider[];
  categories: Record<string, string>;
  value: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  useClickOutside(containerRef, () => setOpen(false));

  const selectedProvider = providers.find((p) => p.id === value);

  const handleToggle = useCallback(() => {
    if (!open) {
      setSearch("");
      setActiveIndex(-1);
      requestAnimationFrame(() => searchRef.current?.focus());
    }
    setOpen(!open);
  }, [open]);

  // Filter and group
  const filtered = useMemo(() => {
    if (!search) return providers;
    const s = search.toLowerCase();
    return providers.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.id.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s)
    );
  }, [providers, search]);

  const grouped = useMemo(
    () =>
      Object.entries(categories)
        .map(([catId, catLabel]) => ({
          id: catId,
          label: catLabel,
          providers: filtered.filter((p) => p.category === catId),
        }))
        .filter((g) => g.providers.length > 0),
    [filtered, categories]
  );

  // Flat list for keyboard nav
  const flatList = useMemo(
    () => grouped.flatMap((g) => g.providers),
    [grouped]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatList.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        onSelect(flatList[activeIndex].id);
        setOpen(false);
      }
    },
    [flatList, activeIndex, onSelect]
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-all",
          "border-border bg-background hover:border-ring/50",
          open && "border-ring ring-2 ring-ring/20",
          selectedProvider && "border-primary/30 bg-primary/5"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          {selectedProvider ? (
            <>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <span className="text-sm font-semibold">
                  {selectedProvider.name.charAt(0)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedProvider.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedProvider.description}
                </p>
              </div>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              Select a provider...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selectedProvider && (
            <AuthBadge authType={selectedProvider.authType} />
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg"
            onKeyDown={handleKeyDown}
          >
            {/* Search */}
            <div className="border-b border-border p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search providers..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setActiveIndex(-1);
                  }}
                  className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {/* Provider list */}
            <div className="max-h-64 overflow-y-auto p-1">
              {grouped.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No providers found
                </p>
              ) : (
                grouped.map((group) => {
                  const Icon = CATEGORY_ICONS[group.id] || Globe;
                  return (
                    <div key={group.id} className="mb-1 last:mb-0">
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5">
                        <Icon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {group.label}
                        </span>
                      </div>
                      {group.providers.map((provider) => {
                        const idx = flatList.indexOf(provider);
                        const isSelected = value === provider.id;
                        const isActive = idx === activeIndex;
                        return (
                          <button
                            key={provider.id}
                            type="button"
                            onClick={() => {
                              onSelect(provider.id);
                              setOpen(false);
                            }}
                            onMouseEnter={() => setActiveIndex(idx)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors",
                              isSelected
                                ? "bg-primary/10 text-primary"
                                : isActive
                                  ? "bg-accent text-accent-foreground"
                                  : "text-popover-foreground hover:bg-accent"
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
                                isSelected
                                  ? "bg-primary/20 text-primary"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {provider.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {provider.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {provider.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-muted-foreground">
                                {provider.models.length}
                              </span>
                              {isSelected && (
                                <Check className="h-3.5 w-3.5 text-primary" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-3 py-1.5">
              <p className="text-[10px] text-muted-foreground">
                {filtered.length} provider{filtered.length !== 1 ? "s" : ""}{" "}
                {search ? "found" : "available"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Model Combobox ──────────────────────────────────────────────────

function ModelCombobox({
  models,
  value,
  customValue,
  onSelect,
  onCustomChange,
  providerName,
  isLoading,
  isError,
  onRefresh,
}: {
  models: { id: string; name: string | null; provider: string }[];
  value: string;
  customValue: string;
  onSelect: (id: string) => void;
  onCustomChange: (id: string) => void;
  providerName: string;
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  useClickOutside(containerRef, () => setOpen(false));

  const handleToggle = useCallback(() => {
    if (!open) {
      setSearch("");
      setActiveIndex(-1);
      requestAnimationFrame(() => searchRef.current?.focus());
    }
    setOpen(!open);
  }, [open]);

  const filtered = useMemo(() => {
    if (!search) return models;
    const s = search.toLowerCase();
    return models.filter(
      (m) =>
        m.id.toLowerCase().includes(s) ||
        (m.name && m.name.toLowerCase().includes(s))
    );
  }, [models, search]);

  const displayValue = customValue || value;
  const selectedModel = models.find((m) => m.id === value);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        onSelect(filtered[activeIndex].id);
        setOpen(false);
      }
    },
    [filtered, activeIndex, onSelect]
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-all",
          "border-border bg-background hover:border-ring/50",
          open && "border-ring ring-2 ring-ring/20",
          displayValue && "border-primary/30 bg-primary/5"
        )}
      >
        <div className="min-w-0 flex-1">
          {displayValue ? (
            <div>
              <p className="text-sm font-medium truncate">
                {selectedModel?.name ||
                  customValue ||
                  displayValue.split("/").pop()}
              </p>
              <p className="text-xs text-muted-foreground truncate font-mono">
                {displayValue}
              </p>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              Select a model...
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg"
            onKeyDown={handleKeyDown}
          >
            {/* Header */}
            <div className="border-b border-border p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder={`Search ${providerName} models...`}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setActiveIndex(-1);
                  }}
                  className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {/* Model list */}
            <div className="max-h-52 overflow-y-auto p-1">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Fetching models...
                  </span>
                </div>
              ) : filtered.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No models found. Try refreshing or enter a custom ID below.
                </p>
              ) : (
                filtered.map((model, idx) => {
                  const isSelected = value === model.id && !customValue;
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        onSelect(model.id);
                        setOpen(false);
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left transition-colors",
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-popover-foreground hover:bg-accent"
                      )}
                    >
                      <span className="truncate text-sm">
                        {model.name || model.id.split("/").pop()}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Custom model input */}
            <div className="border-t border-border p-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Or type a custom model ID..."
                  value={customValue}
                  onChange={(e) => onCustomChange(e.target.value)}
                  className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="shrink-0 rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title="Refresh models"
                >
                  {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              {isError && (
                <p className="mt-1 text-[10px] text-yellow-600">
                  API unavailable — using default model list
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-3 py-1.5">
              <p className="text-[10px] text-muted-foreground">
                {filtered.length} model{filtered.length !== 1 ? "s" : ""}{" "}
                {search ? "found" : "available"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Auth badge ──────────────────────────────────────────────────────

function AuthBadge({ authType }: { authType: ModelProvider["authType"] }) {
  const config = {
    "api-key": { label: "API Key", variant: "info" as const },
    oauth: { label: "OAuth", variant: "default" as const },
    none: { label: "Local", variant: "success" as const },
    token: { label: "Token", variant: "secondary" as const },
  };
  const { label, variant } = config[authType] || config["api-key"];
  return (
    <Badge variant={variant} className="text-[10px] px-1.5 py-0">
      {label}
    </Badge>
  );
}

// ─── Main component ──────────────────────────────────────────────────

export function ModelStep() {
  const {
    modelProvider,
    setModelProvider,
    selectedModel,
    setSelectedModel,
    customModelId,
    setCustomModelId,
    apiKey,
  } = useWizardStore();

  // Dynamic metadata from OpenClaw
  const { data: metadata } = useOpenClawMetadata();
  const allProviders = useMemo(() => {
    if (!metadata) return MODEL_PROVIDERS;
    return metadata.providers.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      models: p.models.map((m) => m.id),
      aliases: Object.fromEntries(p.models.map((m) => [m.id, m.name])),
      authType: p.authType as "api-key" | "oauth" | "none" | "token",
      envVar: p.envVar,
      keyFormat: p.keyFormat,
      keyPlaceholder: p.keyPlaceholder,
      docsUrl: p.docsUrl,
      category: p.category as
        | "major"
        | "multi-provider"
        | "local"
        | "regional"
        | "other",
    }));
  }, [metadata]);

  // Extended categories including regional
  const effectiveCategories = useMemo(() => {
    if (!metadata) return PROVIDER_CATEGORIES;
    const cats: Record<string, string> = { ...PROVIDER_CATEGORIES };
    for (const p of metadata.providers) {
      if (!(p.category in cats)) {
        cats[p.category] =
          p.category.charAt(0).toUpperCase() + p.category.slice(1);
      }
    }
    return cats;
  }, [metadata]);

  const selectedProvider = allProviders.find((p) => p.id === modelProvider);

  // Fetch models dynamically from the selected provider
  const {
    data: fetchedModels,
    isLoading: modelsLoading,
    refetch: refetchModels,
    isError: modelsError,
  } = useProviderModels(modelProvider, apiKey, undefined);

  // Merge static models with fetched models
  const allModels = useMemo(() => {
    const staticModels = selectedProvider
      ? selectedProvider.models.map((id) => ({
          id,
          name: selectedProvider.aliases[id] ?? id.split("/").pop() ?? id,
          provider: modelProvider,
        }))
      : [];

    if (!fetchedModels || fetchedModels.length === 0) return staticModels;

    const fetchedIds = new Set(fetchedModels.map((m) => m.id));
    const uniqueStatic = staticModels.filter((m) => !fetchedIds.has(m.id));
    return [...fetchedModels, ...uniqueStatic];
  }, [fetchedModels, selectedProvider, modelProvider]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-semibold">Choose Your Model Provider</h2>
        <p className="text-sm text-muted-foreground">
          Select the AI provider and model. Models are fetched live from the
          provider's API when possible.
        </p>
      </div>

      {/* Provider selection — compact combobox */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Provider</label>
        <ProviderCombobox
          providers={allProviders}
          categories={effectiveCategories}
          value={modelProvider}
          onSelect={setModelProvider}
        />
      </div>

      {/* Model selection — compact combobox */}
      {selectedProvider && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Model</label>
            <span className="text-xs text-muted-foreground">
              {selectedProvider.name}
            </span>
          </div>
          <ModelCombobox
            models={allModels}
            value={selectedModel}
            customValue={customModelId}
            onSelect={setSelectedModel}
            onCustomChange={setCustomModelId}
            providerName={selectedProvider.name}
            isLoading={modelsLoading}
            isError={modelsError}
            onRefresh={() => refetchModels()}
          />
        </div>
      )}

      {/* Selected summary */}
      {selectedProvider && (customModelId || selectedModel) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {selectedProvider.name}
              </span>
              <span className="text-muted-foreground">/</span>
              <code className="text-sm text-foreground">
                {customModelId ||
                  selectedModel?.split("/").pop() ||
                  selectedModel}
              </code>
            </div>
            <AuthBadge authType={selectedProvider.authType} />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
