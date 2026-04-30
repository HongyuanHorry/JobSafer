<template>
  <section class="sim" aria-live="polite">
    <Transition name="sim-shell-fade" mode="out-in">
      <article :key="`stage-${stage}`" class="sim-card">
        <template v-if="stage === 0">
          <div class="sim-visual">
            <img class="sim-image" src="/icons/image1.png" alt="Alex base character" />
          </div>

          <div class="sim-copy sim-copy--intro">
            <p class="sim-meta">{{ scenario.title }} · Stage {{ stageLabel }}/5</p>
            <div
              class="stage-track"
              role="progressbar"
              :aria-valuenow="Math.min(stage, 5)"
              aria-valuemin="0"
              aria-valuemax="5"
            >
              <span
                v-for="dot in 5"
                :key="`dot-${dot}`"
                class="track-dot"
                :class="{ 'track-dot--done': dot <= stage, 'track-dot--now': dot === stage }"
              ></span>
            </div>
            <h4>Meet Alex</h4>
            <p class="lead">Quick chat-style intro before we enter the scam flow.</p>

            <div class="voice-note-stack" aria-label="Alex voice notes">
              <p class="alex-speaks-tag">Alex says:</p>
              <div class="alex-speech-block">
                <p
                  v-for="(line, idx) in scenario.introAlex"
                  :key="`intro-${idx}`"
                  class="voice-note__text"
                >
                  {{ line }}
                </p>
              </div>
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
          <div class="sim-visual">
            <img class="sim-image" :src="stageImage" :alt="`Alex stage ${stage}`" />

            <div class="phone-mock">
              <div class="phone-top"></div>
              <div class="phone-thread">
                <p
                  v-for="(line, idx) in currentStage.scammerThread || [currentStage.scammerLine]"
                  :key="`scammer-${stage}-${idx}`"
                  class="bubble bubble--scammer bubble--tail-left phone-bubble"
                >
                  {{ line }}
                </p>
                <p
                  v-if="currentStage.phoneReply"
                  class="bubble bubble--phone-self bubble--tail-right phone-bubble"
                >
                  {{ currentStage.phoneReply }}
                </p>
              </div>
            </div>
          </div>

          <div class="sim-copy" :class="{ 'sim-copy--danger': picked === 'risk' }">
            <p class="sim-meta">{{ scenario.title }} · Stage {{ stageLabel }}/5</p>
            <div
              class="stage-track"
              role="progressbar"
              :aria-valuenow="Math.min(stage, 5)"
              aria-valuemin="0"
              aria-valuemax="5"
            >
              <span
                v-for="dot in 5"
                :key="`dot-${dot}`"
                class="track-dot"
                :class="{ 'track-dot--done': dot <= stage, 'track-dot--now': dot === stage }"
              ></span>
            </div>
            <h4>{{ scenario.stages[stage - 1].title }}</h4>
            <p>{{ scenario.stages[stage - 1].text }}</p>

            <div class="voice-note-stack voice-note-stack--stage">
              <p class="alex-speaks-tag">Alex says:</p>
              <div class="alex-speech-block">
                <p
                  v-for="(line, idx) in scenario.stages[stage - 1].alexTalk"
                  :key="`alex-${stage}-${idx}`"
                  class="voice-note__text"
                >
                  {{ line }}
                </p>
              </div>
            </div>

            <div class="emotion-meter">
              <span>Pressure level</span>
              <div class="meter">
                <i :style="{ width: `${pressurePercent}%` }"></i>
              </div>
              <p class="pressure-feedback" :class="`pressure-feedback--${pressureBand}`">
                {{ pressureFeedback }}
              </p>
            </div>

            <div v-if="!picked" class="choices">
              <button class="choice safe" type="button" @click="pick('safe')">
                ✅ {{ scenario.stages[stage - 1].safeOption }}
              </button>
              <button class="choice risk" type="button" @click="pick('risk')">
                ⚠️ {{ scenario.stages[stage - 1].riskOption }}
              </button>
            </div>

            <p class="sound-hint">🔊 A short sound cue plays after each choice.</p>

            <div v-if="picked" class="coach-note" :class="{ danger: picked === 'risk' }">
              <p>
                {{
                  picked === 'safe'
                    ? scenario.stages[stage - 1].safeNote
                    : scenario.stages[stage - 1].riskNote
                }}
              </p>

              <div class="actions">
                <button class="primary" type="button" @click="nextStage">Continue →</button>
                <button class="secondary" type="button" @click="$emit('exit')">
                  Back to choose another scam type
                </button>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="sim-visual finale-pane">
            <figure class="finale-card">
              <img class="sim-image finale-image" :src="finalOutcomeImage" :alt="finalOutcomeAlt" />
            </figure>
          </div>

          <div class="sim-copy">
            <p class="sim-meta">{{ scenario.title }} · Stage 5/5</p>
            <div
              class="stage-track"
              role="progressbar"
              aria-valuenow="5"
              aria-valuemin="0"
              aria-valuemax="5"
            >
              <span
                v-for="dot in 5"
                :key="`dot-final-${dot}`"
                class="track-dot track-dot--done"
                :class="{ 'track-dot--now': dot === 5 }"
              ></span>
            </div>
            <h4>{{ finalOutcomeTitle }}</h4>
            <div class="outcome-panel" :class="{ 'outcome-panel--high': isHighPressureOutcome }">
              <p v-if="isHighPressureOutcome">
                Your choices show a high-pressure path. This is when scammers usually extract extra
                payments and identity details.
              </p>
              <p v-else>
                Your choices kept pressure low. You identified the script before major loss and
                stayed in control.
              </p>
            </div>
            <div class="recap-grid">
              <button type="button" class="recap-step">1️⃣ Fake trust-building</button>
              <button type="button" class="recap-step">2️⃣ Fake balance display</button>
              <button type="button" class="recap-step">3️⃣ Fee extraction</button>
              <button type="button" class="recap-step">4️⃣ Urgency threats</button>
            </div>
            <p class="recap-note">
              Your anti-scam rhythm:
              <strong>pause → verify independently → never pay to unlock earnings</strong>.
            </p>

            <div v-if="isHighPressureOutcome" class="consequence-panel">
              <p class="consequence-panel__title">If pressure stays high, what can happen next</p>
              <p class="consequence-panel__source">
                Based on reported task-scam patterns (ABC News, 26 Jul 2025) and Scamwatch warning
                signals.
              </p>
              <ul>
                <li>Within 24 hours: fake earnings dashboard creates urgency to "keep going".</li>
                <li>
                  24-48 hours: first "unlock" payment appears (often framed as
                  verification/compliance fee), commonly starting around A$50.
                </li>
                <li>
                  48-72 hours: repeated payment requests (for example A$300, then A$1,000+) and
                  legal-style threats escalate total losses into the thousands.
                </li>
                <li>
                  After payment: some victims are pushed to share ID, increasing long-term
                  identity-fraud risk.
                </li>
              </ul>
            </div>

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
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { SCAM_SIMULATION_SCENARIOS } from '../constants/scamSimulationScenarios'

const props = defineProps({
  scenarioType: { type: String, default: 'task_based' },
  detectedLabel: { type: String, default: '' },
  detectedTone: { type: String, default: '' },
  showDetectedResult: { type: Boolean, default: false },
})

defineEmits(['restart', 'exit'])

const stage = ref(0)
const picked = ref('')
const riskCount = ref(0)

const scenario = computed(
  () => SCAM_SIMULATION_SCENARIOS[props.scenarioType] || SCAM_SIMULATION_SCENARIOS.task_based,
)
const stageLabel = computed(() => Math.min(5, Math.max(1, stage.value)))
const currentStage = computed(() => scenario.value.stages[Math.max(0, stage.value - 1)] || {})

const pressurePercent = computed(() => {
  const base = stage.value <= 0 ? 12 : 20 + stage.value * 11
  const riskBoost = riskCount.value * 12
  const instantBoost = picked.value === 'risk' ? 8 : 0
  return Math.min(100, base + riskBoost + instantBoost)
})

const pressureBand = computed(() => {
  if (pressurePercent.value < 55) return 'low'
  if (pressurePercent.value < 78) return 'medium'
  return 'high'
})

const pressureFeedback = computed(() => {
  if (pressureBand.value === 'low') {
    return 'Low pressure: you are still thinking clearly and controlling pace.'
  }
  if (pressureBand.value === 'medium') {
    return 'Medium pressure: this is where many people start making rushed decisions.'
  }
  return 'High pressure: emotional manipulation is active. Pause and exit the chat flow.'
})

const isHighPressureOutcome = computed(() => riskCount.value >= 4)
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
    ? 'High-pressure path detected — fake balance and coercion are now clear.'
    : 'Low-pressure path maintained — you interrupted the scam script early.',
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
  picked.value = type
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

function nextStage() {
  picked.value = ''
  stage.value += 1
}

watch(
  () => props.scenarioType,
  () => {
    stage.value = 0
    picked.value = ''
    riskCount.value = 0
  },
)
</script>

<style scoped>
.sim {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}
.sim-meta {
  margin: 0;
  color: #6b7280;
  font-size: 0.85rem;
  font-weight: 600;
}
.stage-track {
  display: flex;
  gap: 7px;
  margin-bottom: 4px;
}
.track-dot {
  width: 26px;
  height: 6px;
  border-radius: 999px;
  background: #dfe7ff;
}
.track-dot--done {
  background: #4f46e5;
}
.track-dot--now {
  transform: scale(1.08);
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

.sim-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  background: #fff;
  border: 1px solid rgba(27, 46, 94, 0.08);
  border-radius: 18px;
  padding: 14px;
  min-height: clamp(520px, 66vh, 690px);
  background: linear-gradient(90deg, #f8fbff 0 50%, #ffffff 50% 100%);
  box-shadow: 0 10px 24px rgba(27, 46, 94, 0.06);
  align-items: start;
}
.sim-visual {
  border-radius: 12px;
  background: transparent;
  border: 1px solid rgba(27, 46, 94, 0.08);
  padding: 6px;
  min-height: 100%;
  display: grid;
  align-content: start;
  gap: 10px;
}
.sim-image {
  width: 100%;
  height: auto;
  max-height: 500px;
  object-fit: contain;
  border-radius: 10px;
  display: block;
  margin: 0 auto;
}

.lead {
  margin: 0 0 8px;
}

.voice-note-stack {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}

.voice-note-stack--stage {
  margin-top: 10px;
}

.alex-speaks-tag {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  color: #1b2e5e;
}

.alex-speech-block {
  display: grid;
  gap: 6px;
  background: linear-gradient(120deg, #eef4ff, #dde8ff);
  border: 1px solid rgba(27, 46, 94, 0.14);
  border-radius: 12px;
  padding: 9px 10px;
}

.voice-note__text {
  margin: 0;
  color: #1f2937;
  font-size: 0.84rem;
  line-height: 1.45;
}

.bubble {
  margin: 0;
  border-radius: 12px;
  padding: 8px 10px;
  font-size: 0.82rem;
  line-height: 1.42;
  position: relative;
}
.bubble--alex {
  background: #e7efff;
  justify-self: end;
  max-width: 95%;
}
.bubble--scammer {
  background: #fee2e2;
  max-width: 95%;
}

.phone-mock {
  margin-top: 8px;
  border: 1px solid rgba(27, 46, 94, 0.18);
  border-radius: 16px;
  background: #fff;
  padding: 8px;
}

.phone-thread {
  display: grid;
  gap: 6px;
}

.phone-bubble {
  font-size: 0.79rem;
  line-height: 1.38;
}

.bubble--phone-self {
  background: #e7efff;
  justify-self: end;
  max-width: 95%;
}

.bubble--tail-left::after {
  content: '';
  position: absolute;
  left: -6px;
  bottom: 9px;
  width: 11px;
  height: 11px;
  background: inherit;
  transform: rotate(45deg);
  border-radius: 2px;
}

.bubble--tail-right::after {
  content: '';
  position: absolute;
  right: -6px;
  bottom: 9px;
  width: 11px;
  height: 11px;
  background: inherit;
  transform: rotate(45deg);
  border-radius: 2px;
}

.phone-top {
  width: 44px;
  height: 4px;
  border-radius: 999px;
  background: #c7d2fe;
  margin: 0 auto 8px;
}

.sim-copy h4 {
  margin: 0 0 6px;
  color: #1b2e5e;
  font-size: 1.2rem;
}
.sim-copy {
  min-height: 100%;
  display: grid;
  align-content: start;
  gap: 8px;
}

.sim-copy--intro {
  gap: 10px;
}
.sim-copy p {
  margin: 0;
  color: #374151;
}
.sim-copy--danger {
  animation: tiny-shake 0.2s linear;
}

.emotion-meter {
  margin-top: 10px;
  display: grid;
  gap: 6px;
}
.emotion-meter span {
  font-size: 0.78rem;
  color: #6b7280;
}
.sound-hint {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 0.76rem;
}
.meter {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: #eceff8;
  overflow: hidden;
}
.meter i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #f59e0b, #ef4444);
  transition: width 0.3s ease;
}

.pressure-feedback {
  font-size: 0.79rem;
  font-weight: 600;
}

.pressure-feedback--low {
  color: #166534;
}

.pressure-feedback--medium {
  color: #b45309;
}

.pressure-feedback--high {
  color: #b91c1c;
}

.choices,
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.choice {
  border-radius: 10px;
  padding: 9px 12px;
  border: 1px solid;
  font-weight: 700;
  cursor: pointer;
}
.choice.safe {
  border-color: rgba(34, 197, 94, 0.4);
  color: #166534;
  background: #f0fdf4;
}
.choice.risk {
  border-color: rgba(239, 68, 68, 0.4);
  color: #991b1b;
  background: #fef2f2;
}

.coach-note {
  margin-top: 10px;
  background: #eef4ff;
  border-left: 3px solid #1b2e5e;
  border-radius: 10px;
  padding: 10px;
}
.coach-note.danger {
  background: #fff3f3;
  border-left-color: #ef4444;
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
  display: grid;
}

.finale-card {
  margin: 0;
  border: 0;
  border-radius: 12px;
  padding: 0;
  background: transparent;
}
.finale-image {
  height: 360px;
  max-height: 360px;
}

.recap-grid {
  margin-top: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.recap-step {
  border: 1px solid rgba(27, 46, 94, 0.16);
  background: #f7f9ff;
  color: #1b2e5e;
  border-radius: 10px;
  padding: 8px;
  text-align: left;
  font-weight: 700;
}
.recap-note {
  margin-top: 8px;
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

.consequence-panel {
  margin-top: 10px;
  border: 1px solid rgba(220, 38, 38, 0.28);
  border-radius: 10px;
  background: #fff5f5;
  padding: 10px;
}

.consequence-panel__title {
  font-weight: 700;
  color: #991b1b;
}

.consequence-panel__source {
  margin-top: 5px;
  color: #6b7280;
  font-size: 0.76rem;
}

.consequence-panel ul {
  margin: 8px 0 0;
  padding-left: 18px;
  display: grid;
  gap: 6px;
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
@media (max-width: 860px) {
  .sim-card {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .recap-grid {
    grid-template-columns: 1fr;
  }
}
</style>
