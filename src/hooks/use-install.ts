import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

export type InstallMethod = "docker" | "native";

export interface InstallProgress {
  step: string;
  percent: number;
  message: string;
}

export interface InstallResult {
  method: InstallMethod;
  version: string | null;
  gatewayUrl: string;
  gatewayToken: string | null;
}

interface InstallRequest {
  method: InstallMethod;
  workspacePath?: string;
  installDir?: string;
}

/**
 * Hook for managing OpenClaw installation.
 *
 * Listens for "install-progress" events from the Rust backend and exposes
 * the install mutation via TanStack Query. The mutation invokes the
 * `install_openclaw` Tauri command with the selected method.
 */
export function useInstallOpenClaw() {
  const [progress, setProgress] = useState<InstallProgress | null>(null);

  useEffect(() => {
    const unlisten = listen<InstallProgress>("install-progress", (event) => {
      setProgress(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const mutation = useMutation<InstallResult, Error, InstallRequest>({
    mutationFn: async (request) => {
      return await invoke<InstallResult>("install_openclaw", { request });
    },
  });

  return {
    ...mutation,
    progress,
  };
}

/**
 * Clean (remove) the installation directory for a fresh install.
 */
export async function cleanInstallDir(path: string): Promise<void> {
  await invoke("clean_install_dir", { path });
}

/**
 * Cancel the currently running installation.
 */
export async function cancelInstall(installDir?: string): Promise<void> {
  await invoke("cancel_install", { installDir });
}
