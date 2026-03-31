/**
 * Provider error detection and guidance for ClawStation.
 * Detects gateway responses indicating model provider issues (502, NATS no-responders, etc.)
 * and returns actionable guidance for the user.
 */

/** Keywords from Rust backend classification that indicate provider errors. */
const PROVIDER_ERROR_PREFIX = "PROVIDER_ERROR:";

/** Patterns in raw error strings that indicate a provider issue (fallback detection). */
const PROVIDER_PATTERNS = [
  "no responders",
  "nats",
  "provider_error",
  "provider returned http 502",
  "provider returned http 503",
];

/**
 * Checks whether an error is a provider-related error.
 * Matches both the structured `PROVIDER_ERROR:` prefix from the Rust backend
 * and raw pattern fallbacks for older/unstructured error messages.
 */
export function isProviderError(error: unknown): boolean {
  if (typeof error === "string") {
    if (error.startsWith(PROVIDER_ERROR_PREFIX)) return true;
    const lower = error.toLowerCase();
    return PROVIDER_PATTERNS.some((p) => lower.includes(p));
  }

  if (error instanceof Error) {
    return isProviderError(error.message);
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return isProviderError((error as { message: unknown }).message);
  }

  return false;
}

/**
 * Returns actionable guidance for resolving a provider error.
 */
export function getProviderGuidance(): { title: string; steps: string[] } {
  return {
    title: "Model Provider Unavailable",
    steps: [
      "Check your API keys in OpenClaw config",
      "Verify the selected model provider is correct",
      "Ensure the provider service is running and reachable",
      "Try restarting the Gateway",
    ],
  };
}

/**
 * Extracts the human-readable error message from a provider error.
 * Strips the `PROVIDER_ERROR:` prefix if present.
 * Returns null if the input is not a provider error.
 */
export function extractProviderErrorMessage(error: unknown): string | null {
  if (!isProviderError(error)) return null;

  const raw =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : String(error);

  if (raw.startsWith(PROVIDER_ERROR_PREFIX)) {
    return raw.slice(PROVIDER_ERROR_PREFIX.length).trim();
  }

  return raw;
}
