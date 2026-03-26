import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";

export interface DockerLayerProgress {
  id: string;
  description: string;
  percentage: number;
  layerPercentage: number;
}

interface DockerLayerProgressPayload {
  layerId: string;
  description: string;
  percentage: number;
  layerPercentage: number;
}

function friendlyStatus(status: string): string {
  switch (status) {
    case "Downloading":
      return "Downloading";
    case "Verifying Checksum":
      return "Verifying";
    case "Download complete":
      return "Downloaded";
    case "Extracting":
      return "Extracting";
    case "Pull complete":
      return "Done";
    case "Already exists":
      return "Cached";
    default:
      return status;
  }
}

/**
 * Hook that listens to "docker-layer-progress" Tauri events and maintains
 * a state of individual Docker layer download progress.
 *
 * Updates existing layers by layerId or adds new ones. Layers that reach
 * 100% are marked complete. Returns layers sorted by status (active first).
 */
export function useDockerLayerProgress(): {
  layers: DockerLayerProgress[];
} {
  const [layers, setLayers] = useState<DockerLayerProgress[]>([]);

  useEffect(() => {
    const unlisten = listen<DockerLayerProgressPayload>(
      "docker-layer-progress",
      (event) => {
        const { layerId, description, percentage, layerPercentage } =
          event.payload;
        setLayers((prev) => {
          const idx = prev.findIndex((l) => l.id === layerId);
          const entry: DockerLayerProgress = {
            id: layerId,
            description: friendlyStatus(description),
            percentage,
            layerPercentage,
          };
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = entry;
            return updated;
          }
          return [...prev, entry];
        });
      }
    );
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return { layers };
}
