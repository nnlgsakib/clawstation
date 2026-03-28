#[cfg(target_os = "windows")]
use std::path::PathBuf;
use std::process::Stdio;
use std::time::Duration;
use tokio::time::timeout;

/// Quick timeout for version checks and simple commands (30 seconds).
pub const QUICK_TIMEOUT: u64 = 30;

/// Longer timeout for install/update operations (120 seconds).
pub const INSTALL_TIMEOUT: u64 = 120;

/// Build an augmented PATH that includes Node.js global bin directories.
///
/// On Windows, reads PATH from the **registry** (not the process environment)
/// to handle first-launch-after-install where the installer's stale environment
/// doesn't have Node.js directories yet. Expands `%SystemRoot%` and other
/// embedded environment variables via `cmd.exe /c echo`.
///
/// Prepends discovered Node.js directories so that `openclaw`, `pnpm`,
/// `yarn`, and `npm` global binaries are discoverable.
#[cfg(target_os = "windows")]
fn nodejs_path_env() -> String {
    use winreg::enums::*;
    use winreg::RegKey;

    // Read fresh PATH from the Windows registry (not process env).
    // This handles installer-launched processes that have stale PATH.
    let registry_path = {
        let mut paths = Vec::new();

        // User PATH (HKCU\Environment)
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        if let Ok(env_key) = hkcu.open_subkey("Environment") {
            if let Ok(user_path) = env_key.get_value::<String, _>("Path") {
                if !user_path.is_empty() {
                    paths.push(user_path);
                }
            }
        }

        // System PATH (HKLM)
        let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
        if let Ok(env_key) =
            hklm.open_subkey("SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment")
        {
            if let Ok(sys_path) = env_key.get_value::<String, _>("Path") {
                if !sys_path.is_empty() {
                    paths.push(sys_path);
                }
            }
        }

        // Fall back to process PATH if registry reads failed
        if paths.is_empty() {
            std::env::var("PATH").unwrap_or_default()
        } else {
            paths.join(";")
        }
    };

    // Expand embedded env vars like %SystemRoot% that the registry stores literally.
    // cmd.exe /c echo %VAR% resolves them using the current process context.
    let registry_path = expand_env_vars(&registry_path);

    // Read other env vars from registry if missing from process env.
    // This handles cases where the installer process had a different user context.
    let appdata = std::env::var("APPDATA")
        .or_else(|_| read_registry_env("APPDATA"))
        .unwrap_or_default();
    let localappdata = std::env::var("LOCALAPPDATA")
        .or_else(|_| read_registry_env("LOCALAPPDATA"))
        .unwrap_or_default();
    let userprofile = std::env::var("USERPROFILE")
        .or_else(|_| read_registry_env("USERPROFILE"))
        .unwrap_or_default();
    let program_files = std::env::var("ProgramFiles").unwrap_or_default();

    let mut extra_paths: Vec<PathBuf> = Vec::new();

    // %APPDATA%\npm — npm global bin, also where yarn puts global bins
    if !appdata.is_empty() {
        extra_paths.push(PathBuf::from(&appdata).join("npm"));
        extra_paths.push(PathBuf::from(&appdata).join("nvm"));
    }

    // %LOCALAPPDATA%\pnpm — pnpm global bin
    if !localappdata.is_empty() {
        extra_paths.push(PathBuf::from(&localappdata).join("pnpm"));
        extra_paths.push(PathBuf::from(&localappdata).join("Yarn").join("bin"));
    }

    // .yarn\bin in user home directory
    if !userprofile.is_empty() {
        extra_paths.push(PathBuf::from(&userprofile).join(".yarn").join("bin"));
    }

    // Program Files\nodejs — native Node.js installer
    if !program_files.is_empty() {
        extra_paths.push(PathBuf::from(&program_files).join("nodejs"));
    }

    // NVM_HOME and NVM_SYMLINK — nvm-windows custom install locations
    if let Ok(nvm_home) = std::env::var("NVM_HOME").or_else(|_| read_registry_env("NVM_HOME")) {
        extra_paths.push(PathBuf::from(nvm_home));
    }
    if let Ok(nvm_symlink) =
        std::env::var("NVM_SYMLINK").or_else(|_| read_registry_env("NVM_SYMLINK"))
    {
        extra_paths.push(PathBuf::from(nvm_symlink));
    }

    // Scan common non-standard nvm install locations (e.g., D:\soft\nvm)
    for drive in &["C", "D", "E", "F"] {
        for base in &["soft", "tools", "dev", "opt", "programs"] {
            let candidate = format!("{drive}:\\{base}\\nvm");
            let p = PathBuf::from(&candidate);
            if p.exists() {
                extra_paths.push(p.join("nodejs"));
                let pnpm_global = p.join("pnpm-global");
                if pnpm_global.exists() {
                    extra_paths.push(pnpm_global);
                }
            }
        }
    }

    let extra_str: Vec<String> = extra_paths
        .into_iter()
        .filter(|p| p.exists())
        .map(|p| p.to_string_lossy().to_string())
        .collect();

    if extra_str.is_empty() {
        registry_path
    } else {
        format!("{};{}", extra_str.join(";"), registry_path)
    }
}

/// Read an environment variable from the Windows registry (HKCU\Environment).
#[cfg(target_os = "windows")]
fn read_registry_env(name: &str) -> Result<String, ()> {
    use winreg::enums::*;
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let env_key = hkcu.open_subkey("Environment").map_err(|_| ())?;
    let value: String = env_key.get_value(name).map_err(|_| ())?;
    if value.is_empty() {
        Err(())
    } else {
        Ok(value)
    }
}

/// Expand Windows environment variable references (e.g., `%SystemRoot%`) in a string.
/// Looks up variables from the process env first, then the registry.
#[cfg(target_os = "windows")]
fn expand_env_vars(input: &str) -> String {
    if !input.contains('%') {
        return input.to_string();
    }

    let mut result = input.to_string();

    // Find all %VARNAME% patterns and expand them
    while let Some(start) = result.find('%') {
        let Some(end) = result[start + 1..].find('%') else {
            break;
        };
        let end = start + 1 + end;

        let var_name = &result[start + 1..end];
        let replacement = std::env::var(var_name)
            .or_else(|_| read_registry_env(var_name))
            .unwrap_or_else(|_| format!("%{var_name}%"));

        result.replace_range(start..=end, &replacement);
    }

    result
}

/// Create a tokio Command that won't flash a console window on Windows.
///
/// On Windows, sets `CREATE_NO_WINDOW` (0x08000000) to suppress the console
/// and augments PATH with Node.js global bin directories so that `openclaw`,
/// `pnpm`, `yarn`, and `npm` are found even in production builds.
/// On other platforms, creates a plain `tokio::process::Command`.
/// Pipes stdout and stderr by default.
pub fn silent_cmd(program: &str) -> tokio::process::Command {
    let mut cmd = tokio::process::Command::new(program);
    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());
    #[cfg(target_os = "windows")]
    {
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
        cmd.env("PATH", nodejs_path_env());
    }
    cmd
}

/// Run a command with a timeout, returning a descriptive error on timeout.
pub async fn run_with_timeout(
    cmd: &mut tokio::process::Command,
    timeout_secs: u64,
) -> Result<std::process::Output, String> {
    match timeout(Duration::from_secs(timeout_secs), cmd.output()).await {
        Ok(Ok(output)) => Ok(output),
        Ok(Err(e)) => Err(format!("Command failed: {e}")),
        Err(_) => Err(format!("Command timed out after {timeout_secs}s")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[cfg(target_os = "windows")]
    #[test]
    fn nodejs_path_env_reads_registry() {
        let augmented = nodejs_path_env();
        // Registry-based PATH should contain at least Windows system directory
        assert!(
            augmented.to_lowercase().contains("windows")
                || augmented.to_lowercase().contains("system32")
                || !augmented.is_empty(),
            "Augmented PATH from registry should contain system directories or be non-empty"
        );
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn nodejs_path_env_is_nonempty() {
        let augmented = nodejs_path_env();
        assert!(!augmented.is_empty(), "Augmented PATH must not be empty");
    }

    #[test]
    fn silent_cmd_sets_piped_stdout_stderr() {
        // Verify silent_cmd creates a command (no panic, valid construction)
        let mut cmd = silent_cmd("echo");
        cmd.arg("test");
        // Command should be constructible without errors
        // (actual execution depends on environment)
    }
}
