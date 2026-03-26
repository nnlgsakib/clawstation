import { motion, AnimatePresence } from "motion/react";
import { useDockerLayerProgress } from "@/hooks/use-docker-layer-progress";
import { Progress } from "@/components/ui/progress";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
    },
  },
};

interface LayerProgressProps {
  className?: string;
}

export function LayerProgress({ className }: LayerProgressProps) {
  const { layers } = useDockerLayerProgress();

  if (layers.length === 0 || layers.every((l) => l.percentage >= 100)) {
    return null;
  }

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {layers.map((layer) => (
          <motion.div
            key={layer.id}
            variants={itemVariants}
            layout
            className="mb-2 flex items-center gap-3"
          >
            <span
              className="w-24 shrink-0 truncate text-xs font-mono text-muted-foreground"
              title={layer.description}
            >
              {layer.description.length > 14
                ? `${layer.description.slice(0, 14)}…`
                : layer.description}
            </span>
            <Progress value={layer.percentage} max={100} className="flex-1" />
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {layer.percentage}%
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
