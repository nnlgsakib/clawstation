use reqwest;
use serde::{Deserialize, Serialize};

use crate::error::AppError;
use crate::commands::monitoring::get_openclaw_status;
use crate::commands::monitoring::OpenClawStatus;

// ─── Types ────────────────────────────────────────────────────────

/// Channel connection status.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum ChannelStatus {
    Connected,
    Disconnected,
    Expired,
    Connecting,
}

/// Supported channel types.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum ChannelType {
    WhatsApp,
    Telegram,
    Discord,
    Slack,
}

/// Information about a messaging channel.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChannelInfo {
    pub id: String,
    pub name: String,
    pub channel_type: ChannelType,
    pub status: ChannelStatus,
    pub last_active_at: Option<String>,
}

// ─── Commands ─────────────────────────────────────────────────────

/// Fetch all available channels from OpenClaw.
///
/// Returns a list of channels with their connection status.
/// Returns empty Vec if OpenClaw is not running or the API is unavailable.
#[tauri::command]
pub async fn get_channels() -> Result<Vec<ChannelInfo>, AppError> {
    let status = get_openclaw_status().await?;

    let port = match status {
        OpenClawStatus::Running { port, .. } => port,
        _ => return Ok(vec![]),
    };

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| AppError::Internal {
            message: format!("Failed to build HTTP client: {}", e),
            suggestion: "This is an internal error. Please report it.".into(),
        })?;

    let url = format!("http://localhost:{}/api/channels", port);

    match client.get(&url).send().await {
        Ok(resp) => match resp.json::<Vec<ChannelInfo>>().await {
            Ok(channels) => Ok(channels),
            Err(_) => Ok(get_default_channels()),
        },
        Err(_) => Ok(get_default_channels()),
    }
}

/// Disconnect a channel by ID.
///
/// Calls the OpenClaw API to disconnect the specified channel.
/// Returns the updated channel info on success.
#[tauri::command]
pub async fn disconnect_channel(channel_id: String) -> Result<ChannelInfo, AppError> {
    let status = get_openclaw_status().await?;

    let port = match status {
        OpenClawStatus::Running { port, .. } => port,
        _ => return Err(AppError::Internal {
            message: "OpenClaw is not running".into(),
            suggestion: "Start OpenClaw before managing channels.".into(),
        }),
    };

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| AppError::Internal {
            message: format!("Failed to build HTTP client: {}", e),
            suggestion: "This is an internal error. Please report it.".into(),
        })?;

    let url = format!("http://localhost:{}/api/channels/{}/disconnect", port, channel_id);

    match client.post(&url).send().await {
        Ok(resp) => match resp.json::<ChannelInfo>().await {
            Ok(channel) => Ok(channel),
            Err(_) => Ok(ChannelInfo {
                id: channel_id.clone(),
                name: channel_id,
                channel_type: ChannelType::WhatsApp,
                status: ChannelStatus::Disconnected,
                last_active_at: None,
            }),
        },
        Err(e) => Err(AppError::Internal {
            message: format!("Failed to disconnect channel: {}", e),
            suggestion: "Check that OpenClaw is running and try again.".into(),
        }),
    }
}

/// Initiate connection for a channel by ID.
///
/// Calls the OpenClaw API to start the channel pairing process.
/// Returns the updated channel info with 'connecting' status.
#[tauri::command]
pub async fn connect_channel(channel_id: String) -> Result<ChannelInfo, AppError> {
    let status = get_openclaw_status().await?;

    let port = match status {
        OpenClawStatus::Running { port, .. } => port,
        _ => return Err(AppError::Internal {
            message: "OpenClaw is not running".into(),
            suggestion: "Start OpenClaw before managing channels.".into(),
        }),
    };

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| AppError::Internal {
            message: format!("Failed to build HTTP client: {}", e),
            suggestion: "This is an internal error. Please report it.".into(),
        })?;

    let url = format!("http://localhost:{}/api/channels/{}/connect", port, channel_id);

    match client.post(&url).send().await {
        Ok(resp) => match resp.json::<ChannelInfo>().await {
            Ok(channel) => Ok(channel),
            Err(_) => Ok(ChannelInfo {
                id: channel_id.clone(),
                name: channel_id,
                channel_type: ChannelType::WhatsApp,
                status: ChannelStatus::Connecting,
                last_active_at: None,
            }),
        },
        Err(e) => Err(AppError::Internal {
            message: format!("Failed to connect channel: {}", e),
            suggestion: "Check that OpenClaw is running and try again.".into(),
        }),
    }
}

// ─── Private helpers ──────────────────────────────────────────────

/// Return default channel list when OpenClaw API is unavailable.
/// Shows all supported channel types as disconnected.
fn get_default_channels() -> Vec<ChannelInfo> {
    vec![
        ChannelInfo {
            id: "whatsapp".into(),
            name: "WhatsApp".into(),
            channel_type: ChannelType::WhatsApp,
            status: ChannelStatus::Disconnected,
            last_active_at: None,
        },
        ChannelInfo {
            id: "telegram".into(),
            name: "Telegram".into(),
            channel_type: ChannelType::Telegram,
            status: ChannelStatus::Disconnected,
            last_active_at: None,
        },
        ChannelInfo {
            id: "discord".into(),
            name: "Discord".into(),
            channel_type: ChannelType::Discord,
            status: ChannelStatus::Disconnected,
            last_active_at: None,
        },
        ChannelInfo {
            id: "slack".into(),
            name: "Slack".into(),
            channel_type: ChannelType::Slack,
            status: ChannelStatus::Disconnected,
            last_active_at: None,
        },
    ]
}
