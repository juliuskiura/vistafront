/**
 * Parses the drf_standardized_errors format and returns a
 * human-readable error message string.
 *
 * Handles:
 *   Standardized: { "type": "...", "errors": [{ "code": "...", "detail": "...", "attr": "..." }] }
 *   Plain DRF:    { "field": ["error1", "error2"] }
 *   String:       "some error"
 *   FetchError:   { status: 'FETCH_ERROR', message: '...' }
 */
const CSRF_MESSAGE = 'CSRF Security Error. Please reload the page and try again.'

function isCsrfFailure(error: unknown): boolean {
  const haystack = JSON.stringify(error).toLowerCase()
  return haystack.includes('csrf')
}

export function parseApiError(error: unknown): string {
  if (!error) return 'An unexpected error occurred'

  if (isCsrfFailure(error)) return CSRF_MESSAGE

  const payload = error as any
  const data = payload.data ?? payload

  // drf_standardized_errors format
  if (data && typeof data === 'object' && Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors
      .map((e: any) => {
        const detail = e.detail || e.message || ''
        const attr = e.attr ? `${e.attr}: ` : ''
        return attr + detail
      })
      .filter(Boolean)
      .join('\n')
  }

  // Plain DRF field-errors format: { "field": ["msg1", "msg2"] }
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const messages: string[] = []
    for (const [key, val] of Object.entries(data)) {
      if (Array.isArray(val) && val.length > 0) {
        messages.push(`${key}: ${val.join(', ')}`)
      } else if (typeof val === 'string' && val) {
        messages.push(val)
      }
    }
    if (messages.length > 0) return messages.join('\n')
  }

  // Plain string body — but reject HTML error pages (nginx 502, etc.)
  if (typeof data === 'string' && data) {
    const trimmed = data.trimStart()
    if (trimmed.startsWith('<!') || trimmed.startsWith('<html')) {
      return 'The server is unreachable. Please try again in a moment.'
    }
    return data
  }

  // Network / FETCH_ERROR
  if (payload.message) return payload.message

  // Fallback for HTTP status codes
  if (payload.status && typeof payload.status === 'number') {
    const statusTexts: Record<number, string> = {
      400: 'Bad request',
      403: 'Access denied',
      404: 'Resource not found',
      405: 'Method not allowed',
      409: 'Conflict',
      429: 'Too many requests',
      500: 'Internal server error',
      502: 'Bad gateway',
      503: 'Service unavailable',
    }
    return statusTexts[payload.status] || `Request failed (${payload.status})`
  }

  return 'An unexpected error occurred'
}

/**
 * Returns a safe, non-leaky message for end users, derived only from the HTTP
 * status.
 */
export function userSafeMessage(status?: number | string): string {
  switch (status) {
    case 400:
    case 409:
    case 422:
      return 'We couldn’t complete that request. Please check your input and try again.';
    case 403:
      return 'You don’t have permission to do that.';
    case 404:
      return 'The item you were looking for was not found.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
      return 'Something went wrong on our end. Please try again later.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
