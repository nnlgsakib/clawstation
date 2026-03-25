import { useState } from "react"
import { AlertCircle, ChevronDown, ChevronUp, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { formatError, type AppError } from "@/lib/errors"

interface ErrorBannerProps {
  error: unknown
  onDismiss?: () => void
}

/**
 * Inline error banner component (ERR-01).
 * Renders error with expandable suggestion text.
 */
export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  const [expanded, setExpanded] = useState(false)
  const appError: AppError = formatError(error)

  return (
    <Alert variant="destructive" className="relative">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{appError.message}</AlertTitle>
      <AlertDescription>
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 flex items-center gap-1 text-sm text-red-700 hover:text-red-800"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Hide details
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Show details
            </>
          )}
        </button>
        {expanded && (
          <p className="mt-2 text-sm text-red-700">{appError.suggestion}</p>
        )}
      </AlertDescription>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6 text-red-700 hover:text-red-800"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  )
}
