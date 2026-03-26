import * as React from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { springPresets } from "@/lib/animation"

interface ProgressProps {
  value?: number
  max?: number
  className?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100 }, ref) => {
    const percent = Math.min(100, Math.max(0, (value / max) * 100))

    return (
      <motion.div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
      >
        <motion.div
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: `${percent}%` }}
          transition={springPresets.gentle}
        />
      </motion.div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
