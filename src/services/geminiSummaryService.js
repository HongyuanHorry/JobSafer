import { buildTimingSignalsForAi } from './walkthroughTimingService'
import {
  consumeGeminiRateLimit,
  devLog,
  isBillingCapMessage,
  sanitizeForUiDisplay,
} from '../utils/clientSecurity.js'

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || '').trim()
const GEMINI_CLIENT_ENABLED = import.meta.env.VITE_GEMINI_ENABLED !== 'false'

/** Single model only — flash-lite for cost; never fall back to full flash. */
const GEMINI_MODEL_ID = 'gemini-2.5-flash-lite'

const GEMINI_MODEL_ALIASES = {
  'gemini-1.5-flash': GEMINI_MODEL_ID,
  'gemini-1.5-flash-latest': GEMINI_MODEL_ID,
  'gemini-1.5-flash-001': GEMINI_MODEL_ID,
  'gemini-1.5-pro': GEMINI_MODEL_ID,
  'gemini-2.0-flash': GEMINI_MODEL_ID,
  'gemini-2.0-flash-001': GEMINI_MODEL_ID,
  'gemini-2.0-flash-exp': GEMINI_MODEL_ID,
  'gemini-2.5-flash': GEMINI_MODEL_ID,
  'gemini-2.5-flash-lite': GEMINI_MODEL_ID,
}

function resolveGeminiModel(raw) {
  const id = (raw || GEMINI_MODEL_ID).trim()
  return GEMINI_MODEL_ALIASES[id] || GEMINI_MODEL_ID
}

const GEMINI_MODEL = resolveGeminiModel(import.meta.env.VITE_GEMINI_MODEL)

const GEMINI_MAX_OUTPUT_TOKENS = 384
const GEMINI_TIMEOUT_MS = 12_000

const MAX_CHARS = {
  summary: 400,
  topRisk: 180,
  nextAction: 180,
  hesitationInsight: 180,
  tone: 40,
}

const MAX_SUMMARY_WORDS = 72
const MAX_HISTORY_ROWS = 5

const GEMINI_COACH_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: `English paragraph from learner taps + risk tags. Max ~${MAX_SUMMARY_WORDS} words.`,
    },
    topRisk: { type: 'string', description: 'One sentence: strongest pattern they hit.' },
    nextAction: {
      type: 'string',
      description: 'One sentence: verify/pause/report habit. No money transfers.',
    },
    hesitationInsight: {
      type: 'string',
      description: 'One sentence on dwell vs median per stage, or "" if none.',
    },
    tone: { type: 'string', description: '2–3 hyphenated English words.' },
  },
  required: ['summary', 'topRisk', 'nextAction', 'hesitationInsight', 'tone'],
}

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
]

function geminiModelsToTry() {
  return [GEMINI_MODEL]
}

function isGeminiModelUnavailableMessage(message) {
  if (!message || typeof message !== 'string') return false
  const m = message.toLowerCase()
  return (
    m.includes('not found for api version') ||
    m.includes('not supported for generatecontent') ||
    m.includes('no longer available') ||
    (m.includes('is not found') && m.includes('models/'))
  )
}

function classifyGeminiFailure(httpStatus, googleMessage) {
  const msg = String(googleMessage || '').trim()
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

function withTimeout(promise, timeoutMs) {
  let timerId = null
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timerId = setTimeout(() => {
        reject(new Error('Gemini request timed out.'))
      }, timeoutMs)
    }),
  ]).finally(() => {
    if (timerId) clearTimeout(timerId)
  })
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

  if (summary.length > MAX_CHARS.summary) summary = `${summary.slice(0, MAX_CHARS.summary - 1).trim()}…`
  if (topRisk.length > MAX_CHARS.topRisk) return null
  if (nextAction.length > MAX_CHARS.nextAction) return null
  if (hesitationInsight.length > MAX_CHARS.hesitationInsight) return null
  if (tone.length > MAX_CHARS.tone) tone = tone.slice(0, MAX_CHARS.tone).trim()

  if (wordCountRough(summary) > MAX_SUMMARY_WORDS) return null

  const pack = { summary, topRisk, nextAction, hesitationInsight, tone }
  if (!coachOutputPassesSafety(pack)) return null

  return pack
}

function extractJsonObject(text) {
  if (!text) return null
  const trimmed = text.trim()
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/iu, '')
    .replace(/\s*```$/u, '')
    .trim()

  const tryParse = (s) => {
    try {
      return JSON.parse(s)
    } catch {
      return null
    }
  }

  const direct = tryParse(unfenced)
  if (direct && typeof direct === 'object') return direct

  const start = unfenced.indexOf('{')
  const end = unfenced.lastIndexOf('}')
  if (start < 0 || end < 0 || end <= start) return null
  return tryParse(unfenced.slice(start, end + 1))
}

function mergeGenerationPayload(bodyTemplate, promptText) {
  return {
    ...bodyTemplate,
    contents: [{ role: 'user', parts: [{ text: promptText }] }],
  }
}

async function postGeminiCoach(modelId, body) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    modelId,
  )}:generateContent`

  const response = await withTimeout(
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
      referrerPolicy: 'no-referrer',
    }),
    GEMINI_TIMEOUT_MS,
  )

  const payload = await response.json().catch(() => ({}))
  const text =
    payload?.candidates?.[0]?.content?.parts
      ?.map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join(' ') || ''

  const finishReason = payload?.candidates?.[0]?.finishReason

  return { response, payload, text, finishReason }
}

export async function generateGeminiSummary(input) {
  if (!GEMINI_CLIENT_ENABLED) {
    return {
      ok: false,
      reason: 'gemini_disabled',
      detail: 'Gemini calls are disabled via VITE_GEMINI_ENABLED=false.',
    }
  }

  if (!GEMINI_API_KEY) {
    return {
      ok: false,
      reason: 'missing_api_key',
      detail: 'No Gemini API key configured.',
    }
  }

  if (!consumeGeminiRateLimit()) {
    return {
      ok: false,
      reason: 'rate_limited',
      detail: 'Too many coach requests in a short window.',
    }
  }

  const bodyTemplate = {
    contents: [],
    generationConfig: {
      temperature: 0.28,
      topP: 0.82,
      maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      responseMimeType: 'application/json',
      responseSchema: GEMINI_COACH_RESPONSE_SCHEMA,
    },
  }

  try {
    let lastFailDetail = ''
    const modelId = geminiModelsToTry()[0]
    const prompts = [buildCoachPrompt(input, false), buildCoachPrompt(input, true)]

    for (let p = 0; p < prompts.length; p += 1) {
      const { response, payload, text, finishReason } = await postGeminiCoach(
        modelId,
        mergeGenerationPayload(bodyTemplate, prompts[p]),
      )

      if (!response.ok) {
        const googleMsg =
          typeof payload?.error?.message === 'string' ? payload.error.message.trim() : ''
        const classified = classifyGeminiFailure(response.status, googleMsg)
        lastFailDetail = classified.detail
        if (classified.reason === 'billing_cap') {
          return classified
        }
        return classified
      }

      const gated = typeof text === 'string' ? text.trim() : ''
      const blockCombined = finishReason || payload?.promptFeedback?.blockReason
      if (!gated && blockCombined) {
        lastFailDetail = String(blockCombined)
        continue
      }

      const parsed = extractJsonObject(gated || text || '')
      const validated = normalizeCoachPayload(parsed)

      if (validated) {
        devLog('gemini coach ok', modelId)
        return { ok: true, data: validated, modelId }
      }

      lastFailDetail = [
        finishReason === 'MAX_TOKENS' ? 'truncated_hit_max_tokens' : 'invalid_or_unsafe',
        typeof text === 'string' ? text.slice(0, 120) : '',
      ].join(' ')
    }

    return {
      ok: false,
      reason: 'request_failed',
      detail: lastFailDetail || 'Gemini request failed.',
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err || '')
    return { ok: false, reason: 'timeout_or_network', detail: msg }
  }
}
