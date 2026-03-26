import { useDockerLogs } from "@/hooks/use-docker-logs";
import { motion } from "motion/react";

/**
 * Terminal-style Docker log display component.
 *
 * Renders filtered Docker log output (meaningful events only — no
 * repetitive "Downloading" ticks) in a dark terminal panel with
 * monospace font and auto-scroll.
 */
export function DockerLogViewer() {
  const { logs, containerRef, lineCount } = useDockerLogs();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative h-full w-full overflow-hidden rounded-lg bg-black"
    >
      {/* Header with count */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-black/90 px-4 py-2 backdrop-blur">
        <span className="text-xs font-medium text-zinc-400">
          Installation Log
        </span>
        <span className="text-xs text-zinc-500">{lineCount} events</span>
      </div>

      {/* Log content */}
      <div
        ref={containerRef}
        className="h-[calc(100%-2.5rem)] overflow-auto p-4 font-mono text-sm text-green-100"
      >
        <pre className="whitespace-pre-wrap">{logs}</pre>
      </div>
    </motion.div>
  );
}
