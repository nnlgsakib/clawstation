import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  [
    "relative w-full rounded-xl border p-4",
    "[&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
    "transition-all duration-200",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "border-border bg-card text-foreground",
          "[&>svg]:text-foreground",
        ].join(" "),
        destructive: [
          "border-destructive/30 bg-destructive/5 text-foreground",
          "[&>svg]:text-destructive",
        ].join(" "),
        success: [
          "border-success/30 bg-success/5 text-foreground",
          "[&>svg]:text-success",
        ].join(" "),
        warning: [
          "border-warning/30 bg-warning/5 text-foreground",
          "[&>svg]:text-warning",
        ].join(" "),
        info: [
          "border-info/30 bg-info/5 text-foreground",
          "[&>svg]:text-info",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn(
      "mb-1 font-medium leading-none tracking-tight text-foreground",
      className,
    )}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-sm text-muted-foreground [&_p]:leading-relaxed",
      className,
    )}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
