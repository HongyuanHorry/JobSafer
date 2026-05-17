<template>
  <section class="sim" :class="{ 'sim--fullscreen': isFullscreen }" aria-live="polite" ref="simRef">
    <Transition name="fs-overlay">
      <div v-if="isTransitioning" class="fs-transition-overlay" aria-hidden="true">
        <span class="fs-transition-dot"></span>
        <span class="fs-transition-dot"></span>
        <span class="fs-transition-dot"></span>
      </div>
    </Transition>
    <div v-if="isFullscreen" class="fullscreen-bar">
      <span class="fullscreen-bar__label">🔒 Fullscreen mode — press Esc to exit</span>
      <button class="fullscreen-bar__exit" type="button" @click="exitFullscreen">✕ Exit</button>
    </div>
    <div class="sim-wrapper">
      <Transition name="sim-shell-fade" mode="out-in">
        <article
          :key="`stage-${stage}`"
          class="sim-card"
          :class="{
            'sim-card--split-thirds': stage === 0,
            'sim-card--intro': stage === 0,
            'sim-card--walkthrough': stage >= 1 && stage <= 5,
            'sim-card--finale': stage > 5,
          }"
        >
          <template v-if="stage === 0">
            <div class="sim-visual intro-visual">
              <div class="scene-image-wrap">
                <img class="sim-image" src="/icons/image1.png" alt="Alex base character" />
              </div>
            </div>

            <div class="sim-copy sim-copy--intro">
              <p class="sim-meta">
                {{ scenario.title }}
                <span class="sim-meta__sep"> · </span>
                <span v-if="stage === 0">Introduction</span>
                <span v-else>Stage {{ stageLabel }} of 5</span>
              </p>
              <div
                class="progress-line"
                role="progressbar"
                :aria-valuenow="progressAriaNow"
                aria-valuemin="0"
                aria-valuemax="5"
                aria-label="Scenario progress"
              >
                <div
                  class="progress-line__fill"
                  :style="{ width: `${stageProgressPercent}%` }"
                ></div>
              </div>
              <div class="intro-meet-head">
                <figure class="intro-meet-head__art" aria-hidden="true">
                  <img class="intro-meet-head__img" src="/icons/image1.png" alt="" />
                </figure>
                <h4 class="intro-meet-head__title">Meet Alex</h4>
              </div>

              <p class="lead intro-lead">
                <span class="intro-lead__full"
                  >You'll step into Alex's shoes through a realistic job scam scenario. Watch how
                  pressure and urgency build—then discover the red flags that save the day.</span
                >
                <span class="intro-lead__short"
                  >Step into the scam. Learn how to spot the red flags.</span
                >
              </p>

              <div class="thinking-card" aria-label="Alex says">
                <p class="thinking-card__label">Alex says</p>
                <p
                  v-for="(line, idx) in introThinkingLines"
                  :key="`intro-think-${idx}`"
                  class="thinking-card__line thinking-card__line--desktop"
                >
                  {{ line }}
                </p>
                <p class="thinking-card__line thinking-card__line--mobile">
                  {{ introMobileSpeech }}
                </p>
              </div>

              <div class="actions">
                <button class="primary" type="button" @click="nextStage">Start scenario →</button>
                <button class="secondary" type="button" @click="$emit('exit')">
                  Back to choose another scam type
                </button>
              </div>
            </div>
          </template>

          <template v-else-if="stage <= 5">
            <div class="sim-visual sim-visual--walkthrough">
              <article class="scene-card scene-card--walkthrough" aria-label="Scam scene">
                <section class="wt-block wt-block--scene" aria-label="Scene illustration">
                  <p class="wt-label">Scene</p>
                  <div class="scene-image-wrap scene-image-wrap--walkthrough">
                    <img class="sim-image" :src="stageImage" :alt="`Alex stage ${stage}`" />
                    <div
                      class="scene-image-fade scene-image-fade--walkthrough"
                      aria-hidden="true"
                    ></div>
                  </div>
                </section>

                <section class="wt-block wt-block--conversation" aria-label="Conversation sample">
                  <p class="wt-label">Conversation</p>
                  <div class="wt-conversation-card">
                    <div class="phone-thread phone-thread--walkthrough">
                      <template
                        v-for="(line, idx) in stageThreadDesktopLines"
                        :key="`wt-d-${stage}-${idx}`"
                      >
                        <p
                          :class="[
                            'bubble',
                            'bubble--wt-desktop',
                            line.role === 'alex' ? 'bubble--alex' : 'bubble--scammer',
                          ]"
                        >
                          {{ line.text }}
                        </p>
                      </template>
                      <template
                        v-for="(line, idx) in stageThreadMobileLines"
                        :key="`wt-m-${stage}-${idx}`"
                      >
                        <p
                          :class="[
                            'bubble',
                            'bubble--wt-mobile',
                            line.role === 'alex' ? 'bubble--alex' : 'bubble--scammer',
                          ]"
                        >
                          {{ line.text }}
                        </p>
                      </template>
                    </div>
                  </div>
                </section>
              </article>
            </div>

            <div
              class="sim-copy sim-copy--scene"
              :class="{ 'sim-copy--danger': picked === 'risk' }"
            >
              <div class="wt-stage-mobile-stack">
                <header class="scene-head scene-head--mobile">
                  <p class="sim-meta">{{ scenario.title }} · Stage {{ stageLabel }} of 5</p>
                  <div
                    class="progress-line"
                    role="progressbar"
                    :aria-valuenow="progressAriaNow"
                    aria-valuemin="0"
                    aria-valuemax="5"
                    aria-label="Scenario progress"
                  >
                    <div
                      class="progress-line__fill"
                      :style="{ width: `${stageProgressPercent}%` }"
                    ></div>
                  </div>
                </header>
                <h4 class="scene-stage-title scene-stage-title--mobile">
                  {{ scenario.stages[stage - 1].title }}
                </h4>
                <p class="scene-stage-lead scene-stage-lead--mobile wt-stage-lead--stack">
                  {{ stageLeadMobile }}
                </p>
                <figure class="wt-scene-mobile-figure">
                  <img
                    class="wt-scene-mobile-figure__img"
                    :src="stageImage"
                    :alt="`Alex stage ${stage}`"
                  />
                </figure>
              </div>

              <section class="wt-mobile-convo" aria-label="Conversation sample">
                <div class="wt-conversation-card wt-conversation-card--mobile">
                  <div class="phone-thread phone-thread--walkthrough phone-thread--compact">
                    <template
                      v-for="(line, idx) in stageThreadMobileLines"
                      :key="`wt-m-copy-${stage}-${idx}`"
                    >
                      <p
                        :class="[
                          'bubble',
                          line.role === 'alex' ? 'bubble--alex' : 'bubble--scammer',
                        ]"
                      >
                        {{ line.text }}
                      </p>
                    </template>
                  </div>
                </div>
              </section>

              <header class="scene-head scene-head--desktop">
                <p class="sim-meta">{{ scenario.title }} · Stage {{ stageLabel }} of 5</p>
                <div
                  class="progress-line"
                  role="progressbar"
                  :aria-valuenow="progressAriaNow"
                  aria-valuemin="0"
                  aria-valuemax="5"
                  aria-label="Scenario progress"
                >
                  <div
                    class="progress-line__fill"
                    :style="{ width: `${stageProgressPercent}%` }"
                  ></div>
                </div>
              </header>

              <h4 class="scene-stage-title scene-stage-title--desktop">
                {{ scenario.stages[stage - 1].title }}
              </h4>
              <p class="scene-stage-lead scene-stage-lead--desktop">{{ currentStage.text }}</p>

              <div v-if="!picked" class="wt-stage-context wt-stage-context--desktop">
                <div class="risk-signal risk-signal--editorial">
                  <p class="risk-signal__kicker">Risk signal</p>
                  <p class="risk-signal__tag risk-signal__tag--desktop">
                    <span class="risk-signal__glyph" aria-hidden="true">⚠</span>
                    Risk signal · {{ currentStage.riskTag }}
                  </p>
                  <p class="risk-signal__tag risk-signal__tag--mobile">
                    <span class="risk-signal__glyph" aria-hidden="true">⚠</span>
                    {{ currentStage.riskTag }}
                  </p>
                  <p class="risk-signal__reason risk-signal__reason--desktop">
                    {{ currentStage.riskReason }}
                  </p>
                  <p class="risk-signal__reason risk-signal__reason--mobile">
                    {{ stageRiskReasonMobile }}
                  </p>
                </div>
                <div class="thinking-strip">
                  <p class="thinking-strip__label">Alex is thinking</p>
                  <p class="thinking-strip__line thinking-strip__line--desktop">
                    {{ thoughtLines[0] }}
                  </p>
                  <p class="thinking-strip__line thinking-strip__line--mobile">
                    {{ stageAlexThinkMobile }}
                  </p>
                </div>
              </div>

              <details
                v-if="!picked"
                class="stage-context-panel wt-stage-context wt-stage-context--mobile"
              >
                <summary class="stage-context-panel__summary disclosure-summary">
                  <span class="disclosure-summary__text">
                    <span class="stage-context-panel__glyph" aria-hidden="true">⚠</span>
                    Context · {{ currentStage.riskTag }}
                  </span>
                  <span class="disclosure-chevron" aria-hidden="true"></span>
                </summary>
                <div class="stage-context-panel__body">
                  <div class="risk-signal risk-signal--editorial">
                    <p class="risk-signal__kicker">Risk signal</p>
                    <p class="risk-signal__tag risk-signal__tag--mobile">
                      <span class="risk-signal__glyph" aria-hidden="true">⚠</span>
                      {{ currentStage.riskTag }}
                    </p>
                    <p class="risk-signal__reason risk-signal__reason--mobile">
                      {{ stageRiskReasonMobile }}
                    </p>
                  </div>
                  <div class="thinking-strip">
                    <p class="thinking-strip__label">Alex is thinking</p>
                    <p class="thinking-strip__line thinking-strip__line--mobile">
                      {{ stageAlexThinkMobile }}
                    </p>
                  </div>
                </div>
              </details>

              <p class="choices-prompt">What should Alex do?</p>

              <div class="choices choices--scene" aria-label="Decision options">
                <button
                  class="choice"
                  :class="optionStateClass('safe')"
                  type="button"
                  :disabled="Boolean(picked)"
                  @click="pick('safe')"
                >
                  <span class="choice-title">{{ scenario.stages[stage - 1].safeOption }}</span>
                </button>
                <button
                  class="choice"
                  :class="optionStateClass('risk')"
                  type="button"
                  :disabled="Boolean(picked)"
                  @click="pick('risk')"
                >
                  <span class="choice-title">{{ scenario.stages[stage - 1].riskOption }}</span>
                </button>
              </div>

              <div
                v-if="picked && choiceFeedback"
                class="coach-note coach-note--compact"
                :class="picked === 'risk' ? 'coach-note--risk' : 'coach-note--safe'"
                role="status"
                aria-live="polite"
              >
                <p class="coach-note__judgment">{{ choiceFeedback.judgment }}</p>
                <details class="coach-note__more">
                  <summary class="disclosure-summary">
                    <span class="disclosure-summary__text">Why this matters</span>
                    <span class="disclosure-chevron" aria-hidden="true"></span>
                  </summary>
                  <p class="coach-note__explain">{{ choiceFeedback.explain }}</p>
                  <p class="coach-note__action">
                    <span class="coach-note__action-label">{{ choiceFeedback.actionLabel }}</span>
                    {{ choiceFeedback.action }}
                  </p>
                </details>

                <div class="actions actions--compact">
                  <button class="primary" type="button" @click="nextStage">Continue →</button>
                  <button class="secondary" type="button" @click="$emit('exit')">
                    Back to choose another scam type
                  </button>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="sim-copy sim-copy--final">
              <section class="finale-celebration" aria-label="Scenario complete">
                <figure class="finale-celebration__art">
                  <img
                    class="finale-celebration__img"
                    :src="finalOutcomeImage"
                    :alt="finalOutcomeAlt"
                  />
                </figure>
                <div class="finale-celebration__copy">
                  <p class="finale-celebration__eyebrow">{{ finaleCelebrationEyebrow }}</p>
                  <h4 class="final-outcome-heading">{{ finalOutcomeTitle }}</h4>
                  <p class="finale-celebration__message">{{ finalOutcomeMessage }}</p>
                </div>
              </section>
              <section
                class="outcome-section outcome-section--coach"
                v-if="showPersonalSummary"
                aria-label="Learning recap and AI coach"
              >
                <details
                  class="finale-recap-panel"
                  :open="recapItems.length > 0 && recapItems.length <= 2"
                >
                  <summary class="finale-recap-panel__summary disclosure-summary">
                    <span class="disclosure-summary__text">
                      Your recap
                      <span v-if="recapItems.length" class="finale-recap-panel__count">{{
                        recapItems.length
                      }}</span>
                    </span>
                    <span class="disclosure-chevron" aria-hidden="true"></span>
                  </summary>
                  <ol v-if="recapItems.length" class="finale-recap-compact">
                    <li
                      v-for="item in recapItems"
                      :key="item.key"
                      class="finale-recap-compact__item"
                    >
                      <p class="finale-recap-compact__decision">{{ item.decision }}</p>
                      <details class="finale-recap-compact__more">
                        <summary class="disclosure-summary disclosure-summary--inline">
                          <span class="disclosure-summary__text">Details</span>
                          <span class="disclosure-chevron" aria-hidden="true"></span>
                        </summary>
                        <p>{{ item.why }} · {{ item.how }}</p>
                      </details>
                    </li>
                  </ol>
                  <p v-else class="coach-risk-path-clean">
                    No high-risk taps this run — keep verifying recruiters before you share IDs or
                    move money.
                  </p>
                </details>

                <details class="finale-coach-panel" aria-label="Learning and AI coach">
                  <summary class="finale-coach-panel__summary disclosure-summary">
                    <span class="disclosure-summary__text">
                      <span class="ai-sparkle" aria-hidden="true">✦</span>
                      Learning &amp; AI coach
                      <span
                        v-if="coachLoading"
                        class="ai-badge ai-badge--loading"
                        aria-live="polite"
                        >…</span
                      >
                      <span v-else-if="coachSource === 'ai'" class="ai-badge ai-badge--ok"
                        >Gemini</span
                      >
                    </span>
                    <span class="disclosure-chevron" aria-hidden="true"></span>
                  </summary>
                  <div class="summary-body summary-body--ai-open">
                    <div class="coach-unified-stack coach-unified-stack--ai-only">
                      <section
                        v-if="harmFocusBullets.length"
                        class="coach-panel coach-panel--stakes"
                        :class="{ 'coach-panel--stakes-high': isHighPressureOutcome }"
                        aria-label="Harm patterns"
                      >
                        <p class="coach-panel__heading">
                          {{
                            isHighPressureOutcome
                              ? 'If pressure keeps winning'
                              : 'Why this playbook drags people in'
                          }}
                        </p>
                        <p v-if="isHighPressureOutcome" class="coach-stakes-meta">
                          Signals · ABC News Jul 2025 · Scamwatch
                        </p>
                        <ul class="coach-stakes-bullets">
                          <li v-for="(bullet, hb) in harmFocusBullets" :key="`coach-h-${hb}`">
                            {{ bullet }}
                          </li>
                        </ul>
                      </section>

                      <div class="coach-panel-rule" role="presentation"></div>

                      <section class="coach-panel coach-panel--synthesis" aria-label="Coach">
                        <p class="coach-panel__heading coach-panel__heading--secondary">Coach</p>

                        <details v-if="coachError" class="coach-livefail">
                          <summary class="coach-livefail__summary">
                            Could not reach the live Gemini model — offline coach fills in below.
                          </summary>
                          <p class="coach-livefail__detail">{{ coachError }}</p>
                        </details>

                        <div v-if="coachLoading" class="ai-coach-skeleton">
                          <span class="ai-coach-line ai-coach-line--wide"></span>
                          <span class="ai-coach-line"></span>
                          <span class="ai-coach-line ai-coach-line--mid"></span>
                        </div>
                        <div v-else class="ai-coach-compact">
                          <p v-if="coachParagraphDisplay" class="ai-coach-compact__para">
                            {{ coachParagraphDisplay }}
                          </p>
                          <dl
                            v-if="coachTopRiskDisplay || coachNextActionDisplay"
                            class="ai-coach-compact__dl"
                          >
                            <template v-if="coachTopRiskDisplay">
                              <dt>Pattern</dt>
                              <dd>{{ coachTopRiskDisplay }}</dd>
                            </template>
                            <template v-if="coachNextActionDisplay">
                              <dt>Next step</dt>
                              <dd>{{ coachNextActionDisplay }}</dd>
                            </template>
                          </dl>
                          <p v-if="coachHesitationDisplay" class="ai-coach-compact__timing">
                            <span class="ai-coach-compact__timing-lbl">Pause pattern</span>
                            {{ coachHesitationDisplay }}
                          </p>
                          <p class="ai-coach-compact__fineprint">
                            Model text can drift — lock money decisions behind regulators, your
                            bank, and Scamwatch.
                          </p>
                        </div>
                      </section>
                    </div>
                  </div>
                </details>
              </section>

              <section class="finale-next" aria-label="Next actions">
                <p class="finale-next__label">Next steps</p>
                <div class="finale-next-chips">
                  <button
                    v-for="row in nextStepRows"
                    :key="row.id"
                    type="button"
                    class="finale-next-chip"
                    :class="{ 'finale-next-chip--on': nextStepChecksModel[row.id] }"
                    :aria-pressed="Boolean(nextStepChecksModel[row.id])"
                    @click="nextStepChecksModel[row.id] = !nextStepChecksModel[row.id]"
                  >
                    {{ row.label }}
                  </button>
                </div>
              </section>

              <div v-if="showDetectedResult && detectedLabel" class="detected">
                <strong>Detected type:</strong> {{ detectedLabel }} — {{ detectedTone }}
              </div>

              <div class="actions">
                <a
                  class="primary"
                  href="https://www.scamwatch.gov.au/report-a-scam"
                  target="_blank"
                  rel="noopener noreferrer"
                  >Report to Scamwatch →</a
                >
                <button class="secondary" type="button" @click="$emit('restart')">
                  Try another scenario
                </button>
              </div>
            </div>
          </template>
        </article>
      </Transition>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue'
import { SCAM_SIMULATION_SCENARIOS } from '../constants/scamSimulationScenarios'
import {
  persistWalkthroughSession,
  appendWalkthroughEvent,
} from '../services/walkthroughTimingService'

const props = defineProps({
  scenarioType: { type: String, default: 'task_based' },
  detectedLabel: { type: String, default: '' },
  detectedTone: { type: String, default: '' },
  showDetectedResult: { type: Boolean, default: false },
  coachParagraph: { type: String, default: '' },
  coachTopRisk: { type: String, default: '' },
  coachNextAction: { type: String, default: '' },
  coachTone: { type: String, default: '' },
  coachHesitationInsight: { type: String, default: '' },
  coachSource: { type: String, default: 'idle' }, // idle | ai | fallback
  coachLoading: { type: Boolean, default: false },
  coachError: { type: String, default: '' },
})

const emit = defineEmits(['restart', 'exit', 'completed'])

function shortenToWords(text, maxWords = 22) {
  const clean = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!clean) return ''
  const words = clean.split(' ')
  if (words.length <= maxWords) return clean
  return `${words.slice(0, maxWords).join(' ')}…`
}

const stage = ref(0)
const picked = ref('')
const riskCount = ref(0)
const feedbackHistory = ref([])
const showPersonalSummary = ref(false)
const simRef = ref(null)
const isFullscreen = ref(false)
const isTransitioning = ref(false)
let savedScrollY = 0
const interactionTiming = ref([])
const stageEnteredAt = ref(0)

const scenario = computed(
  () => SCAM_SIMULATION_SCENARIOS[props.scenarioType] || SCAM_SIMULATION_SCENARIOS.task_based,
)
const stageLabel = computed(() => Math.min(5, Math.max(1, stage.value)))

/** Single thin progress bar: stage 1–5 advances fill; intro 0 empty; finale (>5) treated as full in template. */
const stageProgressPercent = computed(() => {
  const s = stage.value
  if (s <= 0) return 0
  if (s > 5) return 100
  return Math.round((s / 5) * 100)
})

const progressAriaNow = computed(() => {
  const s = stage.value
  if (s <= 0) return 0
  if (s > 5) return 5
  return Math.min(5, s)
})

const currentStage = computed(() => scenario.value.stages[Math.max(0, stage.value - 1)] || {})

function buildStageThreadLines(stage, useMobile) {
  const mobile = stage?.mobile
  if (useMobile && Array.isArray(mobile?.thread) && mobile.thread.length) {
    return mobile.thread.slice(0, 3).map((item) => {
      if (typeof item === 'string') return { role: 'scammer', text: item }
      return { role: item.role === 'alex' ? 'alex' : 'scammer', text: item.text }
    })
  }
  const base = stage?.scammerThread || (stage?.scammerLine ? [stage.scammerLine] : [])
  const lines = base.map((text) => ({ role: 'scammer', text }))
  if (stage?.phoneReply) lines.push({ role: 'alex', text: stage.phoneReply })
  return lines
}

const stageThreadDesktopLines = computed(() => buildStageThreadLines(currentStage.value, false))
const stageThreadMobileLines = computed(() => buildStageThreadLines(currentStage.value, true))
const stageLeadMobile = computed(
  () => currentStage.value.mobile?.text || currentStage.value.text || '',
)
const stageRiskReasonMobile = computed(
  () => currentStage.value.mobile?.riskReason || currentStage.value.riskReason || '',
)
const stageAlexThinkMobile = computed(
  () => currentStage.value.mobile?.alexThink || (currentStage.value.alexTalk || [])[0] || '',
)

const thoughtLines = computed(() => (currentStage.value.alexTalk || []).slice(0, 2))
const introThinkingLines = computed(() => (scenario.value.introAlex || []).slice(0, 2))
const introMobileSpeech = computed(() => {
  const brief = scenario.value.introAlexMobile
  if (typeof brief === 'string' && brief.trim()) return brief.trim()
  if (Array.isArray(brief) && brief.length) return brief.join(' ')
  return introThinkingLines.value.join(' ')
})

const localSummaryPoints = computed(() => buildLocalSummaryPoints())
const localSummaryText = computed(() => localSummaryPoints.value.join(' '))

const coachParagraphDisplay = computed(() => props.coachParagraph.trim())
const coachTopRiskDisplay = computed(() => props.coachTopRisk.trim())
const coachNextActionDisplay = computed(() => props.coachNextAction.trim())
const coachHesitationDisplay = computed(() => props.coachHesitationInsight.trim())

const choiceFeedback = computed(() => {
  if (!picked.value) return null
  const st = currentStage.value
  const isRisk = picked.value === 'risk'

  if (isRisk) {
    return {
      judgment: `Higher risk · ${st.riskTag || 'pressure signal'}`,
      explain: shortenToWords(st.learningPoint || st.riskReason, 20),
      action: shortenToWords(st.safeAction, 22),
      actionLabel: 'Try instead:',
    }
  }

  return {
    judgment: 'Lower risk · good pause',
    explain: shortenToWords(st.safeNote || st.learningPoint, 20),
    action: shortenToWords(st.safeAction || st.learningPoint, 22),
    actionLabel: 'Keep doing:',
  }
})

const recapCountLine = computed(() => {
  const n = riskCount.value
  if (n === 0) return 'High-risk choices this run: 0'
  if (n === 1) return 'High-risk choices this run: 1'
  return `High-risk choices this run: ${n}`
})

const recapItems = computed(() => {
  return feedbackHistory.value
    .filter((h) => h.choice === 'risk')
    .sort((a, b) => a.stage - b.stage)
    .slice(0, 3)
    .map((item) => {
      const stageMeta = scenario.value.stages[item.stage - 1] || {}
      return {
        key: `recap-${item.stage}`,
        decision: `Stage ${item.stage} · ${stageMeta.title || item.riskTag}`,
        why: shortenToWords(item.riskReason || stageMeta.learningPoint, 22),
        how: shortenToWords(item.safeAction || stageMeta.safeAction, 22),
      }
    })
})

const isHighPressureOutcome = computed(() => riskCount.value >= 1)
const finalOutcomeImage = computed(() =>
  isHighPressureOutcome.value ? '/icons/Image6.png' : '/icons/Image7.png',
)
const finalOutcomeAlt = computed(() =>
  isHighPressureOutcome.value
    ? 'Alex points out fake balance and pressure tactics clearly'
    : 'Alex celebrates regaining control with confidence',
)
const finalOutcomeTitle = computed(() =>
  isHighPressureOutcome.value
    ? 'High-pressure path — coercion + fake balance surfaced.'
    : 'Low-pressure path — script stalled early.',
)
const finalOutcomeMessage = computed(() =>
  isHighPressureOutcome.value
    ? 'You made it through a high-pressure script. Take one win from this run and one thing to slow down next time.'
    : 'You kept the scam from escalating — that is the outcome we are training for.',
)

const finaleCelebrationEyebrow = computed(() =>
  isHighPressureOutcome.value ? 'Tough run — you finished' : 'Well done',
)

const HIGH_PRESSURE_FOCUS_BULLETS = [
  'Fake dashboards and first “unlock” fees train you to self-fund wages, then demands stack fast.',
  'After cash moves, ID grabs keep the damage going — urgency is tuned to mute your checks.',
]

const harmFocusBullets = computed(() => {
  if (isHighPressureOutcome.value) return HIGH_PRESSURE_FOCUS_BULLETS
  const low = scenario.value.lowRiskHarmBullets
  return Array.isArray(low) && low.length ? low.slice(0, 2) : []
})

const nextStepRows = computed(() => {
  const type = props.scenarioType || 'task_based'

  const rows = [
    { id: 'no-pay', label: 'Freeze payouts to strangers — every “unlock” story is still a no.' },
    {
      id: 'call-official',
      label: 'Use bank + agency numbers you look up; ignore panic callbacks from the thread.',
    },
    {
      id: 'save-proof',
      label: 'Screenshot chats + dashboards; note exact times while access lasts.',
    },
    { id: 'report', label: 'File Scamwatch + police cyber with ABN references in one pass.' },
  ]

  if (type === 'phishing') {
    rows.splice(3, 0, {
      id: 'typed-login',
      label: 'Open logins only from domains you type yourself after a clean-device check.',
    })
  }

  if (type === 'identity_scam') {
    rows.splice(3, 0, {
      id: 'bureau',
      label: 'If documents left the chat, ping AU credit bureaus for victim flags.',
    })
  }

  if (type === 'investment' || type === 'financial_fraud') {
    rows.splice(1, 0, {
      id: 'split-narrative',
      label: 'Separate “job duties” from “balance / capital” prompts — overlap = leave.',
    })
  }

  return rows.map((entry, idx) => ({ ...entry, id: entry.id || `next-${idx}` }))
})

const nextStepChecksModel = reactive({})

watch(
  () => stage.value,
  (s) => {
    if (s >= 1 && s <= 5) {
      stageEnteredAt.value = Date.now()
    }
  },
)

watch(
  nextStepRows,
  (rows) => {
    rows.forEach((row) => {
      if (!(row.id in nextStepChecksModel)) nextStepChecksModel[row.id] = false
    })
    Object.keys(nextStepChecksModel).forEach((key) => {
      if (!rows.some((row) => row.id === key)) Reflect.deleteProperty(nextStepChecksModel, key)
    })
  },
  { immediate: true },
)

const stageImage = computed(() => {
  if (stage.value === 1) return '/icons/Image2.png'
  if (stage.value === 2) return '/icons/Image3.png'
  if (stage.value === 3) return '/icons/Image4.png'
  if (stage.value === 4) return '/icons/Image5.png'
  return '/icons/image1.png'
})

function pick(type) {
  if (picked.value) return

  const dwellMs =
    stage.value >= 1 && stage.value <= 5 && stageEnteredAt.value > 0
      ? Math.max(0, Date.now() - stageEnteredAt.value)
      : 0

  interactionTiming.value.push({
    stage: stage.value,
    dwellMs,
    choice: type,
  })

  appendWalkthroughEvent({
    type: 'sim_pick',
    scenarioType: props.scenarioType,
    stage: stage.value,
    dwellMs,
    choice: type,
  })

  picked.value = type

  const stageSnapshot = {
    stage: stage.value,
    choice: type,
    riskTag: currentStage.value.riskTag || 'Unknown risk signal',
    riskReason: currentStage.value.riskReason || 'No reason available.',
    safeAction: currentStage.value.safeAction || 'Pause and verify independently.',
    learningPoint: currentStage.value.learningPoint || 'Slow down before sharing data or paying.',
    summarySeed: currentStage.value.summarySeed || '',
    timestamp: Date.now(),
  }
  feedbackHistory.value.push(stageSnapshot)

  if (type === 'risk') {
    riskCount.value += 1
  }
  playTone(type)
}

function playTone(kind) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = kind === 'safe' ? 'sine' : 'triangle'
    osc.frequency.value = kind === 'safe' ? 620 : 240
    gain.gain.value = kind === 'safe' ? 0.09 : 0.12
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + (kind === 'safe' ? 0.1 : 0.14))
    osc.onended = () => {
      ctx.close().catch(() => {})
    }
  } catch {
    // silently ignore when audio is unavailable
  }
}

function enterFullscreen() {
  const el = simRef.value
  if (!el?.requestFullscreen) return
  savedScrollY = window.scrollY
  isTransitioning.value = true
  const onFsChange = () => {
    isTransitioning.value = false
    document.removeEventListener('fullscreenchange', onFsChange)
  }
  document.addEventListener('fullscreenchange', onFsChange)
  setTimeout(
    () =>
      el.requestFullscreen().catch(() => {
        isTransitioning.value = false
      }),
    80,
  )
  setTimeout(() => {
    isTransitioning.value = false
  }, 900)
}

function exitFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
}

function handleFullscreenChange() {
  const wasFullscreen = isFullscreen.value
  isFullscreen.value = !!document.fullscreenElement
  if (wasFullscreen && !isFullscreen.value) {
    requestAnimationFrame(() => {
      const learnEl = document.getElementById('learn-section')
      const scrollTarget = learnEl
        ? learnEl.getBoundingClientRect().top + window.scrollY
        : savedScrollY
      window.scrollTo({ top: scrollTarget, behavior: 'instant' })
      window.dispatchEvent(new Event('resize'))
    })
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  enterFullscreen()
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
})

function nextStage() {
  picked.value = ''
  stage.value += 1

  if (stage.value === 6) {
    exitFullscreen()
    showPersonalSummary.value = true
    emit('completed', {
      scenarioType: props.scenarioType,
      highPressure: isHighPressureOutcome.value,
      riskCount: riskCount.value,
      feedbackHistory: feedbackHistory.value,
      localSummaryPoints: localSummaryPoints.value,
      localSummaryText: localSummaryText.value,
      interactionTiming: interactionTiming.value.slice(),
      scenarioMeta: {
        scenarioLabel: scenario.value.scenarioLabel,
        typeTone: scenario.value.typeTone,
        summarySeed: scenario.value.summarySeed,
        topRiskSeed: scenario.value.topRiskSeed,
        nextActionSeed: scenario.value.nextActionSeed,
        closingSeed: scenario.value.closingSeed,
      },
    })

    persistWalkthroughSession({
      scenarioType: props.scenarioType,
      highPressure: isHighPressureOutcome.value,
      riskCount: riskCount.value,
      stages: interactionTiming.value.slice(),
      completedAt: Date.now(),
    })
  }
}

function buildLocalSummaryPoints() {
  const risks = feedbackHistory.value
    .filter((h) => h.choice === 'risk')
    .sort((a, b) => a.stage - b.stage)
  if (!risks.length) {
    return ['No risky taps — keep verifying payouts and recruiters before sharing IDs or money.']
  }

  return risks.map((item) => `Stage ${item.stage}: ${item.riskTag}`)
}

function optionStateClass(type) {
  if (!picked.value) return 'choice--neutral'
  if (picked.value === type && type === 'safe') return 'choice--selected-correct'
  if (picked.value === type && type === 'risk') return 'choice--selected-wrong'
  return 'choice--not-selected'
}

watch(
  () => props.scenarioType,
  () => {
    stage.value = 0
    picked.value = ''
    riskCount.value = 0
    feedbackHistory.value = []
    stageEnteredAt.value = 0
    showPersonalSummary.value = false
    interactionTiming.value = []
    Object.keys(nextStepChecksModel).forEach((key) => {
      nextStepChecksModel[key] = false
    })
  },
)
</script>

<style scoped>
.sim {
  width: 100%;
  max-width: min(1280px, 100%);
  margin: 0 auto;
  --bg-page: #fcf7f1;
  --bg-panel: #fffbf7;
  --bg-soft-blue: #eaf3f7;
  --bg-warning: #fdedea;
  --navy: #1b2e5e;
  --coral: #e8412a;
  --teal: #0f9d8f;
  --cream-border: #e7ded3;
  --text-main: #191827;
  --text-muted: #6b7280;
}

.sim-meta {
  margin: 0;
  color: var(--text-main);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.sim-meta__sep {
  font-weight: 600;
  color: var(--text-muted);
}

.scene-head {
  display: grid;
  gap: 8px;
  margin-bottom: 4px;
}

.progress-line {
  height: 4px;
  border-radius: 999px;
  background: var(--cream-border);
  overflow: hidden;
}

.progress-line__fill {
  height: 100%;
  background: var(--navy);
  border-radius: inherit;
  transition: width 0.28s ease;
}

.sim-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0;
  border: 1px solid var(--cream-border);
  border-radius: 20px;
  overflow: hidden;
  min-height: clamp(500px, 68vh, 700px);
  background: var(--bg-panel);
  box-shadow: 0 10px 28px rgba(27, 46, 94, 0.08);
  align-items: stretch;
}

.sim-card--walkthrough {
  grid-template-columns: minmax(0, 48fr) minmax(0, 52fr);
}

.sim-card--finale {
  grid-template-columns: minmax(0, 1fr);
  min-height: auto;
}

.sim--fullscreen .sim-card--walkthrough {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  min-width: 0;
  overflow: hidden;
}

.sim--fullscreen .sim-card--walkthrough > * {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.sim--fullscreen .sim-visual--walkthrough,
.sim--fullscreen .sim-copy--scene {
  box-sizing: border-box;
  max-width: 100%;
  min-width: 0;
  overflow-x: clip;
  overflow-y: auto;
}

.sim--fullscreen .sim-copy--scene {
  padding: 14px 16px;
}

.sim--fullscreen .sim-copy--scene .choices,
.sim--fullscreen .sim-copy--scene .choice,
.sim--fullscreen .sim-copy--scene .risk-signal,
.sim--fullscreen .sim-copy--scene .thinking-strip,
.sim--fullscreen .sim-copy--scene .wt-stage-context,
.sim--fullscreen .sim-copy--scene .stage-context-panel,
.sim--fullscreen .sim-copy--scene .coach-note,
.sim--fullscreen .wt-conversation-card,
.sim--fullscreen .scene-card--walkthrough {
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.sim--fullscreen .sim-copy--scene .bubble,
.sim--fullscreen .sim-copy--scene .choice-title {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.sim--fullscreen .sim-wrapper {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}
.sim-card--split-thirds {
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
}
.sim-visual {
  background: transparent;
  border-right: 1px solid var(--cream-border);
  padding: 0;
  display: flex;
  flex-direction: column;
  align-self: stretch;
}

.intro-visual {
  background: #fcf7f1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  padding: 0;
}

.scene-card {
  background: var(--bg-page);
  border: 0;
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.scene-card--walkthrough {
  background: var(--bg-panel);
}

.wt-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
}

.wt-block--scene {
  background: var(--bg-page);
  border-bottom: 1px solid var(--cream-border);
}

.wt-label {
  margin: 0;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.scene-image-wrap--walkthrough {
  min-height: clamp(288px, 46vh, 540px);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--cream-border);
  background: var(--bg-page);
}

.wt-block--conversation {
  background: var(--bg-panel);
  flex: 1 1 auto;
  min-height: 0;
}

.wt-conversation-card {
  border-radius: 12px;
  border: 1px solid var(--cream-border);
  background: var(--bg-panel);
  padding: 8px 9px;
}

.scene-image-fade--walkthrough {
  background: linear-gradient(to bottom, rgba(252, 247, 241, 0) 0%, var(--bg-page) 100%);
}

.scene-image-wrap {
  position: relative;
  background: #fcf7f1;
  flex: 1 1 auto;
  min-height: clamp(300px, 52vh, 580px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Intro image fills full left column */
.intro-visual .scene-image-wrap {
  flex: 1 1 auto;
  min-height: clamp(380px, 64vh, 760px);
  background: #fcf7f1;
}

.intro-visual .scene-image-wrap .sim-image {
  flex: 1 1 auto;
  max-height: min(720px, 78vh);
  max-width: 100%;
  object-fit: contain;
  transform-origin: center center;
}

@media (min-width: 900px) {
  .intro-visual .scene-image-wrap .sim-image {
    transform: scale(1.08);
  }
}

@media (max-width: 899px) {
  .intro-visual .scene-image-wrap .sim-image {
    transform: scale(1.04);
  }
}

.scene-image-fade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 72px;
  background: linear-gradient(to bottom, rgba(252, 247, 241, 0) 0%, #fcf7f1 100%);
  pointer-events: none;
}

.scene-dialogue-wrap {
  background: #fcf7f1;
  border-top: 1px solid #e3d7c8;
  flex: 0 1 auto;
  min-height: 112px;
  max-height: min(280px, 38vh);
  overflow-y: auto;
  padding: 10px 14px 12px;
}

.speaker-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  align-items: center;
}

.speaker-row::before {
  content: 'Conversation';
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 800;
  color: #6b7280;
  margin-right: 4px;
}

.speaker-chip {
  font-size: 0.74rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 4px 10px;
}

.speaker-chip--scammer {
  background: #1f2937;
  color: #fff;
}

.speaker-chip--alex {
  background: #eef4ff;
  color: #1b2e5e;
}

.sim-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.lead {
  margin: 0 0 8px;
}

.voice-note-stack {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}

.chat-thread {
  display: grid;
  gap: 7px;
  background: var(--bg-soft-blue);
  border: 1px solid var(--cream-border);
  border-radius: 14px;
  padding: 10px;
}

.chat-thread--intro {
  gap: 8px;
}

.bubble {
  margin: 0;
  border-radius: 12px;
  padding: 9px 11px;
  font-size: 0.82rem;
  line-height: 1.42;
  position: relative;
}

.bubble--scammer {
  background: #f7efe5;
  color: var(--navy);
  border: 1px solid var(--cream-border);
  max-width: 95%;
}

.bubble--alex {
  background: var(--bg-soft-blue);
  color: var(--navy);
  border: 1px solid var(--cream-border);
  justify-self: end;
  max-width: 96%;
}

.phone-thread {
  display: grid;
  gap: 9px;
  background: #ffffff;
  border: 1px solid #e5e2dc;
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 1px 4px rgba(26, 26, 42, 0.06);
}

.phone-thread.phone-thread--walkthrough {
  gap: 5px;
  background: transparent;
  border: none;
  padding: 0;
  box-shadow: none;
}

.phone-bubble {
  font-size: 0.79rem;
  line-height: 1.38;
}

.bubble-avatar {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  background: #93c5fd;
  color: #0f172a;
  font-size: 0.68rem;
  font-weight: 800;
}

.sim-copy {
  background: var(--bg-panel);
  padding: 16px 18px 14px;
  display: grid;
  align-content: start;
  gap: 12px;
  overflow-y: auto;
}

.sim-copy--scene {
  gap: 10px;
}

.scene-stage-title {
  margin: 2px 0 0;
  color: var(--navy);
  font-size: 1.08rem;
  line-height: 1.32;
}

.scene-stage-lead {
  margin: 0;
  color: var(--text-main);
  font-size: 0.84rem;
  line-height: 1.58;
}

.sim-copy--intro {
  gap: 12px;
}

.intro-meet-head {
  display: grid;
  gap: 0;
}

.intro-meet-head__art {
  display: none;
  margin: 0;
}

.intro-meet-head__title {
  margin: 0 0 8px;
  color: var(--navy);
  font-size: 1.22rem;
  line-height: 1.35;
}

.intro-lead__short {
  display: none;
}

.thinking-card__line--mobile {
  display: none;
}

.wt-stage-mobile-stack,
.wt-scene-mobile-figure,
.wt-mobile-convo {
  display: none;
}

.scene-head--mobile,
.scene-stage-title--mobile {
  display: none;
}

.sim-copy--final {
  background: #fffbf7;
  display: flex;
  flex-direction: column;
  padding: 16px 18px 18px;
  gap: 12px;
  overflow-x: hidden;
  overflow-y: auto;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.finale-celebration {
  align-items: center;
  background: linear-gradient(135deg, rgba(59, 111, 143, 0.08) 0%, rgba(252, 247, 241, 0.95) 55%);
  border: 1px solid var(--cream-border);
  border-radius: 14px;
  display: flex;
  gap: 14px;
  margin: 0;
  padding: 12px 14px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.finale-celebration__art {
  flex: 0 0 auto;
  margin: 0;
}

.finale-celebration__img {
  display: block;
  height: auto;
  max-height: 112px;
  max-width: 112px;
  object-fit: contain;
  width: auto;
}

.finale-celebration__copy {
  display: grid;
  flex: 1 1 auto;
  gap: 4px;
  min-width: 0;
}

.finale-celebration__eyebrow {
  color: #3b6f8f;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  margin: 0;
  text-transform: uppercase;
}

.finale-celebration__message {
  color: var(--text-main);
  font-size: 0.86rem;
  line-height: 1.45;
  margin: 0;
}

.finale-recap-panel,
.finale-coach-panel {
  border: 1px solid rgba(27, 46, 94, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.88);
}

.finale-recap-panel__summary,
.finale-coach-panel__summary {
  align-items: center;
  cursor: pointer;
  display: flex;
  flex-wrap: wrap;
  font-size: 0.8rem;
  font-weight: 800;
  gap: 8px;
  justify-content: space-between;
  list-style: none;
  padding: 10px 12px;
  color: var(--navy);
}

.finale-recap-panel__summary::-webkit-details-marker,
.finale-coach-panel__summary::-webkit-details-marker,
.stage-context-panel__summary::-webkit-details-marker,
.coach-note__more > .disclosure-summary::-webkit-details-marker,
.finale-recap-compact__more > .disclosure-summary::-webkit-details-marker {
  display: none;
}

.disclosure-summary {
  align-items: center;
  display: flex;
  gap: 10px;
  justify-content: space-between;
  list-style: none;
}

.disclosure-summary__text {
  align-items: center;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.disclosure-summary--inline {
  display: inline-flex;
  font-size: inherit;
  gap: 6px;
}

.disclosure-chevron {
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  flex-shrink: 0;
  height: 7px;
  transform: rotate(45deg);
  transition: transform 0.2s ease;
  width: 7px;
}

details[open] > .disclosure-summary .disclosure-chevron {
  transform: rotate(-135deg);
}

.wt-stage-context {
  display: grid;
  gap: 10px;
}

.wt-stage-context--mobile {
  display: none;
}

.wt-stage-lead--stack {
  display: none;
}

.finale-recap-panel__count {
  background: rgba(27, 46, 94, 0.08);
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 2px 8px;
}

.finale-recap-compact {
  list-style: none;
  margin: 0;
  padding: 0 12px 10px;
  display: grid;
  gap: 8px;
}

.finale-recap-compact__decision {
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.35;
  margin: 0 0 4px;
  color: var(--navy);
}

.finale-recap-compact__more {
  font-size: 0.74rem;
}

.finale-recap-compact__more summary {
  color: #3b6f8f;
  cursor: pointer;
  font-weight: 700;
}

.finale-coach-panel .summary-body {
  padding: 0 12px 12px;
}

.finale-next {
  display: grid;
  gap: 8px;
}

.finale-next__label {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  margin: 0;
  text-transform: uppercase;
  color: #4b5563;
}

.finale-next-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.finale-next-chip {
  background: #fff;
  border: 1px solid rgba(27, 46, 94, 0.18);
  border-radius: 999px;
  color: var(--navy);
  cursor: pointer;
  font-family: inherit;
  font-size: 0.74rem;
  font-weight: 600;
  line-height: 1.3;
  padding: 6px 12px;
  text-align: left;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.finale-next-chip--on {
  background: rgba(59, 111, 143, 0.12);
  border-color: rgba(59, 111, 143, 0.45);
}

.stage-context-panel {
  border: 1px solid rgba(220, 38, 38, 0.16);
  border-radius: 10px;
  background: rgba(255, 251, 246, 0.9);
}

.stage-context-panel__summary {
  align-items: center;
  cursor: pointer;
  display: flex;
  font-size: 0.78rem;
  font-weight: 700;
  gap: 8px;
  list-style: none;
  padding: 8px 10px;
  color: var(--navy);
}

.stage-context-panel__glyph {
  color: var(--coral);
}

.stage-context-panel__body {
  padding: 0 10px 10px;
  display: grid;
  gap: 8px;
}

.stage-context-panel__think {
  font-size: 0.78rem;
  line-height: 1.45;
  margin: 0;
  color: var(--text-muted);
}

.stage-context-panel__think-label {
  display: block;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: 2px;
}

.thinking-card--compact {
  border: 1px solid var(--cream-border);
  border-radius: 10px;
  background: rgba(238, 244, 255, 0.5);
  padding: 0;
}

.thinking-card--compact .thinking-card__label {
  cursor: pointer;
  list-style: none;
  margin: 0;
  padding: 8px 10px;
}

.thinking-card--compact .thinking-card__line {
  margin: 0;
  padding: 0 10px 8px;
}

.finale-header {
  align-items: flex-start;
  border-bottom: 1px solid #e3d7c8;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  margin: 0 0 4px;
  padding-bottom: 12px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.finale-header__copy {
  display: grid;
  flex: 1 1 auto;
  gap: 8px;
  min-width: 0;
}

.finale-header__message {
  color: #2b2b2b;
  font-size: 0.9rem;
  line-height: 1.45;
  margin: 0;
}

.finale-header__art {
  flex: 0 0 auto;
  margin: 0;
  max-width: 200px;
}

.finale-header__img {
  display: block;
  height: auto;
  max-height: 180px;
  max-width: 200px;
  object-fit: contain;
  width: 100%;
}

.sim-copy--final .actions {
  margin-top: auto;
  padding-top: 10px;
}

.final-outcome-heading {
  margin: 4px 0 2px;
  color: var(--navy);
  font-size: 1.05rem;
  line-height: 1.3;
}

.outcome-section__kicker {
  margin: 0 0 8px;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #4b5563;
}

.outcome-section--next {
  margin-top: 14px;
}

.coach-unified-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.coach-panel {
  border-radius: 12px;
  padding: 10px 11px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(27, 46, 94, 0.1);
}

.coach-panel--recap {
  background: rgba(248, 250, 252, 0.95);
}

.coach-panel--stakes {
  background: rgba(255, 251, 246, 0.9);
  border-color: rgba(220, 38, 38, 0.14);
}

.coach-panel--stakes-high {
  border-left: 3px solid var(--coral);
}

.coach-panel--synthesis {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(99, 102, 241, 0.22);
}

.coach-panel__heading {
  margin: 0 0 6px;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #4b5563;
}

.coach-panel__heading--secondary {
  color: var(--navy);
}

.coach-risk-path-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.coach-risk-path-list__item {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.48;
  color: var(--text-main);
}

.coach-risk-path-stage {
  font-weight: 800;
  color: var(--navy);
}

.coach-risk-path-sep {
  color: var(--text-muted);
  font-weight: 600;
}

.coach-risk-path-clean {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.48;
  color: var(--text-muted);
}

.coach-stakes-meta {
  margin: 0 0 6px;
  font-size: 0.67rem;
  color: #6b7280;
}

.coach-stakes-bullets {
  margin: 0;
  padding-left: 1.05rem;
  font-size: 0.76rem;
  line-height: 1.45;
  color: #374151;
  display: grid;
  gap: 6px;
}

.coach-panel-rule {
  border: none;
  height: 1px;
  margin: 2px 0;
  background: rgba(27, 46, 94, 0.12);
}

.coach-livefail {
  margin: 0 0 10px;
  border-radius: 8px;
  border: 1px dashed rgba(194, 65, 12, 0.45);
  padding: 6px 9px;
  background: rgba(255, 247, 237, 0.72);
}

.coach-livefail__summary {
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 750;
  color: #b45309;
}

.coach-livefail__detail {
  margin: 8px 0 0;
  font-size: 0.68rem;
  line-height: 1.42;
  color: #92400e;
  overflow-wrap: anywhere;
}

.ai-badge--offline-model {
  background: rgba(241, 245, 249, 0.98);
  color: #334155;
  border: 1px solid rgba(100, 116, 139, 0.32);
}

.ai-coach-compact {
  display: grid;
  gap: 10px;
}

.ai-coach-compact__para {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.56;
  color: #252525;
}

.ai-coach-compact__dl {
  margin: 0;
  display: grid;
  gap: 8px;
}

.ai-coach-compact__dl dt {
  margin: 0;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #475569;
}

.ai-coach-compact__dl dd {
  margin: 2px 0 0;
  font-size: 0.79rem;
  line-height: 1.46;
  color: #374151;
}

.ai-coach-compact__timing {
  margin: 0;
  font-size: 0.74rem;
  line-height: 1.42;
  color: #455468;
}

.ai-coach-compact__timing-lbl {
  font-weight: 800;
  color: #1b2e5e;
  margin-right: 6px;
  font-size: 0.6rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.ai-coach-compact__fineprint {
  margin: 0;
  font-size: 0.67rem;
  line-height: 1.42;
  color: #757575;
}

.next-checklist {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.next-checklist__label {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  cursor: pointer;
  font-size: 0.8rem;
  line-height: 1.42;
  color: #374151;
}

.next-checklist__input {
  margin-top: 3px;
  flex-shrink: 0;
}

.coach-divider {
  height: 1px;
  margin: 12px 0 8px;
  background: rgba(27, 46, 94, 0.12);
}

.summary-panel--ai {
  margin-top: 6px;
}

.summary-panel--ai.summary-panel--unified {
  margin-top: 10px;
}

.sim-copy p {
  margin: 0;
  color: #374151;
  line-height: 1.65;
}
.sim-copy--danger {
  animation: tiny-shake 0.2s linear;
}

.sim-copy--scene {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  align-content: flex-start;
  justify-content: flex-start;
  gap: clamp(5px, 1vh, 9px);
  padding-top: 0;
  padding-right: clamp(10px, 2vh, 15px);
  padding-bottom: clamp(10px, 2vh, 15px);
  padding-left: clamp(10px, 2vh, 15px);
  min-height: 0;
}

@media (min-width: 861px) {
  .sim-visual.sim-visual--walkthrough {
    padding-top: 50px;
  }

  .sim-copy.sim-copy--scene {
    padding-top: 50px;
  }
}

.finale-pane--image-only {
  display: none;
}

.finale-mobile-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin: 0 0 4px;
}

.finale-mobile-head__thumb {
  flex: 0 0 auto;
  margin: 0;
  width: 96px;
}

.finale-mobile-head__img {
  display: block;
  width: 96px;
  max-height: 110px;
  object-fit: contain;
}

.finale-mobile-head__body {
  flex: 1 1 auto;
  min-width: 0;
}

.sim-card--walkthrough .scene-head--desktop,
.sim-card--walkthrough .scene-stage-title--desktop {
  display: block;
}

.sim-card--walkthrough .scene-head--mobile,
.sim-card--walkthrough .scene-stage-title--mobile {
  display: none;
}

.sim-copy--final .outcome-section,
.sim-copy--final .detected,
.sim-copy--final .actions {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.sim-copy--scene .thinking-strip__line--desktop {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  line-clamp: 4;
  -webkit-line-clamp: 4;
  overflow: hidden;
}

.sim-copy--scene .risk-signal__reason--desktop {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  line-clamp: 4;
  -webkit-line-clamp: 4;
  overflow: hidden;
}

.sim-copy--scene .choices {
  margin-top: 0;
}

.sim-copy--scene .choice {
  width: 100%;
}

.risk-signal {
  display: grid;
  gap: 8px;
}

.risk-signal--editorial {
  border: 1px solid var(--cream-border);
  border-left: 4px solid var(--coral);
  background: #fffdfc;
  border-radius: 12px;
  padding: 12px 14px;
}

.risk-signal__tag {
  margin: 0;
  color: var(--navy);
  font-size: 0.84rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.risk-signal__glyph {
  flex-shrink: 0;
  font-size: 0.95rem;
  color: var(--coral);
  line-height: 1;
}

.risk-signal__reason {
  margin: 0;
  color: #4b5563;
  font-size: 0.84rem;
  line-height: 1.52;
}

.risk-signal__kicker,
.risk-signal__tag--mobile,
.risk-signal__reason--mobile,
.scene-stage-lead--mobile,
.bubble--wt-mobile,
.thinking-strip__line--mobile {
  display: none;
}

.sim-card--walkthrough .sim-copy--scene,
.sim-card--walkthrough .sim-visual--walkthrough,
.sim-card--walkthrough .risk-signal,
.sim-card--walkthrough .thinking-strip,
.sim-card--walkthrough .choice,
.sim-card--walkthrough .coach-note {
  min-width: 0;
  overflow-wrap: break-word;
  word-break: break-word;
}

.thinking-strip {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--cream-border);
  background: var(--bg-soft-blue);
  display: grid;
  gap: 6px;
}

.thinking-strip__label {
  margin: 0;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.thinking-strip__line {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.52;
  color: var(--navy);
}

.choices-prompt {
  margin: 2px 0 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--navy);
}

.thinking-card {
  border: 1px solid var(--cream-border);
  background: var(--bg-soft-blue);
  border-radius: 14px;
  padding: 14px;
  display: grid;
  gap: 8px;
}

.thinking-card__label {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--navy);
  letter-spacing: 0.01em;
}

.thinking-card__line {
  margin: 0;
  color: var(--navy);
  font-size: 0.92rem;
  line-height: 1.6;
}

.sim-copy--scene .coach-note {
  padding: 12px;
}

.choices,
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.choices--scene {
  flex-direction: column;
  flex-wrap: nowrap;
  width: 100%;
  gap: 10px;
  margin-top: 0;
}

.choice {
  width: 100%;
  background: var(--bg-panel);
  border: 1px solid var(--cream-border);
  border-left: 4px solid var(--navy);
  border-radius: 14px;
  color: var(--navy);
  cursor: pointer;
  display: grid;
  font-size: 0.95rem;
  font-weight: 700;
  gap: 5px;
  line-height: 1.45;
  padding: 14px 16px;
  position: relative;
  text-align: left;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.choice:hover,
.choice:focus-visible {
  background: var(--bg-soft-blue);
  border-color: var(--cream-border);
  border-left-color: var(--coral);
  box-shadow: 0 4px 14px rgba(27, 46, 94, 0.08);
}

.choice-title {
  font-size: 0.95rem;
  line-height: 1.45;
}

.choice:disabled {
  cursor: default;
  opacity: 1;
}

.choice--neutral:hover:not(:disabled),
.choice--neutral:focus-visible:not(:disabled) {
  transform: none;
}

.choice--selected-correct {
  border-color: var(--cream-border);
  border-left-color: var(--teal);
  background: rgba(15, 157, 143, 0.08);
}

.choice--selected-wrong {
  border-color: var(--cream-border);
  border-left-color: var(--coral);
  background: var(--bg-warning);
}

.choice--not-selected {
  opacity: 0.72;
}

.coach-note {
  display: grid;
  gap: 8px;
  margin-top: 10px;
  border: 1px solid var(--cream-border);
  border-radius: 12px;
  padding: 12px 14px;
}

.coach-note--safe {
  background: rgba(15, 157, 143, 0.08);
  border-left: 3px solid var(--teal);
}

.coach-note--risk {
  background: rgba(208, 49, 45, 0.07);
  border-left: 3px solid var(--coral);
}

.coach-note__judgment {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 800;
  line-height: 1.35;
  color: var(--navy);
}

.coach-note--risk .coach-note__judgment {
  color: #9f1239;
}

.coach-note__explain {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.5;
  color: #374151;
}

.coach-note__action {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.48;
  color: #1f2937;
}

.coach-note__action-label {
  display: block;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: 2px;
}

.outcome-section--coach {
  display: grid;
  gap: 8px;
}

.sim-copy--final .final-outcome-heading {
  font-size: 1.12rem;
  margin: 0;
}

.summary-panel--recap-block {
  background: rgba(248, 250, 252, 0.95);
  border: 1px solid rgba(27, 46, 94, 0.12);
  border-radius: 12px;
  padding: 12px 14px;
}

.summary-panel__eyebrow--recap {
  margin: 0 0 6px;
}

.recap-scroll-viewport {
  height: 100px;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid rgba(27, 46, 94, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.85);
}

.recap-scroll-viewport__inner {
  padding: 8px 10px;
}

.recap-scroll-viewport:focus-visible {
  outline: 2px solid rgba(27, 46, 94, 0.35);
  outline-offset: 2px;
}

.summary-panel--ai-open {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(99, 102, 241, 0.18);
  border-radius: 12px;
  padding: 12px 14px 14px;
}

.summary-panel__ai-head {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  justify-content: space-between;
  margin-bottom: 10px;
}

.summary-body--ai-open {
  margin-top: 0;
  max-height: none;
  opacity: 1;
  overflow: visible;
}

.coach-unified-stack--ai-only {
  gap: 10px;
}

.recap-count {
  margin: 0 0 8px;
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1.4;
  color: var(--navy);
}

.recap-items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}

.recap-item {
  margin: 0;
  padding: 10px 0 0;
  border-top: 1px solid rgba(27, 46, 94, 0.1);
}

.recap-item:first-child {
  border-top: 0;
  padding-top: 0;
}

.recap-item__decision {
  margin: 0 0 6px;
  font-size: 0.82rem;
  font-weight: 800;
  line-height: 1.35;
  color: var(--navy);
}

.recap-item__why,
.recap-item__how {
  margin: 0 0 6px;
  font-size: 0.8rem;
  line-height: 1.48;
  color: #374151;
}

.recap-item__lbl {
  display: block;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: 2px;
}

.reinforce-done {
  display: grid;
  gap: 8px;
}

.primary,
.secondary {
  border-radius: 10px;
  padding: 10px 12px;
  font-weight: 700;
  text-align: center;
}
.primary {
  background: #1b2e5e;
  color: #fff;
  border: 0;
  text-decoration: none;
}
.secondary {
  background: #fff;
  color: #1b2e5e;
  border: 1px solid rgba(27, 46, 94, 0.22);
}

.finale-pane {
  align-items: stretch;
  align-self: stretch;
  background: #fcf7f1;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0;
}

.finale-card {
  background: transparent;
  border: 0;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  overflow: hidden;
  padding: 10px;
}

.finale-pane--image-only {
  justify-content: center;
}

.finale-pane .finale-card {
  flex: 1;
  min-height: clamp(260px, 48vh, 640px);
  max-height: clamp(320px, 58vh, 720px);
}

.finale-pane--image-only .finale-image {
  max-height: min(58vh, 640px);
  width: auto;
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

.finale-image {
  display: block;
  height: 100%;
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  width: 100%;
}

/* ── Learning summary panel ── */
.summary-panel {
  margin-top: 10px;
  border: 1px solid #e5e2dc;
  background: #ffffff;
  border-radius: 10px;
  padding: 12px 12px 10px;
  box-shadow: 0 1px 4px rgba(26, 26, 42, 0.06);
}

.summary-panel__eyebrow {
  font-size: 0.68rem;
  font-weight: 800;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 10px;
}

/* ── AI Coach Summary (Gemini-inspired) ── */
.summary-panel--ai {
  border: 1px solid var(--cream-border);
  background: linear-gradient(165deg, var(--bg-panel) 0%, var(--bg-soft-blue) 100%);
  position: relative;
  overflow: hidden;
}

.summary-panel--ai::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--navy);
}

.ai-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.ai-panel-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-sparkle {
  font-size: 0.9rem;
  color: var(--navy);
  line-height: 1;
}

.summary-panel--ai .summary-panel__eyebrow {
  color: var(--navy);
  margin-bottom: 0;
}

.ai-badge {
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 3px 9px;
  letter-spacing: 0.03em;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.ai-badge--ok {
  background: rgba(122, 154, 130, 0.15);
  color: #3a6b4a;
  border: 1px solid rgba(122, 154, 130, 0.3);
}

.ai-badge--loading {
  background: rgba(59, 111, 143, 0.1);
  color: #3b6f8f;
  border: 1px solid rgba(59, 111, 143, 0.25);
  gap: 6px;
}

.ai-badge__spinner {
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 2px solid rgba(59, 111, 143, 0.3);
  border-top-color: #3b6f8f;
  border-radius: 50%;
  animation: ai-spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes ai-spin {
  to {
    transform: rotate(360deg);
  }
}

.ai-badge--guided {
  background: rgba(254, 252, 232, 0.95);
  color: #854d0e;
  border: 1px solid rgba(217, 119, 6, 0.35);
}

.ai-coach-skeleton {
  display: grid;
  gap: 8px;
  padding: 4px 0 2px;
}

.ai-coach-line {
  height: 10px;
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.12), rgba(59, 111, 143, 0.15));
  animation: ai-skel-shimmer 1.1s ease-in-out infinite;
}

.ai-coach-line--wide {
  width: 100%;
}

.ai-coach-line--mid {
  width: 72%;
}

@keyframes ai-skel-shimmer {
  0% {
    opacity: 0.45;
  }
  50% {
    opacity: 0.85;
  }
  100% {
    opacity: 0.45;
  }
}

.reinforce-panel {
  margin-top: 10px;
  border: 1px dashed rgba(27, 46, 94, 0.24);
  border-radius: 12px;
  padding: 10px;
  background: #f8fbff;
}

.reinforce-entry__title {
  margin: 0;
  font-size: 0.86rem;
  color: #1b2e5e;
  font-weight: 700;
}

.reinforce-entry__hint {
  margin: 5px 0 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.reinforce-entry__actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.reinforce-question__prompt {
  margin: 0;
  color: #1a1a2a;
  font-size: 0.84rem;
  line-height: 1.45;
  font-weight: 600;
}

.reinforce-options {
  margin-top: 8px;
  display: grid;
  gap: 6px;
}

.reinforce-option {
  border: 1px solid rgba(27, 46, 94, 0.2);
  background: #ffffff;
  color: #1b2e5e;
  border-radius: 10px;
  text-align: left;
  padding: 8px 10px;
  font-size: 0.82rem;
  cursor: pointer;
}

.reinforce-option:hover,
.reinforce-option:focus-visible {
  border-color: #1b2e5e;
  background: #eef2ff;
}

.reinforce-option--picked {
  border-color: #1b2e5e;
  background: #eef2ff;
  font-weight: 700;
}

.reinforce-feedback {
  margin: 8px 0 0;
  font-size: 0.8rem;
  line-height: 1.45;
}

.reinforce-feedback--ok {
  color: #166534;
}

.reinforce-feedback--warn {
  color: #92400e;
}

.text-btn {
  margin-top: 8px;
  border: 0;
  background: transparent;
  color: #1b2e5e;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0;
}

.reinforce-skip-note {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.reinforce-skip-note--done {
  color: #166534;
  font-weight: 600;
}

.outcome-panel {
  margin-top: 8px;
  border-radius: 10px;
  border: 1px solid rgba(22, 163, 74, 0.35);
  background: #ecfdf5;
  padding: 8px 10px;
}

.outcome-panel--high {
  border-color: rgba(220, 38, 38, 0.35);
  background: #fef2f2;
}

.detected {
  margin-top: 10px;
  border: 1px solid rgba(16, 185, 129, 0.4);
  background: #ecfdf5;
  border-radius: 10px;
  padding: 8px 10px;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.22s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.sim-shell-fade-enter-active,
.sim-shell-fade-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.sim-shell-fade-enter-from,
.sim-shell-fade-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.995);
}
@keyframes tiny-shake {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  50% {
    transform: translateX(2px);
  }
  100% {
    transform: translateX(0);
  }
}
/* ── Collapsible summary panels ── */
.summary-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  text-align: left;
}

.summary-toggle--ai {
  width: 100%;
}

.ai-toggle-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.toggle-chevron {
  font-size: 1.1rem;
  color: #6b7280;
  font-weight: 700;
  line-height: 1;
  transform: rotate(90deg);
  transition: transform 0.25s ease;
  display: inline-block;
  flex-shrink: 0;
}

.toggle-chevron--open {
  transform: rotate(-90deg);
}

.toggle-chevron--ai {
  color: #6366f1;
}

.summary-body {
  overflow: hidden;
  max-height: 600px;
  opacity: 1;
  transition:
    max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.25s ease;
  margin-top: 8px;
}

.summary-body--collapsed {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
}

.fs-transition-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.fs-transition-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  animation: fs-dot-bounce 0.9s ease-in-out infinite;
}

.fs-transition-dot:nth-child(2) {
  animation-delay: 0.15s;
}
.fs-transition-dot:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes fs-dot-bounce {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

.fs-overlay-enter-active {
  transition: opacity 0.2s ease;
}
.fs-overlay-leave-active {
  transition: opacity 0.3s ease;
}
.fs-overlay-enter-from,
.fs-overlay-leave-to {
  opacity: 0;
}

/* ── Fullscreen shell ── */
.fullscreen-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(6px);
  border-radius: 10px;
  margin-bottom: 10px;
}

.fullscreen-bar__label {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.fullscreen-bar__exit {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.fullscreen-bar__exit:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sim--fullscreen {
  max-width: 100%;
  background: var(--navy);
  padding: 12px 18px 18px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.sim--fullscreen .sim-card {
  flex: 1;
  min-height: 0;
  max-height: calc(100vh - 80px);
  overflow: hidden;
  width: 100%;
}

/* In fullscreen, keep image to a bounded height so image + dialogue both fit */
.sim--fullscreen .scene-image-wrap {
  max-height: min(56vh, 540px);
  flex: 0 0 auto;
}
.sim--fullscreen .scene-image-wrap--walkthrough {
  max-height: min(48vh, 500px);
}

.sim--fullscreen .finale-pane--image-only .finale-card {
  min-height: min(52vh, 520px);
  max-height: min(58vh, 640px);
}

.sim--fullscreen .finale-pane--image-only .finale-image {
  max-height: min(54vh, 600px);
}

.sim-wrapper {
  overflow-x: hidden;
  width: 100%;
  max-width: 100%;
}

.sim {
  max-width: 100%;
  overflow-x: hidden;
}

@media (max-width: 767px) {
  .sim-card--intro {
    grid-template-columns: minmax(0, 1fr);
    min-height: auto;
    align-items: start;
  }

  .sim-card--intro .intro-visual {
    display: none;
  }

  .sim-card--intro .sim-copy--intro {
    padding: 28px 22px 24px;
    gap: 20px;
  }

  .sim-card--intro .sim-meta {
    font-size: 1.125rem;
    line-height: 1.35;
  }

  .sim-card--intro .progress-line {
    margin: 0;
  }

  .intro-meet-head {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 0;
  }

  .intro-meet-head__art {
    display: block;
    flex: 0 0 auto;
    width: 96px;
  }

  .intro-meet-head__img {
    display: block;
    width: 96px;
    max-width: 110px;
    height: auto;
    max-height: 110px;
    object-fit: contain;
  }

  .intro-meet-head__title {
    margin: 0;
    flex: 1 1 auto;
    min-width: 0;
    font-size: 1.3125rem;
    line-height: 1.28;
  }

  .sim-card--intro .intro-lead {
    margin: 0;
    font-size: 1rem;
    line-height: 1.45;
    color: var(--text-main);
  }

  .sim-card--intro .intro-lead__full {
    display: none;
  }

  .sim-card--intro .intro-lead__short {
    display: block;
  }

  .sim-card--intro .thinking-card {
    padding: 17px;
    gap: 10px;
  }

  .sim-card--intro .thinking-card__label {
    font-size: 0.8125rem;
  }

  .sim-card--intro .thinking-card__line--desktop {
    display: none;
  }

  .sim-card--intro .thinking-card__line--mobile {
    display: block;
    margin: 0;
    font-size: 1rem;
    line-height: 1.48;
  }

  .sim-card--intro .actions {
    flex-direction: column;
    flex-wrap: nowrap;
    width: 100%;
    gap: 10px;
    margin-top: 2px;
  }

  .sim-card--intro .primary,
  .sim-card--intro .secondary {
    width: 100%;
    flex: none;
    justify-content: center;
    font-size: 1rem;
    line-height: 1.35;
    padding: 11px 16px;
    min-height: 0;
  }

  .sim-wrapper {
    box-sizing: border-box;
    margin-inline: auto;
    max-height: min(100dvh, 1000px);
    max-width: 100%;
    overflow-x: clip;
    overflow-y: auto;
    padding-inline: 12px;
    width: 100%;
  }

  .sim {
    max-width: 100%;
    overflow-x: clip;
  }

  .sim-card--walkthrough,
  .sim-card--finale {
    box-sizing: border-box;
    grid-template-columns: minmax(0, 1fr);
    margin-inline: 0;
    max-height: none;
    max-width: 100%;
    min-height: auto;
    overflow-x: clip;
    width: 100%;
    background: #fcf7f1;
    border-color: #e3d7c8;
    box-shadow: none;
  }

  .wt-stage-context--desktop {
    display: none;
  }

  .wt-stage-context--mobile {
    display: block;
  }

  .scene-stage-lead--desktop {
    display: none;
  }

  .wt-stage-lead--stack {
    display: block;
    margin: 0;
    font-size: 0.84rem;
    line-height: 1.45;
  }

  .sim-card--walkthrough > *,
  .sim-card--finale > * {
    box-sizing: border-box;
    max-width: 100%;
    min-width: 0;
    width: 100%;
  }

  .sim-card--walkthrough .sim-visual--walkthrough {
    display: none;
  }

  .sim-card--walkthrough {
    display: flex;
    flex-direction: column;
  }

  .sim-card--walkthrough .sim-copy--scene {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    overflow-x: clip;
    padding-inline: 12px;
    width: 100%;
    max-width: 100%;
  }

  .sim-card--finale .sim-copy--final {
    overflow-x: clip;
    padding-inline: 12px;
  }

  .finale-celebration,
  .finale-next-chips,
  .choices--scene,
  .stage-context-panel,
  .wt-conversation-card {
    max-width: 100%;
    min-width: 0;
  }

  .sim-card--walkthrough .wt-stage-mobile-stack {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    width: 100%;
    min-width: 0;
  }

  .sim-card--walkthrough .scene-head--mobile {
    display: grid;
    gap: 6px;
    width: 100%;
  }

  .sim-card--finale .finale-header {
    gap: 10px;
    padding-bottom: 10px;
  }

  .sim-card--finale .finale-header__art {
    max-width: 120px;
  }

  .sim-card--finale .finale-header__img {
    max-height: 120px;
    max-width: 120px;
  }

  .sim-card--finale .sim-copy--final {
    padding: 14px 14px 16px;
  }

  .sim-card--walkthrough .scene-stage-title--mobile,
  .sim-card--walkthrough .scene-stage-lead--mobile,
  .sim-card--walkthrough .wt-scene-mobile-figure,
  .sim-card--walkthrough .wt-mobile-convo,
  .sim-card--walkthrough .risk-signal,
  .sim-card--walkthrough .thinking-strip,
  .sim-card--walkthrough .choices-prompt,
  .sim-card--walkthrough .choices--scene,
  .sim-card--walkthrough .coach-note {
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .sim-card--walkthrough .scene-stage-title--mobile {
    display: block;
    margin: 0;
    font-size: 1.2rem;
    line-height: 1.28;
    color: #1b2e5e;
    width: 100%;
  }

  .sim-card--walkthrough .scene-stage-lead--mobile {
    display: block;
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.45;
    color: #2b2b2b;
    width: 100%;
    max-width: none;
  }

  .sim-card--walkthrough .wt-scene-mobile-figure {
    align-items: center;
    background: transparent;
    border: 0;
    display: flex;
    justify-content: center;
    margin: 0;
    min-height: 0;
    padding: 0;
    width: 100%;
  }

  .sim-card--walkthrough .wt-scene-mobile-figure__img {
    display: block;
    height: auto;
    max-height: 200px;
    max-width: min(100%, 240px);
    object-fit: contain;
    object-position: center center;
    width: auto;
  }

  .sim-card--walkthrough .scene-head--desktop,
  .sim-card--walkthrough .scene-stage-title--desktop,
  .sim-card--walkthrough .scene-stage-lead--desktop {
    display: none;
  }

  .sim-card--walkthrough .sim-copy--scene {
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: visible;
    padding: 14px;
    background: #fffbf7;
  }

  .sim-card--walkthrough .sim-meta {
    font-size: 0.78rem;
    color: #1b2e5e;
  }

  .sim-card--finale .outcome-section--coach,
  .sim-card--finale .coach-unified-stack,
  .sim-card--finale .summary-panel {
    box-sizing: border-box;
    max-width: 100%;
    min-width: 0;
    width: 100%;
  }

  .sim-card--finale .summary-body--ai-open {
    max-height: none;
    overflow: visible;
  }

  .sim-card--walkthrough .wt-mobile-convo {
    display: block;
    margin: 0;
    width: 100%;
  }

  .sim-card--walkthrough .wt-conversation-card--mobile {
    border: 1px solid #e3d7c8;
    background: #f4ede0;
    padding: 8px;
    border-radius: 10px;
    box-shadow: none;
  }

  .sim-card--walkthrough .phone-thread--compact {
    gap: 5px;
  }

  .sim-card--walkthrough .phone-thread--compact .bubble {
    box-sizing: border-box;
    margin: 0;
    max-width: 85%;
    overflow-wrap: break-word;
    padding: 6px 9px;
    font-size: 0.72rem;
    line-height: 1.35;
    white-space: normal;
    word-break: break-word;
  }

  .sim-card--walkthrough .bubble--alex {
    justify-self: end;
    max-width: 85%;
  }

  .sim-card--walkthrough .bubble--scammer {
    max-width: 85%;
  }

  .sim-card--walkthrough .risk-signal--editorial {
    box-sizing: border-box;
    overflow: visible;
    gap: 4px;
    padding: 10px 12px;
    border-radius: 10px;
    border-color: #e3d7c8;
    border-left-color: #d0312d;
    background: #f4ede0;
    box-shadow: none;
  }

  .sim-card--walkthrough .risk-signal__kicker {
    display: block;
    margin: 0;
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6b7280;
  }

  .sim-card--walkthrough .risk-signal__tag--desktop,
  .sim-card--walkthrough .risk-signal__reason--desktop {
    display: none;
  }

  .sim-card--walkthrough .risk-signal__tag--mobile {
    align-items: flex-start;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    font-size: 0.9rem;
    font-weight: 800;
    color: #1b2e5e;
    white-space: normal;
  }

  .sim-card--walkthrough .risk-signal__glyph {
    color: #d0312d;
  }

  .sim-card--walkthrough .risk-signal__reason--mobile {
    display: block;
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.4;
    color: #2b2b2b;
    overflow: visible;
    overflow-wrap: break-word;
    white-space: normal;
    word-break: break-word;
  }

  .sim-card--walkthrough .thinking-strip {
    padding: 8px 10px;
    gap: 4px;
    border-radius: 10px;
    border-color: #e3d7c8;
    background: #f4ede0;
  }

  .sim-card--walkthrough .thinking-strip__line--desktop {
    display: none;
  }

  .sim-card--walkthrough .thinking-strip__line--mobile {
    display: block;
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.4;
    color: #1b2e5e;
    -webkit-line-clamp: unset;
    line-clamp: unset;
    overflow: visible;
  }

  .sim-card--walkthrough .choices-prompt {
    margin: 0;
    font-size: 0.65rem;
    width: 100%;
  }

  .sim-card--walkthrough .choices--scene {
    width: 100%;
    gap: 8px;
  }

  .sim-card--walkthrough .choice {
    box-sizing: border-box;
    max-width: 100%;
    overflow-wrap: break-word;
    padding: 11px 14px;
    border-radius: 10px;
    font-size: 0.9rem;
    line-height: 1.35;
    white-space: normal;
    width: 100%;
    word-break: break-word;
  }

  .sim-card--walkthrough .choice-title {
    font-size: 0.9rem;
    line-height: 1.35;
    white-space: normal;
  }
}

@media (max-width: 480px) {
  .sim-card {
    min-height: auto;
    border-radius: 14px;
  }

  .wt-block {
    padding: 8px 10px;
  }

  .wt-label {
    font-size: 0.62rem;
  }

  .scene-stage-title {
    font-size: 1rem;
  }

  .scene-stage-lead,
  .thinking-strip__line,
  .coach-note__explain {
    font-size: 0.8rem;
  }

  .choice {
    padding: 10px;
  }

  .choice-title {
    font-size: 0.82rem;
  }

  .coach-note {
    padding: 10px;
  }

  .recap-scroll-viewport {
    height: 100px;
  }

  .primary,
  .secondary {
    flex: 1 1 100%;
    font-size: 0.82rem;
    padding: 9px 10px;
  }
}
</style>
