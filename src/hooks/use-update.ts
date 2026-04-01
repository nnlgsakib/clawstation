import { useQuery, useMutation } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";

// ─── Types ────────────────────────────────────────────────────────

/**
 * Result of checking whether an OpenClaw update is available.
 * Matches Rust OpenClawUpdateCheck struct (serde rename_all = "camelCase").
 */
export interface OpenClawUpdateCheck {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  installMethod: string;
}

/**
 * Result returned after an OpenClaw update completes.
 * Matches Rust UpdateResult struct (serde rename_all = "camelCase").
 */
export interface UpdateResult {
  success: boolean;
  newVersion: string | null;
  method: string;
}

// ─── Hooks ────────────────────────────────────────────────────────

/**
 * Check if a newer version of OpenClaw is available.
 * Stale time of 5 minutes — version checks are expensive (GitHub API + Docker inspect).
 * Does not refetch on window focus to avoid unnecessary API calls.
 */
export function useOpenClawUpdateCheck() {
  return useQuery<OpenClawUpdateCheck>({
    queryKey: ["openclaw-update-check"],
    queryFn: () => invoke("check_openclaw_update"),
    staleTime: 5 * 60 * 1000, // 5 min
    refetchOnWindowFocus: false,
  });
}

/**
 * Trigger an OpenClaw update.
 * Supports both Docker (pull + restart) and native (npm update) flows.
 * The caller should listen to "openclaw-update-progress" Tauri events for progress.
 */
export function useUpdateOpenClaw() {
  return useMutation<UpdateResult>({
    mutationFn: () => invoke("update_openclaw"),
  });
}
