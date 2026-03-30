import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1",
    "text-xs font-medium",
    "transition-colors duration-150",
    "border",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "border-primary/20 bg-primary/10 text-primary",
        ].join(" "),
        secondary: [
          "border-secondary/50 bg-secondary/50 text-secondary-foreground",
        ].join(" "),
        destructive: [
          "border-destructive/20 bg-destructive/10 text-destructive",
        ].join(" "),
        outline: [
          "border-border bg-transparent text-muted-foreground",
        ].join(" "),
        success: [
          "border-success/20 bg-success/10 text-success",
        ].join(" "),
        warning: [
          "border-warning/20 bg-warning/10 text-warning",
        ].join(" "),
        info: [
          "border-info/20 bg-info/10 text-info",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants };
