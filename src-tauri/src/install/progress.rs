use serde::Serialize;

/// Progress event emitted during installation.
///
/// Each step reports the current phase, a percentage (0-100), and a
/// human-readable message for the frontend progress bar.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallProgress {
    pub step: String,
    pub percent: u8,
    pub message: String,
}

/// Emit an install-progress event to the frontend.
///
/// The frontend listens for these events via `@tauri-apps/api/event`
/// to update the progress bar and status messages in real time.
pub fn emit_progress(handle: &tauri::AppHandle, step: &str, percent: u8, message: &str) {
    handle
        .emit(
            "install-progress",
            InstallProgress {
                step: step.to_string(),
                percent,
                message: message.to_string(),
            },
        )
        .ok();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn install_progress_struct_fields() {
        let progress = InstallProgress {
            step: "pulling_image".to_string(),
            percent: 45,
            message: "Downloading OpenClaw image...".to_string(),
        };
        assert_eq!(progress.step, "pulling_image");
        assert_eq!(progress.percent, 45);
        assert_eq!(progress.message, "Downloading OpenClaw image...");
    }

    #[test]
    fn install_progress_serializes_camelcase() {
        let progress = InstallProgress {
            step: "creating_dirs".to_string(),
            percent: 15,
            message: "Creating configuration directories...".to_string(),
        };
        let json = serde_json::to_string(&progress).unwrap();
        assert!(json.contains("\"step\""));
        assert!(json.contains("\"percent\""));
        assert!(json.contains("\"message\""));
    }
}
