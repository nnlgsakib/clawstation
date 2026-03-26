import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { invoke } from "@tauri-apps/api/core"

// ─── Types ────────────────────────────────────────────────────────

export type ChannelStatus = "connected" | "disconnected" | "expired" | "connecting"

export type ChannelType = "whatsapp" | "telegram" | "discord" | "slack"

export interface ChannelInfo {
  id: string
  name: string
  channelType: ChannelType
  status: ChannelStatus
  lastActiveAt: string | null
}

// ─── Hooks ────────────────────────────────────────────────────────

/**
 * Fetches all available channels from OpenClaw.
 * Polls every 60s when all channels are healthy,
 * every 30s when any channel is expired or disconnected.
 */
export function useChannels() {
  return useQuery<ChannelInfo[]>({
    queryKey: ["channels"],
    queryFn: async () => {
      return await invoke<ChannelInfo[]>("get_channels")
    },
    refetchInterval: (query) => {
      const channels = query.state.data
      const hasExpired = channels?.some((c) => c.status === "expired")
      const hasDisconnected = channels?.some((c) => c.status === "disconnected")
      if (hasExpired || hasDisconnected) return 30_000
      return 60_000
    },
    retry: 1,
  })
}

/**
 * Disconnect a channel by ID.
 * Invalidates the channels query on success.
 */
export function useDisconnectChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (channelId: string) => {
      return await invoke<ChannelInfo>("disconnect_channel", { channelId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] })
    },
  })
}

/**
 * Initiate connection for a channel by ID.
 * Invalidates the channels query on success.
 */
export function useConnectChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (channelId: string) => {
      return await invoke<ChannelInfo>("connect_channel", { channelId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] })
    },
  })
}
