/** Local-only timing + events — not HTTP cookies (nothing auto-posts unless you wire it yourself). */

export const WALKTHROUGH_TIMING_STORAGE_KEY = 'stepsafe_walkthrough_sessions_v1'
/** High-frequency clicks (per-choice); capped so quota stays tame. */
export const WALKTHROUGH_EVENTS_STORAGE_KEY = 'stepsafe_walkthrough_events_v1'
const MAX_SESSIONS_STORED = 60
const MAX_EVENTS_STORED = 420


export function persistWalkthroughSession(entry) {
  try {
    const raw = window.localStorage.getItem(WALKTHROUGH_TIMING_STORAGE_KEY)
    const list = raw ? JSON.parse(raw) : []
    if (!Array.isArray(list)) return
    list.push({
      ...entry,
      storedAt: Date.now(),
      version: 1,
    })
    window.localStorage.setItem(
      WALKTHROUGH_TIMING_STORAGE_KEY,
      JSON.stringify(list.slice(-MAX_SESSIONS_STORED)),
    )
  } catch {
    // ignore quota / privacy mode
  }
}

/**
 * Compact, non-identifying summary for Gemini (seconds per stage only).
 */
export function buildTimingSignalsForAi(stageTimings) {
  if (!Array.isArray(stageTimings) || !stageTimings.length) return null

  const rows = stageTimings
    .map((row) => ({
      stage: Number(row.stage || 0),
      dwellSeconds: Math.max(0, Math.round(Number(row.dwellMs || 0) / 1000)),
      choice: row.choice === 'risk' ? 'risk' : 'safe',
    }))
    .filter((row) => row.stage > 0)
    .sort((a, b) => a.stage - b.stage)

  if (!rows.length) return null

  const byDwell = [...rows].sort((a, b) => b.dwellSeconds - a.dwellSeconds)
  const slowTop = byDwell.slice(0, 2).map((r) => r.stage)

  return {
    perStage: rows,
    slowestStageNumbers: slowTop,
    medianDwellSeconds: median(rows.map((r) => r.dwellSeconds)),
  }
}

function median(nums) {
  if (!nums.length) return 0
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2)
}

/** Per-choice breadcrumb (dwell until tap). Not sent to servers by default. */
export function appendWalkthroughEvent(payload) {
  try {
    const raw = window.localStorage.getItem(WALKTHROUGH_EVENTS_STORAGE_KEY)
    const list = raw ? JSON.parse(raw) : []
    if (!Array.isArray(list)) return
    list.push({ ts: Date.now(), ...payload })
    window.localStorage.setItem(
      WALKTHROUGH_EVENTS_STORAGE_KEY,
      JSON.stringify(list.slice(-MAX_EVENTS_STORED)),
    )
  } catch {
    // ignore quota / privacy mode
  }
}
