import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          [
            "flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2",
            "text-sm text-foreground",
            "placeholder:text-muted-foreground",
            "transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
            "focus:border-ring",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          ].join(" "),
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
