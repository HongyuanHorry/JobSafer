import { buildTimingSignalsForAi } from './walkthroughTimingService'
import {
  consumeGeminiRateLimit,
  devLog,
  isBillingCapMessage,
  sanitizeForUiDisplay,
} from '../utils/clientSecurity.js'

const GEMINI_CLIENT_ENABLED = import.meta.env.VITE_GEMINI_ENABLED !== 'false'
const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
const GEMINI_COACH_ENDPOINT = `${API_BASE}/api/gemini/coach-summary`

const MAX_CHARS = {
  summary: 220,
  topRisk: 120,
  nextAction: 120,
  hesitationInsight: 180,
  tone: 40,
}

const MAX_SUMMARY_WORDS = 34
const MAX_HISTORY_ROWS = 4

const NON_LATIN_SCRIPTS =
  /[\u0370-\u03FF\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/u

const UNSAFE_PATTERNS = [
  NON_LATIN_SCRIPTS,
  /\b试一下\b|\b转账\b|\b小额\b|\b付款\b|\b充值\b|\b押金\b|\b保证金\b|\b試\b|\b匯\b/gi,
  /\b(send|transfer|pay|deposit|wire|cash out|cash-out)\b.*\b(test|trial|experiment)\b/i,
  /\b(test|trial)\b.*\b(send|transfer|pay|payment|deposit|wire|money|funds|\$|£|€|AUD|USD)\b/i,
  /\b(small(er)?|tiny|minimal|little|low)\s+(payment|deposit|fee|amount|transfer|sum|trial)\b/i,
  /\b(pay|send|transfer|deposit)\b.*\b(small(er)?|little|minimal|few dollars|few bucks)\b/i,
  /\bsee if (it'?s )?real\b|\bliquidity\b.*\byou\b|\bgood\s*faith\s*(payment|deposit)\b|\bunlock\b.*\$\d/i,
  /\bgift\s*card\b/i,
  /\b(venmo|zelle|cash\s*app|paypal\s*friends\s*family|wechat\s*pay|alipay)\b/i,
  /\b(otp|one[- ]?time\s*code|2fa|verification\s*code)\b.*\b(share|tell|provide|give|screenshot)\b/i,
  /[�鈥]/,
]

function classifyGeminiFailure(httpStatus, backendMessage) {
  const msg = String(backendMessage || '').trim()
  if (isBillingCapMessage(msg) || httpStatus === 429) {
    return {
      reason: 'billing_cap',
      detail: 'Monthly Google AI spend cap or quota reached.',
    }
  }
  if (httpStatus === 403) {
    return {
      reason: 'request_failed',
      detail: sanitizeForUiDisplay(msg || 'API key rejected or restricted.'),
    }
  }
  return {
    reason: 'request_failed',
    detail: sanitizeForUiDisplay(msg || `HTTP ${httpStatus}`),
  }
}

function clip(s, max) {
  const t = String(s || '').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function sanitizeHistory(history = []) {
  return history.slice(-MAX_HISTORY_ROWS).map((item) => ({
    stage: Number(item.stage || 0),
    choice: item.choice === 'risk' ? 'risk' : 'safe',
    riskTag: clip(item.riskTag, 48),
    riskReason: clip(item.riskReason, 72),
    safeAction: clip(item.safeAction, 72),
  }))
}

function buildCoachPrompt(input, repair) {
  const {
    scenarioType,
    scenarioMeta,
    feedbackHistory,
    riskCount,
    highPressure,
    interactionTiming,
  } = input

  const hesitationSignals = buildTimingSignalsForAi(interactionTiming)

  const compactPayload = {
    scenarioType,
    scenarioLabel: clip(scenarioMeta?.scenarioLabel, 40),
    riskCount: Number(riskCount || 0),
    highPressure: Boolean(highPressure),
    feedbackHistory: sanitizeHistory(feedbackHistory),
    hesitationSignals,
  }

  const rules =
    'English JSON only. No money/test transfers/OTP/gift-cards. Habits: pause, verify official channels, report.'

  if (repair) {
    return [
      'REPAIR invalid prior JSON.',
      rules,
      `Fields: summary≤${MAX_SUMMARY_WORDS}w from their taps; topRisk; nextAction; hesitationInsight (timing or ""); tone.`,
      JSON.stringify(compactPayload),
    ].join('\n')
  }

  return [
    'Job-scam coach JSON for this learner.',
    rules,
    `Lead from feedbackHistory taps/tags; use hesitationSignals dwell vs median if present.`,
    `summary≤${MAX_SUMMARY_WORDS}w; topRisk; nextAction; hesitationInsight; tone.`,
    JSON.stringify(compactPayload),
  ].join('\n')
}

function wordCountRough(s) {
  return String(s || '')
    .trim()
    .split(/\s+/u)
    .filter(Boolean).length
}

function coachOutputPassesSafety({
  summary = '',
  topRisk = '',
  nextAction = '',
  hesitationInsight = '',
  tone = '',
}) {
  const fused = `${summary}\n${topRisk}\n${nextAction}\n${hesitationInsight}\n${tone}`
  return !UNSAFE_PATTERNS.some((re) => re.test(fused))
}

function normalizeCoachPayload(raw) {
  if (!raw || typeof raw !== 'object') return null

  let summary = typeof raw.summary === 'string' ? raw.summary.trim() : ''
  const topRisk = typeof raw.topRisk === 'string' ? raw.topRisk.trim() : ''
  const nextAction = typeof raw.nextAction === 'string' ? raw.nextAction.trim() : ''
  let hesitationInsight =
    typeof raw.hesitationInsight === 'string' ? raw.hesitationInsight.trim() : ''
  let tone = typeof raw.tone === 'string' ? raw.tone.trim() : ''

  if (!summary || !topRisk || !nextAction || !tone) return null

  if (summary.length > MAX_CHARS.summary)
    summary = `${summary.slice(0, MAX_CHARS.summary - 1).trim()}…`
  if (topRisk.length > MAX_CHARS.topRisk) return null
  if (nextAction.length > MAX_CHARS.nextAction) return null
  if (hesitationInsight.length > MAX_CHARS.hesitationInsight) return null
  if (tone.length > MAX_CHARS.tone) tone = tone.slice(0, MAX_CHARS.tone).trim()

  if (wordCountRough(summary) > MAX_SUMMARY_WORDS) return null

  const pack = { summary, topRisk, nextAction, hesitationInsight, tone }
  if (!coachOutputPassesSafety(pack)) return null

  return pack
}

export async function generateGeminiSummary(input) {
  if (!GEMINI_CLIENT_ENABLED) {
    return {
      ok: false,
      reason: 'gemini_disabled',
      detail: 'Gemini calls are disabled via VITE_GEMINI_ENABLED=false.',
    }
  }

  if (!consumeGeminiRateLimit()) {
    return {
      ok: false,
      reason: 'rate_limited',
      detail: 'Too many coach requests in a short window.',
    }
  }

  const prompt = buildCoachPrompt(input, false)
  const repairPrompt = buildCoachPrompt(input, true)

  try {
    const response = await fetch(GEMINI_COACH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        repairPrompt,
        metadata: {
          scenarioType: String(input?.scenarioType || ''),
          highPressure: Boolean(input?.highPressure),
          riskCount: Number(input?.riskCount || 0),
        },
      }),
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      const detail =
        typeof payload?.detail === 'string'
          ? payload.detail
          : typeof payload?.message === 'string'
            ? payload.message
            : ''
      return classifyGeminiFailure(response.status, detail)
    }

    if (payload?.ok === true && payload?.data) {
      const validated = normalizeCoachPayload(payload.data)
      if (validated) {
        devLog('gemini coach ok (backend proxy)', payload?.modelId || 'unknown')
        return {
          ok: true,
          data: validated,
          modelId: payload?.modelId || 'backend-proxy',
        }
      }

      return {
        ok: false,
        reason: 'request_failed',
        detail: 'Gemini returned invalid or unsafe payload.',
      }
    }

    if (payload && payload.ok === false) {
      return {
        ok: false,
        reason: String(payload.reason || 'request_failed'),
        detail: sanitizeForUiDisplay(String(payload.detail || 'Gemini request failed.')),
      }
    }

    return {
      ok: false,
      reason: 'request_failed',
      detail: 'Gemini proxy returned unexpected payload.',
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err || '')
    return { ok: false, reason: 'timeout_or_network', detail: msg }
  }
}
