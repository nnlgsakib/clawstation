import { toast } from "sonner";
import { formatError } from "@/lib/errors";

/**
 * Displays an error as a sonner toast notification (ERR-01).
 * Shows plain-language message + expandable suggestion + 5s auto-dismiss.
 * Use this as the standard error display mechanism for Phase 1+.
 */
export function showError(error: unknown) {
  const appError = formatError(error);

  toast.error(appError.message, {
    description: appError.suggestion,
    duration: 5000,
  });
}
