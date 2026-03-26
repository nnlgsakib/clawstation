import { useEffect, useState, useRef } from "react";
import { listen } from "@tauri-apps/api/event";

interface DockerLogEvent {
  output: string;
  timestamp: number;
}

/**
 * Hook for streaming Docker log output via Tauri events.
 *
 * Listens to "docker-log-output" events emitted by the Rust backend
 * during Docker installation. Appends timestamped log lines to state.
 *
 * Auto-scroll behavior:
 * - Auto-scrolls to latest output by default
 * - Pauses auto-scroll when user scrolls up past a threshold (200px)
 * - Resumes auto-scroll when user scrolls back to near the bottom
 */
export function useDockerLogs() {
  const [logs, setLogs] = useState<string>("");
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unlisten = listen<DockerLogEvent>("docker-log-output", (event) => {
      const time = new Date(event.payload.timestamp).toLocaleTimeString();
      setLogs(
        (prev) => prev + `[${time}] ${event.payload.output}\n`
      );
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Track scroll position to pause/resume auto-scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Auto-scroll is active when user is near the bottom (within 200px)
      setIsAutoScrolling(scrollHeight - scrollTop - clientHeight < 200);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll to bottom when enabled and new logs arrive
  useEffect(() => {
    if (isAutoScrolling && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, isAutoScrolling]);

  return { logs, containerRef };
}
