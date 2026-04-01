import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  ConfigFieldMeta,
  ChannelMetadata,
} from "@/hooks/use-openclaw-metadata";

interface ChannelConfigFormProps {
  channel: ChannelMetadata;
  initialValues?: Record<string, string>;
  onSave: (config: Record<string, string>) => void;
  isPending?: boolean;
  showDmPolicy?: boolean;
}

export function ChannelConfigForm({
  channel,
  initialValues = {},
  onSave,
  isPending = false,
  showDmPolicy = true,
}: ChannelConfigFormProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>(
    {},
  );
  const [dmPolicy, setDmPolicy] = useState(initialValues.dmPolicy ?? "pairing");

  const handleSave = () => {
    const config: Record<string, string> = { ...values, enabled: "true" };
    if (showDmPolicy) {
      config.dmPolicy = dmPolicy;
      if (dmPolicy === "open") {
        config.allowFrom = "*";
      }
    }
    onSave(config);
  };

  return (
    <div className="space-y-3 border-t border-border pt-3">
      {channel.configFields.map((field) => (
        <ConfigFieldRenderer
          key={field.key}
          field={field}
          value={values[field.key] ?? ""}
          showSensitive={showSensitive[field.key] ?? false}
          onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
          onToggleSensitive={() =>
            setShowSensitive((prev) => ({
              ...prev,
              [field.key]: !prev[field.key],
            }))
          }
        />
      ))}

      {showDmPolicy && (
        <div className="space-y-1">
          <label className="text-sm font-medium">DM Policy</label>
          <select
            value={dmPolicy}
            onChange={(e) => setDmPolicy(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="pairing">
              Pairing — unknown senders get a one-time code
            </option>
            <option value="allowlist">
              Allowlist — only approved contacts
            </option>
            <option value="open">Open — allow all DMs</option>
            <option value="disabled">Disabled — ignore all DMs</option>
          </select>
        </div>
      )}

      <Button size="sm" onClick={handleSave} disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
        Save Configuration
      </Button>
    </div>
  );
}

function ConfigFieldRenderer({
  field,
  value,
  showSensitive,
  onChange,
  onToggleSensitive,
}: {
  field: ConfigFieldMeta;
  value: string;
  showSensitive: boolean;
  onChange: (v: string) => void;
  onToggleSensitive: () => void;
}) {
  if (field.fieldType === "select" && field.enumValues) {
    return (
      <div className="space-y-1">
        <label className="text-sm font-medium">
          {field.label}
          {field.required && <span className="ml-1 text-destructive">*</span>}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select...</option>
          {field.enumValues.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        {field.help && (
          <p className="text-xs text-muted-foreground">{field.help}</p>
        )}
      </div>
    );
  }

  if (field.fieldType === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value === "true"}
          onChange={(e) => onChange(e.target.checked ? "true" : "false")}
          className="h-4 w-4 rounded border-input"
        />
        <label className="text-sm font-medium">{field.label}</label>
      </div>
    );
  }

  // Default: text or password
  const isSecret = field.sensitive || field.fieldType === "password";
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">
        {field.label}
        {field.required && <span className="ml-1 text-destructive">*</span>}
      </label>
      <div className="relative">
        <input
          type={isSecret && !showSensitive ? "password" : "text"}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {isSecret && (
          <button
            type="button"
            onClick={onToggleSensitive}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showSensitive ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {field.help && (
        <p className="text-xs text-muted-foreground">{field.help}</p>
      )}
    </div>
  );
}
