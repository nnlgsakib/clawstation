import { useDockerLogs } from "@/hooks/use-docker-logs";
import { motion } from "motion/react";

/**
 * Terminal-style Docker log display component.
 *
 * Renders real-time Docker log output in a dark terminal panel with
 * monospace font, auto-scroll, and Framer Motion entrance/exit animations.
 */
export function DockerLogViewer() {
  const { logs, containerRef } = useDockerLogs();

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-full w-full overflow-auto rounded-lg bg-black p-4 font-mono text-green-100"
    >
      <pre className="whitespace-pre-wrap">{logs}</pre>
    </motion.div>
  );
}
