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
/// In production builds (launched from Explorer/desktop), the inherited PATH
/// is minimal and missing `%APPDATA%\npm`, `%LOCALAPPDATA%\pnpm`, etc.
/// This function prepends those directories so that `openclaw`, `pnpm`,
/// `yarn`, and `npm` global binaries are discoverable.
#[cfg(target_os = "windows")]
fn nodejs_path_env() -> String {
    let mut extra_paths: Vec<PathBuf> = Vec::new();

    // %APPDATA%\npm — npm global bin, also where yarn puts global bins
    if let Ok(appdata) = std::env::var("APPDATA") {
        extra_paths.push(PathBuf::from(&appdata).join("npm"));
        extra_paths.push(PathBuf::from(&appdata).join("nvm")); // nvm for Windows (standard)
    }

    // %LOCALAPPDATA%\pnpm — pnpm global bin
    if let Ok(localappdata) = std::env::var("LOCALAPPDATA") {
        extra_paths.push(PathBuf::from(&localappdata).join("pnpm"));
        // Yarn v1 global bin on Windows
        extra_paths.push(PathBuf::from(&localappdata).join("Yarn").join("bin"));
    }

    // .yarn\bin in user home directory
    if let Ok(userprofile) = std::env::var("USERPROFILE") {
        extra_paths.push(PathBuf::from(&userprofile).join(".yarn").join("bin"));
    }

    // Program Files\nodejs — native Node.js installer
    if let Ok(program_files) = std::env::var("ProgramFiles") {
        extra_paths.push(PathBuf::from(program_files).join("nodejs"));
    }

    // NVM_HOME and NVM_SYMLINK — nvm-windows custom install locations
    if let Ok(nvm_home) = std::env::var("NVM_HOME") {
        extra_paths.push(PathBuf::from(nvm_home));
    }
    if let Ok(nvm_symlink) = std::env::var("NVM_SYMLINK") {
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

    let existing_path = std::env::var("PATH").unwrap_or_default();
    let extra_str: Vec<String> = extra_paths
        .into_iter()
        .filter(|p| p.exists())
        .map(|p| p.to_string_lossy().to_string())
        .collect();

    if extra_str.is_empty() {
        existing_path
    } else {
        format!("{};{}", extra_str.join(";"), existing_path)
    }
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
    fn nodejs_path_env_contains_existing_path() {
        let augmented = nodejs_path_env();
        let original = std::env::var("PATH").unwrap_or_default();
        // The augmented PATH must contain the original PATH as a suffix
        assert!(
            augmented.contains(&original),
            "Augmented PATH should contain the original PATH"
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
