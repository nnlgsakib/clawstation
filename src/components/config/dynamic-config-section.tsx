import { useState } from "react";
import { Eye, EyeOff, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConfigSectionMeta, ConfigFieldDefinition } from "@/hooks/use-config-schema";

interface DynamicConfigSectionProps {
  section: ConfigSectionMeta;
  config: Record<string, unknown>;
  onUpdate: (path: string, value: unknown) => void;
}

export function DynamicConfigSection({ section, config, onUpdate }: DynamicConfigSectionProps) {
  const [collapsed, setCollapsed] = useState(section.advanced);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Only show non-advanced fields by default
  const visibleFields = showAdvanced
    ? section.fields
    : section.fields.filter(f => !f.advanced);

  if (visibleFields.length === 0 && section.fields.length > 0) {
    // All fields are advanced, show a toggle
    return (
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowAdvanced(!showAdvanced)}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{section.label}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </div>
            <button className="text-xs text-muted-foreground hover:text-foreground">
              {showAdvanced ? "Hide advanced" : "Show advanced fields"}
            </button>
          </div>
        </CardHeader>
        {showAdvanced && (
          <CardContent className="space-y-4">
            {section.fields.map(field => (
              <ConfigFieldRenderer
                key={field.key}
                field={field}
                value={getNestedValue(config, field.key)}
                onChange={(v) => onUpdate(field.key, v)}
              />
            ))}
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="text-base">{section.label}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent className="space-y-4">
          {visibleFields.map(field => (
            <ConfigFieldRenderer
              key={field.key}
              field={field}
              value={getNestedValue(config, field.key)}
              onChange={(v) => onUpdate(field.key, v)}
            />
          ))}
          {!showAdvanced && section.fields.some(f => f.advanced) && (
            <button
              onClick={() => setShowAdvanced(true)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Show {section.fields.filter(f => f.advanced).length} advanced fields
            </button>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Field Renderers ──────────────────────────────────────────────

function ConfigFieldRenderer({ field, value, onChange }: {
  field: ConfigFieldDefinition;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const [showSensitive, setShowSensitive] = useState(false);

  if (field.type === "select" && field.options) {
    return (
      <div className="space-y-1">
        <label className="text-sm font-medium">
          {field.label}
          {field.required && <span className="ml-1 text-destructive">*</span>}
        </label>
        <select
          value={(value as string) ?? (field.defaultValue as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Select...</option>
          {field.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
      </div>
    );
  }

  if (field.type === "boolean") {
    const checked = (value as boolean) ?? (field.defaultValue as boolean) ?? false;
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        <label className="text-sm font-medium">{field.label}</label>
        {field.description && <span className="text-xs text-muted-foreground ml-2">— {field.description}</span>}
      </div>
    );
  }

  if (field.type === "number") {
    const numValue = (value as number) ?? (field.defaultValue as number) ?? "";
    return (
      <div className="space-y-1">
        <label className="text-sm font-medium">
          {field.label}
          {field.required && <span className="ml-1 text-destructive">*</span>}
        </label>
        <input
          type="number"
          value={numValue as string | number}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          placeholder={field.placeholder}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
      </div>
    );
  }

  if (field.type === "object") {
    const jsonValue = typeof value === "object" ? JSON.stringify(value, null, 2) : (value as string) ?? "";
    return (
      <div className="space-y-1">
        <label className="text-sm font-medium">
          {field.label}
          {field.required && <span className="ml-1 text-destructive">*</span>}
        </label>
        <textarea
          value={jsonValue}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              // Allow partial JSON while typing
            }
          }}
          rows={4}
          placeholder={field.placeholder ?? "{}"}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
      </div>
    );
  }

  // Default: text or password
  const isSecret = field.sensitive || field.type === "password";
  const strValue = (value as string) ?? (field.defaultValue as string) ?? "";

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">
        {field.label}
        {field.required && <span className="ml-1 text-destructive">*</span>}
      </label>
      <div className="relative">
        <input
          type={isSecret && !showSensitive ? "password" : "text"}
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {isSecret && (
          <button
            type="button"
            onClick={() => setShowSensitive(!showSensitive)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
