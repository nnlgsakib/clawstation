import { useMutation } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";

interface UninstallRequest {
  preserveConfig: boolean;
}

interface UninstallResult {
  success: boolean;
  removedContainers: string[];
  removedConfig: boolean;
  error: string | null;
}

export function useUninstallOpenClaw() {
  return useMutation<UninstallResult, Error, UninstallRequest>({
    mutationFn: (request) => invoke("uninstall_openclaw", { request }),
  });
}
