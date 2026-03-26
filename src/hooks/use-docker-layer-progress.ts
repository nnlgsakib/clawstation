import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";

export interface DockerLayerProgress {
  id: string;
  description: string;
  percentage: number;
}

interface DockerLayerProgressPayload {
  layerId: string;
  description: string;
  percentage: number;
}

/**
 * Hook that listens to "docker-layer-progress" Tauri events and maintains
 * a state of individual Docker layer download progress.
 *
 * Updates existing layers by layerId or adds new ones. Returns layers
 * sorted by ID for consistent ordering.
 */
export function useDockerLayerProgress(): {
  layers: DockerLayerProgress[];
} {
  const [layers, setLayers] = useState<DockerLayerProgress[]>([]);

  useEffect(() => {
    const unlisten = listen<DockerLayerProgressPayload>(
      "docker-layer-progress",
      (event) => {
        const { layerId, description, percentage } = event.payload;
        setLayers((prev) => {
          const idx = prev.findIndex((l) => l.id === layerId);
          if (idx !== -1) {
            // Update existing layer
            const updated = [...prev];
            updated[idx] = { id: layerId, description, percentage };
            return updated;
          }
          // Add new layer
          return [...prev, { id: layerId, description, percentage }].sort(
            (a, b) => a.id.localeCompare(b.id)
          );
        });
      }
    );
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return { layers };
}
