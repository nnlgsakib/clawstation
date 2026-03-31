/**
 * Extract a human-readable error message from a Tauri invoke error.
 *
 * Tauri serializes Rust Err(Enum) as JSON objects like:
 *   { installationFailed: { reason: "...", suggestion: "..." } }
 *   { dockerNotInstalled: { suggestion: "..." } }
 *
 * String() on these produces "[object Object]" — this helper extracts the
 * actual message from the nested structure.
 */
export function extractTauriErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (!err || typeof err !== "object") return String(err);

  const obj = err as Record<string, unknown>;

  // Direct message field
  if (typeof obj.message === "string") return obj.message;

  // Tauri wraps errors as { variantName: { fields... } }
  for (const value of Object.values(obj)) {
    if (value && typeof value === "object") {
      const inner = value as Record<string, unknown>;
      // Prefer reason, then message, then suggestion
      if (typeof inner.reason === "string") return inner.reason;
      if (typeof inner.message === "string") return inner.message;
      if (typeof inner.suggestion === "string") return inner.suggestion;
    }
  }

  return JSON.stringify(err);
}
