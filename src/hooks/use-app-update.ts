import { useState, useCallback } from "react";
import {
  check,
  type Update,
  type DownloadEvent,
} from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { toast } from "sonner";

interface AppUpdateState {
  update: Update | null;
  checking: boolean;
  downloading: boolean;
  progress: number;
}

export function useAppUpdate() {
  const [state, setState] = useState<AppUpdateState>({
    update: null,
    checking: false,
    downloading: false,
    progress: 0,
  });

  const checkForUpdates = useCallback(async () => {
    setState((s) => ({ ...s, checking: true }));
    try {
      const update = await check();
      if (update) {
        setState((s) => ({ ...s, update, checking: false }));
        toast.info(`Update available: v${update.version}`);
      } else {
        setState((s) => ({ ...s, update: null, checking: false }));
        toast.success("You're on the latest version");
      }
    } catch (err) {
      setState((s) => ({ ...s, checking: false }));
      toast.error(`Update check failed: ${err}`);
    }
  }, []);

  const installUpdate = useCallback(async () => {
    if (!state.update) return;
    setState((s) => ({ ...s, downloading: true, progress: 0 }));
    try {
      let totalBytes = 0;
      await state.update.downloadAndInstall((event: DownloadEvent) => {
        if (event.event === "Started") {
          totalBytes = event.data.contentLength ?? 0;
        } else if (event.event === "Progress" && totalBytes > 0) {
          const pct = Math.round((event.data.chunkLength / totalBytes) * 100);
          setState((s) => ({ ...s, progress: pct }));
        }
      });
      toast.success("Update installed! Relaunching...");
      await relaunch();
    } catch (err) {
      setState((s) => ({ ...s, downloading: false }));
      toast.error(`Update failed: ${err}`);
    }
  }, [state.update]);

  return { ...state, checkForUpdates, installUpdate };
}

/**
 * Standalone one-shot update check (for startup checks).
 * Returns the Update object if available, null otherwise.
 */
export async function checkForAppUpdates(): Promise<Update | null> {
  try {
    return await check();
  } catch {
    return null;
  }
}
