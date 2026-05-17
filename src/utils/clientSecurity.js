/** Frontend-only hardening helpers (not a substitute for server-side auth). */

const SENSITIVE_PATTERNS = [
  /\bAIza[0-9A-Za-z_-]{20,}\b/g,
  /\b(sk-[A-Za-z0-9]{20,})\b/g,
  /key=[^&\s]+/gi,
  /x-goog-api-key:\s*\S+/gi,
]

const BILLING_CAP_PATTERN =
  /spend cap|spending cap|exceeded its monthly|billing|quota exceeded|resource_exhausted|rate limit/i

export function isDevBuild() {
  return Boolean(import.meta.env.DEV)
}

/** Logs only in local dev — never in production bundles for end users. */
export function devLog(...args) {
  if (isDevBuild()) {
    console.warn('[StepSafe dev]', ...args)
  }
}

export function sanitizeForUiDisplay(raw, maxLen = 320) {
  let text = String(raw ?? '').trim()
  if (!text) return ''

  for (const pattern of SENSITIVE_PATTERNS) {
    text = text.replace(pattern, '[redacted]')
  }

  if (text.length > maxLen) {
    return `${text.slice(0, maxLen)}…`
  }
  return text
}

export function isBillingCapMessage(message) {
  return BILLING_CAP_PATTERN.test(String(message || ''))
}

/**
 * Maps Gemini / coach API failures to user-safe copy (no raw Google errors in production).
 */
export function formatCoachApiError(reason = '', detail = '') {
  const r = String(reason || '').trim()
  const d = String(detail || '').trim()

  if (r === 'billing_cap' || isBillingCapMessage(d)) {
    return 'Live AI coach is paused because the Google AI project reached its monthly spend cap. The guided takeaway below still uses your simulation choices. To restore live coaching, raise the cap in Google AI Studio (Billing → Spend) or wait until the next billing cycle.'
  }

  if (r === 'missing_api_key' || r === 'gemini_disabled') {
    return 'Live AI coach is not configured. The guided takeaway below is generated on your device from your choices.'
  }

  if (r === 'rate_limited') {
    return 'Please wait a few seconds before starting another AI coach request.'
  }

  if (r === 'request_failed' && isBillingCapMessage(d)) {
    return formatCoachApiError('billing_cap', d)
  }

  if (import.meta.env.PROD) {
    return 'Live AI coach is temporarily unavailable. The guided takeaway below is still personalised from your run.'
  }

  const safeDetail = sanitizeForUiDisplay(d)
  return safeDetail ? `[${r}] ${safeDetail}` : `[${r || 'error'}]`
}

export function safeParseJsonStorage(raw, maxChars = 200_000) {
  if (typeof raw !== 'string' || !raw.trim()) return null
  if (raw.length > maxChars) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

let lastGeminiCallAt = 0

export function consumeGeminiRateLimit(minIntervalMs = 4000) {
  const now = Date.now()
  if (now - lastGeminiCallAt < minIntervalMs) {
    return false
  }
  lastGeminiCallAt = now
  return true
}
