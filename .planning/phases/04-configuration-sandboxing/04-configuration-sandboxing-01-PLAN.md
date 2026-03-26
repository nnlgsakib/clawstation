---
phase: 04-configuration-sandboxing
plan: "01"
type: execute
wave: 1
depends_on: []
files_modified:
  - src-tauri/src/commands/config.rs
  - src-tauri/src/commands/mod.rs
  - src-tauri/src/lib.rs
autonomous: true
requirements:
  - CONF-01
  - CONF-02
  - CONF-05
  - CONF-06

must_haves:
  truths:
    - "User can select their AI provider and model from a visual dropdown"
    - "User can toggle sandboxing on/off and choose between Docker, SSH, or OpenShell backends"
    - "Config editor validates all changes before writing and shows the user if something is invalid"
    - "User can select directories for sandbox bind mounts using a file picker"
  artifacts:
    - path: "src-tauri/src/commands/config.rs"
      provides: "Config types, read/write/validate Tauri commands"
      exports: ["read_config", "write_config", "validate_config"]
    - path: "src-tauri/src/commands/mod.rs"
      provides: "Config module declaration"
      contains: "pub mod config"
  key_links:
    - from: "src-tauri/src/commands/config.rs"
      to: "src/lib/errors.ts"
      via: "AppError::ConfigError variant"
      pattern: "ConfigError"
    - from: "frontend (config store)"
      to: "read_config / write_config commands"
      via: "Tauri invoke"
      pattern: "invoke.*config"
---

<objective>
Create config backend — Rust types, read/write/validate commands, and sandbox setup scaffold

Purpose: Establish the data model and persistence layer for OpenClaw configuration. All frontend config UI depends on these Tauri commands.
Output: `src-tauri/src/commands/config.rs` with OpenClawConfig types and 3 Tauri commands
</objective>

<execution_context>
@/home/nlg/projects/openclaw-installer/.opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@src-tauri/src/commands/install.rs
@src-tauri/src/error.rs
@src-tauri/src/lib.rs
@src-tauri/src/commands/mod.rs
@src-tauri/Cargo.toml

Existing patterns:
- Commands use `#[tauri::command]` with `Result<T, AppError>` return type
- Serde structs use `#[serde(rename_all = "camelCase")]`
- `AppError` already has `ConfigError` variant
- `dirs` crate available for home directory resolution
- Config lives at `~/.openclaw/config.yaml` (standard OpenClaw path)
- Gateway token read from `~/.openclaw/.env` in verify_installation.rs
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create OpenClawConfig types and read_config command</name>
  <files>src-tauri/src/commands/config.rs</files>
  <read_first>
    src-tauri/src/commands/install.rs (serde pattern reference)
    src-tauri/src/error.rs (AppError variants)
    src-tauri/src/commands/mod.rs (module structure)
  </read_first>
  <action>
    Create `src-tauri/src/commands/config.rs` with:

    1. OpenClawConfig struct with serde, all fields optional (config may be partial):
    ```rust
    #[derive(Debug, Clone, Serialize, Deserialize, Default)]
    #[serde(rename_all = "camelCase")]
    pub struct OpenClawConfig {
        pub provider: Option<ProviderConfig>,
        pub sandbox: Option<SandboxConfig>,
        pub tools: Option<ToolsConfig>,
        pub agents: Option<AgentsConfig>,
    }
    ```

    2. ProviderConfig struct:
    ```rust
    #[derive(Debug, Clone, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct ProviderConfig {
        pub provider: String,       // "anthropic", "openai", "google", etc.
        pub model: String,          // model identifier
        pub api_key_env: Option<String>,  // env var name, NOT the key itself
    }
    ```

    3. SandboxConfig struct:
    ```rust
    #[derive(Debug, Clone, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct SandboxConfig {
        pub enabled: bool,
        pub backend: String,        // "docker", "ssh", "openshell"
        pub scope: String,          // "off", "non-main", "all"
        pub workspace_access: String,  // "none", "read-only", "read-write"
        pub network_policy: String, // "none", "custom"
        pub bind_mounts: Vec<BindMount>,
    }

    #[derive(Debug, Clone, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct BindMount {
        pub host_path: String,
        pub access: String,         // "read-only", "read-write"
    }
    ```

    4. ToolsConfig struct:
    ```rust
    #[derive(Debug, Clone, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct ToolsConfig {
        pub shell: bool,
        pub filesystem: bool,
        pub browser: bool,
        pub api: bool,
    }
    ```

    5. AgentsConfig struct:
    ```rust
    #[derive(Debug, Clone, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct AgentsConfig {
        pub sandbox_mode: String,   // "docker", "ssh", "none"
        pub autonomy: String,       // "high", "medium", "low"
    }
    ```

    6. read_config Tauri command:
    ```rust
    #[tauri::command]
    pub async fn read_config() -> Result<OpenClawConfig, AppError> {
        let config_path = dirs::home_dir()
            .ok_or_else(|| AppError::ConfigError {
                message: "Cannot determine home directory".into(),
                suggestion: "Check that HOME environment variable is set.".into(),
            })?
            .join(".openclaw")
            .join("config.yaml");

        if !config_path.exists() {
            return Ok(OpenClawConfig::default());
        }

        let content = tokio::fs::read_to_string(&config_path).await
            .map_err(|e| AppError::ConfigError {
                message: format!("Cannot read config: {}", e),
                suggestion: "Check file permissions on ~/.openclaw/config.yaml".into(),
            })?;

        serde_yaml::from_str(&content)
            .map_err(|e| AppError::ConfigError {
                message: format!("Invalid YAML: {}", e),
                suggestion: "The config file has syntax errors. Fix the YAML or delete it to start fresh.".into(),
            })
    }
    ```

    NOTE: OpenClaw uses YAML config. You will need to add `serde_yaml = "0.9"` to Cargo.toml dependencies. If the YAML crate is problematic, fall back to JSON.

    7. Register the command: Add `pub mod config;` to `commands/mod.rs` and `commands::config::read_config` to `invoke_handler` in `lib.rs`.

    8. Add `serde_yaml = "0.9"` to `src-tauri/Cargo.toml` [dependencies].
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <done>
    - `src-tauri/src/commands/config.rs` exists with OpenClawConfig, ProviderConfig, SandboxConfig, ToolsConfig, AgentsConfig structs
    - read_config command exists and returns Result<OpenClawConfig, AppError>
    - config module declared in commands/mod.rs
    - read_config registered in lib.rs invoke_handler
    - serde_yaml added to Cargo.toml
    - TypeScript compiles cleanly
  </done>
</task>

<task type="auto">
  <name>Task 2: Create write_config and validate_config commands</name>
  <files>src-tauri/src/commands/config.rs</files>
  <read_first>
    src-tauri/src/commands/config.rs (from Task 1)
    src-tauri/src/error.rs (AppError::ConfigError)
  </read_first>
  <action>
    Add to `src-tauri/src/commands/config.rs`:

    1. ConfigValidationResult struct:
    ```rust
    #[derive(Debug, Clone, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct ConfigValidationResult {
        pub valid: bool,
        pub errors: Vec<ValidationError>,
    }

    #[derive(Debug, Clone, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct ValidationError {
        pub field: String,
        pub message: String,
    }
    ```

    2. write_config Tauri command (atomic write — write to temp, rename):
    ```rust
    #[tauri::command]
    pub async fn write_config(config: OpenClawConfig) -> Result<(), AppError> {
        let config_dir = dirs::home_dir()
            .ok_or_else(|| AppError::ConfigError {
                message: "Cannot determine home directory".into(),
                suggestion: "Check HOME env var.".into(),
            })?
            .join(".openclaw");

        tokio::fs::create_dir_all(&config_dir).await
            .map_err(|e| AppError::ConfigError {
                message: format!("Cannot create config directory: {}", e),
                suggestion: "Check permissions on your home directory.".into(),
            })?;

        let config_path = config_dir.join("config.yaml");
        let tmp_path = config_dir.join("config.yaml.tmp");

        let yaml = serde_yaml::to_string(&config)
            .map_err(|e| AppError::ConfigError {
                message: format!("Cannot serialize config: {}", e),
                suggestion: "Config contains invalid values. Try resetting to defaults.".into(),
            })?;

        tokio::fs::write(&tmp_path, yaml).await
            .map_err(|e| AppError::ConfigError {
                message: format!("Cannot write temp config: {}", e),
                suggestion: "Check disk space and file permissions.".into(),
            })?;

        tokio::fs::rename(&tmp_path, &config_path).await
            .map_err(|e| AppError::ConfigError {
                message: format!("Cannot finalize config: {}", e),
                suggestion: "The config write failed. Check file permissions.".into(),
            })
    }
    ```

    3. validate_config Tauri command:
    ```rust
    #[tauri::command]
    pub async fn validate_config(config: OpenClawConfig) -> Result<ConfigValidationResult, AppError> {
        let mut errors = Vec::new();

        // Validate provider
        if let Some(ref provider) = config.provider {
            let valid_providers = ["anthropic", "openai", "google", "ollama", "azure"];
            if !valid_providers.contains(&provider.provider.as_str()) {
                errors.push(ValidationError {
                    field: "provider.provider".into(),
                    message: format!("Unknown provider '{}'. Valid: {}", provider.provider, valid_providers.join(", ")),
                });
            }
            if provider.model.trim().is_empty() {
                errors.push(ValidationError {
                    field: "provider.model".into(),
                    message: "Model name cannot be empty.".into(),
                });
            }
        }

        // Validate sandbox
        if let Some(ref sandbox) = config.sandbox {
            let valid_backends = ["docker", "ssh", "openshell"];
            if !valid_backends.contains(&sandbox.backend.as_str()) {
                errors.push(ValidationError {
                    field: "sandbox.backend".into(),
                    message: format!("Unknown backend '{}'. Valid: {}", sandbox.backend, valid_backends.join(", ")),
                });
            }
            let valid_scopes = ["off", "non-main", "all"];
            if !valid_scopes.contains(&sandbox.scope.as_str()) {
                errors.push(ValidationError {
                    field: "sandbox.scope".into(),
                    message: format!("Invalid scope '{}'. Valid: {}", sandbox.scope, valid_scopes.join(", ")),
                });
            }
            let valid_access = ["none", "read-only", "read-write"];
            if !valid_access.contains(&sandbox.workspace_access.as_str()) {
                errors.push(ValidationError {
                    field: "sandbox.workspaceAccess".into(),
                    message: format!("Invalid access level '{}'. Valid: {}", sandbox.workspace_access, valid_access.join(", ")),
                });
            }
            // Validate bind mount paths exist
            for (i, mount) in sandbox.bind_mounts.iter().enumerate() {
                if !std::path::Path::new(&mount.host_path).exists() {
                    errors.push(ValidationError {
                        field: format!("sandbox.bindMounts[{}].hostPath", i),
                        message: format!("Directory '{}' does not exist.", mount.host_path),
                    });
                }
            }
        }

        // Validate agents
        if let Some(ref agents) = config.agents {
            let valid_autonomy = ["high", "medium", "low"];
            if !valid_autonomy.contains(&agents.autonomy.as_str()) {
                errors.push(ValidationError {
                    field: "agents.autonomy".into(),
                    message: format!("Invalid autonomy '{}'. Valid: {}", agents.autonomy, valid_autonomy.join(", ")),
                });
            }
        }

        Ok(ConfigValidationResult {
            valid: errors.is_empty(),
            errors,
        })
    }
    ```

    4. Register both commands in `lib.rs` invoke_handler.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <done>
    - write_config command exists with atomic temp+rename write
    - validate_config command validates provider, sandbox, and agents fields
    - ConfigValidationResult and ValidationError structs defined
    - Both commands registered in lib.rs invoke_handler
    - TypeScript compiles cleanly
  </done>
</task>

</tasks>

<verification>
- All config structs use `#[serde(rename_all = "camelCase")]`
- read_config returns default config when file missing (not error)
- write_config creates ~/.openclaw/ directory if missing
- write_config uses atomic write (temp file + rename)
- validate_config returns structured errors per field
- All commands registered in lib.rs invoke_handler
</verification>

<success_criteria>
- `src-tauri/src/commands/config.rs` contains OpenClawConfig and all sub-structs
- read_config, write_config, validate_config commands exist
- serde_yaml in Cargo.toml
- Module registered in commands/mod.rs
- Commands registered in lib.rs invoke_handler
</success_criteria>

<output>
After completion, create `.planning/phases/04-configuration-sandboxing/04-configuration-sandboxing-01-SUMMARY.md`
</output>
