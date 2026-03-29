export interface ConfigFieldDefinition {
  key: string;
  label: string;
  description: string;
  type: "text" | "password" | "select" | "boolean" | "number" | "object" | "array" | "key-value";
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  defaultValue?: unknown;
  advanced: boolean;
  sensitive: boolean;
  children?: ConfigFieldDefinition[];
}

export interface ConfigSectionMeta {
  id: string;
  label: string;
  description: string;
  category: "core" | "agents" | "channels" | "tools" | "advanced" | "infrastructure";
  fields: ConfigFieldDefinition[];
  advanced: boolean;
}

// ─── Section Definitions ──────────────────────────────────────────

export function useConfigSchema(): ConfigSectionMeta[] {
  return CONFIG_SECTIONS;
}

const CONFIG_SECTIONS: ConfigSectionMeta[] = [
  // ─── Core ─────────────────────────────────────────────────────
  {
    id: "channels",
    label: "Channels",
    description: "Channel-specific defaults and configuration",
    category: "core",
    advanced: false,
    fields: [
      { key: "channels.defaults", label: "Channel Defaults", description: "Default settings applied to all channels", type: "object", required: false, advanced: true, sensitive: false },
    ],
  },

  // ─── Agents (existing section, kept as-is) ───────────────────
  // Skipped — handled by existing AgentsSection component

  // ─── Infrastructure ──────────────────────────────────────────
  {
    id: "gateway",
    label: "Gateway",
    description: "Gateway server configuration",
    category: "infrastructure",
    advanced: false,
    fields: [
      { key: "gateway.port", label: "Port", description: "Gateway listen port", type: "number", required: false, defaultValue: 18789, advanced: false, sensitive: false, placeholder: "18789" },
      { key: "gateway.mode", label: "Mode", description: "Gateway mode", type: "select", required: false, options: [{ label: "Local", value: "local" }, { label: "Remote", value: "remote" }], defaultValue: "local", advanced: false, sensitive: false },
      { key: "gateway.bind", label: "Bind", description: "Network binding", type: "select", required: false, options: [{ label: "Loopback", value: "loopback" }, { label: "All Interfaces", value: "all" }], defaultValue: "loopback", advanced: false, sensitive: false },
    ],
  },
  {
    id: "plugins",
    label: "Plugins",
    description: "Enable/disable OpenClaw plugins and extensions",
    category: "infrastructure",
    advanced: false,
    fields: [
      { key: "plugins.entries", label: "Plugin Entries", description: "Plugin enable/disable configuration (JSON)", type: "object", required: false, advanced: true, sensitive: false },
    ],
  },
  {
    id: "session",
    label: "Session",
    description: "Session and message history settings",
    category: "infrastructure",
    advanced: false,
    fields: [
      { key: "session.dmScope", label: "DM Scope", description: "How to scope direct message sessions", type: "select", required: false, options: [{ label: "Per Channel Peer", value: "per-channel-peer" }, { label: "Global", value: "global" }], defaultValue: "per-channel-peer", advanced: false, sensitive: false },
    ],
  },
  {
    id: "commands",
    label: "Commands",
    description: "Command execution settings",
    category: "infrastructure",
    advanced: false,
    fields: [
      { key: "commands.native", label: "Native Commands", description: "Native command execution policy", type: "select", required: false, options: [{ label: "Auto", value: "auto" }, { label: "Enabled", value: "enabled" }, { label: "Disabled", value: "disabled" }], defaultValue: "auto", advanced: false, sensitive: false },
      { key: "commands.restart", label: "Allow Restart", description: "Allow the agent to restart itself", type: "boolean", required: false, defaultValue: true, advanced: false, sensitive: false },
      { key: "commands.ownerDisplay", label: "Owner Display", description: "How to display the owner", type: "select", required: false, options: [{ label: "Raw", value: "raw" }, { label: "Masked", value: "masked" }], defaultValue: "raw", advanced: true, sensitive: false },
    ],
  },
  {
    id: "skills",
    label: "Skills",
    description: "Skill installation and management settings",
    category: "infrastructure",
    advanced: false,
    fields: [
      { key: "skills.install.nodeManager", label: "Node Manager", description: "Package manager for skill installation", type: "select", required: false, options: [{ label: "Bun", value: "bun" }, { label: "npm", value: "npm" }, { label: "yarn", value: "yarn" }, { label: "pnpm", value: "pnpm" }], defaultValue: "bun", advanced: false, sensitive: false },
    ],
  },
  {
    id: "logging",
    label: "Logging",
    description: "Logging level and output settings",
    category: "infrastructure",
    advanced: false,
    fields: [
      { key: "logging.level", label: "Log Level", description: "Minimum log level", type: "select", required: false, options: [{ label: "Debug", value: "debug" }, { label: "Info", value: "info" }, { label: "Warn", value: "warn" }, { label: "Error", value: "error" }], defaultValue: "info", advanced: false, sensitive: false },
      { key: "logging.maxFileBytes", label: "Max File Size (bytes)", description: "Maximum log file size in bytes", type: "number", required: false, defaultValue: 10485760, advanced: true, sensitive: false },
      { key: "logging.redact", label: "Redact Sensitive Data", description: "Redact API keys and tokens from logs", type: "boolean", required: false, defaultValue: true, advanced: true, sensitive: false },
    ],
  },

  // ─── Advanced (collapsed by default) ─────────────────────────
  {
    id: "hooks",
    label: "Hooks",
    description: "Internal hooks configuration",
    category: "advanced",
    advanced: true,
    fields: [
      { key: "hooks.internal.enabled", label: "Internal Hooks Enabled", description: "Enable internal hook system", type: "boolean", required: false, defaultValue: true, advanced: true, sensitive: false },
      { key: "hooks.internal.entries", label: "Hook Entries", description: "Hook configuration entries (JSON)", type: "object", required: false, advanced: true, sensitive: false },
    ],
  },
  {
    id: "cron",
    label: "Cron",
    description: "Scheduled task configuration",
    category: "advanced",
    advanced: true,
    fields: [
      { key: "cron.enabled", label: "Enabled", description: "Enable cron/scheduled tasks", type: "boolean", required: false, defaultValue: true, advanced: true, sensitive: false },
      { key: "cron.maxConcurrent", label: "Max Concurrent", description: "Maximum concurrent cron jobs", type: "number", required: false, defaultValue: 5, advanced: true, sensitive: false },
    ],
  },
  {
    id: "memory",
    label: "Memory",
    description: "Agent memory and context management",
    category: "advanced",
    advanced: true,
    fields: [
      { key: "memory.enabled", label: "Enabled", description: "Enable agent memory system", type: "boolean", required: false, defaultValue: true, advanced: true, sensitive: false },
      { key: "memory.maxEntries", label: "Max Entries", description: "Maximum memory entries per session", type: "number", required: false, defaultValue: 1000, advanced: true, sensitive: false },
    ],
  },
  {
    id: "mcp",
    label: "MCP Servers",
    description: "Model Context Protocol server configuration",
    category: "advanced",
    advanced: true,
    fields: [
      { key: "mcp", label: "MCP Configuration", description: "MCP server definitions (JSON)", type: "object", required: false, advanced: true, sensitive: false },
    ],
  },
  {
    id: "tts",
    label: "Text-to-Speech",
    description: "TTS provider and voice settings",
    category: "advanced",
    advanced: true,
    fields: [
      { key: "tts", label: "TTS Configuration", description: "TTS provider settings (JSON)", type: "object", required: false, advanced: true, sensitive: false },
    ],
  },
  {
    id: "routing",
    label: "Routing",
    description: "Agent routing rules and defaults",
    category: "advanced",
    advanced: true,
    fields: [
      { key: "routing.defaultAgent", label: "Default Agent", description: "Default agent for unclassified messages", type: "text", required: false, advanced: true, sensitive: false },
      { key: "routing.rules", label: "Routing Rules", description: "Message routing rules (JSON)", type: "object", required: false, advanced: true, sensitive: false },
    ],
  },
  {
    id: "secrets",
    label: "Secrets",
    description: "Secret storage provider configuration",
    category: "advanced",
    advanced: true,
    fields: [
      { key: "secrets", label: "Secrets Configuration", description: "Secret provider settings (JSON)", type: "object", required: false, advanced: true, sensitive: true },
    ],
  },
  {
    id: "auth",
    label: "Auth Profiles",
    description: "Authentication profile configuration",
    category: "advanced",
    advanced: true,
    fields: [
      { key: "auth.profiles", label: "Auth Profiles", description: "Authentication profiles (JSON)", type: "object", required: false, advanced: true, sensitive: true },
    ],
  },
  {
    id: "approvals",
    label: "Approvals",
    description: "Approval policy and timeout settings",
    category: "advanced",
    advanced: true,
    fields: [
      { key: "approvals.policy", label: "Policy", description: "Default approval policy", type: "select", required: false, options: [{ label: "Always Ask", value: "ask" }, { label: "Auto-approve Low Risk", value: "auto-low" }, { label: "Auto-approve All", value: "auto-all" }], defaultValue: "auto-low", advanced: true, sensitive: false },
      { key: "approvals.timeout", label: "Timeout (ms)", description: "Approval timeout in milliseconds", type: "number", required: false, defaultValue: 30000, advanced: true, sensitive: false },
    ],
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    description: "Diagnostic flags and debugging tools",
    category: "advanced",
    advanced: true,
    fields: [
      { key: "diagnostics.enabled", label: "Enabled", description: "Enable diagnostics mode", type: "boolean", required: false, defaultValue: false, advanced: true, sensitive: false },
      { key: "diagnostics.stuckSessionWarnMs", label: "Stuck Session Warning (ms)", description: "Warn if session is stuck for this many ms", type: "number", required: false, defaultValue: 120000, advanced: true, sensitive: false },
    ],
  },
  {
    id: "env",
    label: "Environment",
    description: "Shell environment and custom variables",
    category: "advanced",
    advanced: true,
    fields: [
      { key: "env.shellEnv", label: "Shell Environment", description: "Shell environment variables (JSON)", type: "object", required: false, advanced: true, sensitive: false },
      { key: "env.vars", label: "Custom Variables", description: "Custom environment variables (JSON)", type: "key-value", required: false, advanced: true, sensitive: false },
    ],
  },
  {
    id: "wizard",
    label: "Wizard State",
    description: "Onboarding wizard state tracking",
    category: "advanced",
    advanced: true,
    fields: [
      { key: "wizard.lastRunAt", label: "Last Run At", description: "ISO timestamp of last wizard run", type: "text", required: false, advanced: true, sensitive: false },
      { key: "wizard.lastRunVersion", label: "Last Run Version", description: "OpenClaw version at last wizard run", type: "text", required: false, advanced: true, sensitive: false },
    ],
  },
  {
    id: "meta",
    label: "Metadata",
    description: "Config file metadata",
    category: "advanced",
    advanced: true,
    fields: [
      { key: "meta.lastTouchedVersion", label: "Last Touched Version", description: "Version that last modified the config", type: "text", required: false, advanced: true, sensitive: false },
      { key: "meta.lastTouchedAt", label: "Last Touched At", description: "ISO timestamp of last modification", type: "text", required: false, advanced: true, sensitive: false },
    ],
  },
];
