<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  scenarioType: {
    type: String,
    default: 'task_based',
  },
  feedbackHistory: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'result'])

const step = ref('prompt')
const choice = ref('')

function shortenToWords(text, maxWords = 22) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim()
  if (!clean) return ''
  const words = clean.split(' ')
  if (words.length <= maxWords) return clean
  return `${words.slice(0, maxWords).join(' ')}…`
}

const focusStep = computed(() => {
  const history = Array.isArray(props.feedbackHistory) ? props.feedbackHistory : []
  const highRisk = history.find((item) => item?.choice === 'risk')
  return highRisk || history[0] || null
})

const question = computed(() => {
  const fallback = {
    prompt: 'Quick check: what should you do first when a recruiter message feels urgent?',
    correctOption: 'Pause and verify through an official channel before any payment or ID share.',
    wrongOption: 'Act immediately so you do not miss the opportunity.',
    reason: 'Scammers rely on urgency to bypass your normal safety checks.',
  }

  const focus = focusStep.value
  if (!focus) return fallback

  const riskTag = focus.riskTag || 'a pressure signal'
  const safeAction = focus.safeAction || fallback.correctOption

  return {
    prompt: `Quick check: after noticing "${riskTag}", what should you do first?`,
    correctOption: safeAction,
    wrongOption: fallback.wrongOption,
    reason: 'Slowing down breaks the pressure loop before money or IDs leave your hands.',
  }
})

const feedbackText = computed(() => {
  const reason = shortenToWords(question.value.reason, 18)
  if (choice.value === 'correct') {
    return shortenToWords(`Correct — ${reason}`, 28)
  }
  if (choice.value === 'wrong') {
    const stepText = shortenToWords(question.value.correctOption, 14)
    return shortenToWords(`Better first step: ${stepText}. ${reason}`, 32)
  }
  return ''
})

function resetState() {
  step.value = 'prompt'
  choice.value = ''
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) resetState()
  },
)

function pick(answer) {
  if (step.value === 'feedback') return
  choice.value = answer === 'correct' ? 'correct' : 'wrong'
  step.value = 'feedback'
}

function emitResult(status) {
  emit('result', {
    scenarioType: props.scenarioType,
    status,
    answer: status === 'answered' ? choice.value : '',
    prompt: question.value.prompt,
    reason: question.value.reason,
    timestamp: Date.now(),
  })
}

function finish() {
  emitResult('answered')
  emit('close')
}

function skip() {
  emitResult('skipped')
  emit('close')
}

function onBackdropClick(event) {
  if (event.target === event.currentTarget) skip()
}

function onKeydown(event) {
  if (event.key === 'Escape' && props.open) skip()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="qc-modal">
      <div
        v-if="open"
        class="qc-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qc-modal-title"
        @click="onBackdropClick"
        @keydown="onKeydown"
      >
        <div class="qc-modal__card" @click.stop>
          <header class="qc-modal__head">
            <p id="qc-modal-title" class="qc-modal__title">Optional quick check</p>
            <p class="qc-modal__hint">One short question before you pick the next scenario.</p>
          </header>

          <p class="qc-modal__prompt">{{ question.prompt }}</p>

          <div v-if="step === 'prompt'" class="qc-modal__options">
            <button class="qc-modal__option" type="button" @click="pick('correct')">
              A. {{ question.correctOption }}
            </button>
            <button class="qc-modal__option" type="button" @click="pick('wrong')">
              B. {{ question.wrongOption }}
            </button>
          </div>

          <div v-else class="qc-modal__feedback-wrap">
            <p
              class="qc-modal__feedback"
              :class="choice === 'correct' ? 'qc-modal__feedback--ok' : 'qc-modal__feedback--warn'"
            >
              {{ feedbackText }}
            </p>
            <button class="qc-modal__primary" type="button" @click="finish">Continue</button>
          </div>

          <footer v-if="step === 'prompt'" class="qc-modal__foot">
            <button class="qc-modal__ghost" type="button" @click="skip">Skip for now</button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.qc-modal {
  position: fixed;
  inset: 0;
  z-index: 12000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
}

.qc-modal__card {
  width: min(100%, 440px);
  max-height: min(88vh, 560px);
  overflow: auto;
  background: #fcf7f1;
  border: 1px solid rgba(27, 46, 94, 0.14);
  border-radius: 16px;
  padding: 18px 18px 16px;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.22);
}

.qc-modal__head {
  margin-bottom: 12px;
}

.qc-modal__title {
  margin: 0 0 4px;
  font-size: 1.05rem;
  font-weight: 800;
  color: #1b2e5e;
}

.qc-modal__hint {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: #6b7280;
}

.qc-modal__prompt {
  margin: 0 0 12px;
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.5;
  color: #1f2937;
}

.qc-modal__options {
  display: grid;
  gap: 8px;
}

.qc-modal__option {
  border: 1px solid rgba(27, 46, 94, 0.16);
  border-radius: 10px;
  background: #fff;
  color: #1f2937;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.84rem;
  line-height: 1.45;
  padding: 10px 12px;
  text-align: left;
}

.qc-modal__option:hover,
.qc-modal__option:focus-visible {
  border-color: #1b2e5e;
  background: rgba(27, 46, 94, 0.04);
}

.qc-modal__feedback-wrap {
  display: grid;
  gap: 12px;
}

.qc-modal__feedback {
  margin: 0;
  border-radius: 10px;
  font-size: 0.86rem;
  line-height: 1.5;
  padding: 10px 12px;
}

.qc-modal__feedback--ok {
  background: rgba(15, 157, 143, 0.12);
  color: #0f4c45;
}

.qc-modal__feedback--warn {
  background: rgba(208, 49, 45, 0.1);
  color: #7f1d1d;
}

.qc-modal__primary {
  border: 0;
  border-radius: 10px;
  background: #1b2e5e;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  padding: 11px 14px;
}

.qc-modal__foot {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid rgba(27, 46, 94, 0.1);
  display: flex;
  justify-content: flex-end;
}

.qc-modal__ghost {
  border: 0;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 6px 4px;
  text-decoration: underline;
}

.qc-modal-enter-active,
.qc-modal-leave-active {
  transition: opacity 0.22s ease;
}

.qc-modal-enter-active .qc-modal__card,
.qc-modal-leave-active .qc-modal__card {
  transition: transform 0.22s ease;
}

.qc-modal-enter-from,
.qc-modal-leave-to {
  opacity: 0;
}

.qc-modal-enter-from .qc-modal__card,
.qc-modal-leave-to .qc-modal__card {
  transform: translateY(12px) scale(0.98);
}
</style>
