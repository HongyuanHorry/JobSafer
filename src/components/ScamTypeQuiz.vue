<template>
  <section class="quiz-card" :class="{ 'quiz-card--fullscreen': isFullscreen }" aria-live="polite" ref="quizRef">
    <Transition name="fs-overlay">
      <div v-if="isTransitioning" class="fs-transition-overlay" aria-hidden="true">
        <span class="fs-dot"></span>
        <span class="fs-dot"></span>
        <span class="fs-dot"></span>
      </div>
    </Transition>
    <div v-if="isFullscreen" class="quiz-fs-bar">
      <span class="quiz-fs-label">🔒 Fullscreen mode</span>
      <button class="quiz-fs-exit" type="button" @click="exitFullscreen">✕ Exit</button>
    </div>
    <header class="quiz-header">
      <p class="quiz-eyebrow">Scam Type Finder</p>
      <h3>Which scam style are you most vulnerable to?</h3>
      <p class="quiz-copy">
        Answer a few quick scenarios. We will surface the scam type that best matches your
        responses.
      </p>
    </header>

    <div class="quiz-progress">
      <span v-if="!showResult">Question {{ safeIndex }} / {{ questions.length }}</span>
      <span v-else>Results</span>
      <div class="progress-bar"><span :style="{ width: `${progressPct}%` }"></span></div>
    </div>

    <div v-if="!showResult" class="quiz-body">
      <p class="quiz-question">{{ current.prompt }}</p>
      <div class="quiz-options">
        <button
          v-for="(opt, idx) in current.options"
          :key="idx"
          :class="['quiz-option', { 'quiz-option--selected': selectedIndex === idx }]"
          type="button"
          :disabled="selectedIndex !== null"
          @click="choose(opt, idx)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <div v-if="showResult" class="quiz-result" aria-live="polite">
      <p class="result-title">Most likely target: {{ resultLabel }}</p>
      <p class="result-copy">{{ resultTone }}</p>
      <div class="result-grid">
        <div v-for="(score, key) in sortedScores" :key="key" class="result-row">
          <span class="result-key">{{ score.label }}</span>
          <div class="result-bar"><span :style="{ width: `${score.pct}%` }"></span></div>
          <span class="result-pct">{{ score.pct }}%</span>
        </div>
      </div>
      <div class="result-actions">
        <button class="quiz-reset" type="button" @click="reset">Retake quiz</button>
        <button class="quiz-continue" type="button" @click="emitResult">Use this type</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { scamTypeMeta } from '../constants/scamSimulationData'

const emit = defineEmits(['complete'])

const quizRef = ref(null)
const isFullscreen = ref(false)
const isTransitioning = ref(false)
let savedScrollY = 0

function enterFullscreen() {
  const el = quizRef.value
  if (!el?.requestFullscreen) return
  savedScrollY = window.scrollY
  isTransitioning.value = true
  const onFsChange = () => {
    isTransitioning.value = false
    document.removeEventListener('fullscreenchange', onFsChange)
  }
  document.addEventListener('fullscreenchange', onFsChange)
  setTimeout(() => el.requestFullscreen().catch(() => { isTransitioning.value = false }), 80)
  setTimeout(() => { isTransitioning.value = false }, 900)
}

function exitFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
}

function handleFsChange() {
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
  document.addEventListener('fullscreenchange', handleFsChange)
  isFullscreen.value = !!document.fullscreenElement
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFsChange)
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
})

const questions = [
  {
    prompt:
      'A recruiter asks you to click a login link to confirm your interview slot. What do you do?',
    options: [
      { label: 'Click quickly so I do not lose the slot', weights: { phishing: 2 } },
      { label: 'Open the company site directly and verify', weights: { identity_scam: 1 } },
      { label: 'Ask for proof of the recruiter role', weights: { financial_fraud: 1 } },
      { label: 'Ignore the link and request a phone call', weights: { investment: 1 } },
    ],
  },
  {
    prompt: 'You see a dashboard that shows fast earnings after small tasks. How does it feel?',
    options: [
      { label: 'Encouraging, I would try a few tasks', weights: { task_based: 2 } },
      { label: 'Suspicious, I would ask how withdrawal works', weights: { task_based: 1 } },
      { label: 'I would verify the company and stop', weights: { identity_scam: 1 } },
      { label: 'I would ask if the earnings are guaranteed', weights: { investment: 1 } },
    ],
  },
  {
    prompt: 'A message says payroll is delayed unless a small processing fee is paid today.',
    options: [
      { label: 'Pay quickly so I do not lose the job', weights: { financial_fraud: 2 } },
      { label: 'Ask for an official invoice and wait', weights: { financial_fraud: 1 } },
      { label: 'Contact the company by phone first', weights: { phishing: 1 } },
      { label: 'Ignore and report the message', weights: { investment: 1 } },
    ],
  },
  {
    prompt: 'They request a passport scan to proceed. What is your first instinct?',
    options: [
      { label: 'Send it so things move faster', weights: { identity_scam: 2 } },
      { label: 'Ask for a secure upload portal', weights: { identity_scam: 1 } },
      { label: 'Delay until you receive a contract', weights: { financial_fraud: 1 } },
      { label: 'Refuse and verify the employer', weights: { phishing: 1 } },
    ],
  },
  {
    prompt: 'You are offered a guaranteed weekly return on a side investment.',
    options: [
      { label: 'I would consider it if the numbers look good', weights: { investment: 2 } },
      { label: 'I would ask about regulation or licensing', weights: { investment: 1 } },
      { label: 'I would compare to market averages first', weights: { financial_fraud: 1 } },
      { label: 'I would assume it is too good to be true', weights: { phishing: 1 } },
    ],
  },
]

const currentIndex = ref(0)
const selectedIndex = ref(null)
const scores = ref({
  phishing: 0,
  financial_fraud: 0,
  task_based: 0,
  identity_scam: 0,
  investment: 0,
})

const current = computed(() => questions[Math.min(currentIndex.value, questions.length - 1)])
const safeIndex = computed(() => Math.min(currentIndex.value + 1, questions.length))
const progressPct = computed(() => (safeIndex.value / questions.length) * 100)

const topType = computed(() => {
  const entries = Object.entries(scores.value)
  entries.sort((a, b) => b[1] - a[1])
  return entries[0]?.[0] || 'task_based'
})

const showResult = computed(() => currentIndex.value >= questions.length)

const resultLabel = computed(() => scamTypeMeta[topType.value]?.label || 'Task-Based Scam')
const resultTone = computed(() => scamTypeMeta[topType.value]?.tone || '')

const sortedScores = computed(() => {
  const total = Object.values(scores.value).reduce((sum, v) => sum + v, 0) || 1
  return Object.entries(scores.value)
    .map(([key, value]) => ({
      key,
      label: scamTypeMeta[key]?.label || key,
      pct: Math.round((value / total) * 100),
    }))
    .sort((a, b) => b.pct - a.pct)
})

function choose(option, index) {
  if (selectedIndex.value !== null) return
  selectedIndex.value = index
  Object.entries(option.weights || {}).forEach(([key, value]) => {
    scores.value[key] = (scores.value[key] || 0) + value
  })

  window.setTimeout(() => {
    if (currentIndex.value < questions.length) {
      currentIndex.value += 1
    }
    selectedIndex.value = null
  }, 180)
}

function emitResult() {
  emit('complete', { type: topType.value, scores: { ...scores.value } })
}

function reset() {
  currentIndex.value = 0
  scores.value = {
    phishing: 0,
    financial_fraud: 0,
    task_based: 0,
    identity_scam: 0,
    investment: 0,
  }
}
</script>

<style scoped>
.quiz-card {
  background: #FCF7F1;
  border-radius: 24px;
  border: 1px solid #E3D7C8;
  border-left: 4px solid #D8A24A;
  padding: 28px 26px;
  display: grid;
  gap: 22px;
  box-shadow: 0 12px 28px rgba(27, 46, 94, 0.1);
  animation: floatIn 0.5s ease;
}

.quiz-header h3 {
  margin: 10px 0 8px;
  color: #1B2E5E;
  font-size: clamp(1.25rem, 2.5vw, 1.6rem);
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.quiz-eyebrow {
  margin: 0;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.13em;
  color: #3B6F8F;
  font-weight: 800;
}

.quiz-copy {
  margin: 0;
  color: #5a5a5a;
  font-size: 1rem;
  line-height: 1.55;
}

.quiz-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #1B2E5E;
  font-weight: 700;
  font-size: 0.95rem;
}

.progress-bar {
  height: 8px;
  background: #E3D7C8;
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #1B2E5E 0%, #3B6F8F 50%, #D8A24A 100%);
  border-radius: inherit;
  transition: width 0.4s ease;
}

.quiz-question {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1B2E5E;
  line-height: 1.45;
  margin: 0 0 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid #E3D7C8;
}

.quiz-options {
  display: grid;
  gap: 12px;
}

.quiz-option {
  border: 1px solid #E3D7C8;
  border-radius: 16px;
  background: #F4EDE0;
  color: #1B2E5E;
  font-size: 1rem;
  padding: 16px 18px;
  text-align: left;
  font-weight: 600;
  line-height: 1.45;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(27, 46, 94, 0.05);
  position: relative;
  overflow: hidden;
  transition:
    box-shadow 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.quiz-option::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #1B2E5E 0%, #D8A24A 100%);
}

.quiz-option::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(59, 111, 143, 0) 0%,
    rgba(59, 111, 143, 0.08) 50%,
    rgba(216, 162, 74, 0.1) 100%
  );
  transform: translateX(-100%);
  transition: transform 0.35s ease;
}

.quiz-option:hover,
.quiz-option:focus-visible {
  background: rgba(59, 111, 143, 0.04);
  box-shadow: 0 10px 22px rgba(59, 111, 143, 0.1);
  border-color: rgba(59, 111, 143, 0.28);
  transform: translateY(-1px);
}

.quiz-option:hover::after,
.quiz-option:focus-visible::after {
  transform: translateX(0);
}

.quiz-option--selected {
  background: #fff6f2;
  border-color: #e8412a;
  box-shadow: 0 16px 28px rgba(232, 65, 42, 0.14);
}

.quiz-option--selected::before {
  background: linear-gradient(180deg, #e8412a 0%, #1b2e5e 100%);
}

.quiz-option:disabled {
  cursor: wait;
  opacity: 1;
}

.quiz-result {
  border-top: 1px solid rgba(27, 46, 94, 0.12);
  padding-top: 16px;
  display: grid;
  gap: 12px;
}

.result-title {
  margin: 0;
  font-size: 1.2rem;
  color: #1B2E5E;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.result-copy {
  margin: 0;
  color: #5a5a5a;
  font-size: 1rem;
  line-height: 1.55;
}

.result-grid {
  display: grid;
  gap: 12px;
}

.result-row {
  display: grid;
  grid-template-columns: 140px 1fr 48px;
  align-items: center;
  gap: 10px;
}

.result-key {
  font-size: 0.9rem;
  color: #1B2E5E;
  font-weight: 600;
}

.result-bar {
  height: 8px;
  background: #E3D7C8;
  border-radius: 999px;
  overflow: hidden;
}

.result-bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #1B2E5E 0%, #7A9A82 55%, #D8A24A 100%);
  transition: width 0.5s ease;
}

.result-pct {
  font-size: 0.85rem;
  color: #3B6F8F;
  font-weight: 600;
  text-align: right;
}

.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quiz-reset,
.quiz-continue {
  border: 0;
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.quiz-reset::after,
.quiz-continue::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(27, 46, 94, 0) 0%,
    rgba(27, 46, 94, 0.22) 55%,
    rgba(232, 65, 42, 0.32) 100%
  );
  transform: translateX(-100%);
  transition: transform 0.35s ease;
}

.quiz-reset:hover::after,
.quiz-reset:focus-visible::after,
.quiz-continue:hover::after,
.quiz-continue:focus-visible::after {
  transform: translateX(0);
}

.quiz-reset {
  background: #FCF7F1;
  color: #1b2e5e;
  border: 1px solid rgba(27, 46, 94, 0.18);
}

.quiz-continue {
  background: #1b2e5e;
  color: #ffffff;
}

@keyframes floatIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .quiz-card {
    animation: none;
  }
}

@media (max-width: 640px) {
  .result-row {
    grid-template-columns: 1fr;
  }
  .result-pct {
    text-align: left;
  }
}

/* ── Quiz fullscreen ── */
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

.fs-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  animation: fs-dot-b 0.9s ease-in-out infinite;
}

.fs-dot:nth-child(2) { animation-delay: 0.15s; }
.fs-dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes fs-dot-b {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(-6px); opacity: 1; }
}

.fs-overlay-enter-active { transition: opacity 0.2s ease; }
.fs-overlay-leave-active { transition: opacity 0.3s ease; }
.fs-overlay-enter-from,
.fs-overlay-leave-to { opacity: 0; }

.quiz-fs-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0 10px;
  border-bottom: 1px solid rgba(27, 46, 94, 0.1);
  margin-bottom: 4px;
}

.quiz-fs-label {
  font-size: 0.72rem;
  color: #6b7280;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.quiz-fs-exit {
  background: transparent;
  border: 1px solid rgba(27, 46, 94, 0.2);
  color: #6b7280;
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
}

.quiz-fs-exit:hover {
  background: rgba(27, 46, 94, 0.05);
}

.quiz-card--fullscreen {
  border-radius: 0;
  min-height: 100vh;
  box-shadow: none;
  display: flex;
  flex-direction: column;
}
</style>
