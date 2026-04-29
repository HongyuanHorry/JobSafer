<template>
  <section class="sim" aria-live="polite">
    <div class="sim-head">
      <p class="sim-kicker">Scam Progression Simulator</p>
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
    </div>

    <Transition name="slide-fade" mode="out-in">
      <article :key="`stage-${stage}`" class="sim-card">
        <template v-if="stage === 0">
          <div class="sim-visual">
            <img class="sim-image" src="/icons/image1.png" alt="Alex base character" />
          </div>

          <div class="sim-copy">
            <h4>Meet Alex</h4>
            <p class="lead">Quick voice-note style intro before we enter the scam flow.</p>

            <div class="intro-chat">
              <div class="intro-chat__avatar" aria-hidden="true">A</div>
              <div class="intro-chat__thread">
                <p
                  v-for="(line, idx) in scenario.introAlex"
                  :key="`intro-${idx}`"
                  class="bubble bubble--alex intro-bubble"
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
                  class="bubble bubble--scammer phone-bubble"
                >
                  {{ line }}
                </p>
                <p v-if="currentStage.phoneReply" class="bubble bubble--phone-self phone-bubble">
                  {{ currentStage.phoneReply }}
                </p>
              </div>
            </div>
          </div>

          <div class="sim-copy" :class="{ 'sim-copy--danger': picked === 'risk' }">
            <h4>{{ scenario.stages[stage - 1].title }}</h4>
            <p>{{ scenario.stages[stage - 1].text }}</p>

            <div class="bubble-list">
              <p
                v-for="(line, idx) in scenario.stages[stage - 1].alexTalk"
                :key="`alex-${stage}-${idx}`"
                class="bubble bubble--alex"
              >
                {{ line }}
              </p>
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

            <p class="sound-hint">🔊 Selecting an option plays a short sound cue.</p>

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
              <figcaption>{{ finalOutcomeCaption }}</figcaption>
            </figure>
          </div>

          <div class="sim-copy">
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

const props = defineProps({
  scenarioType: { type: String, default: 'task_based' },
  detectedLabel: { type: String, default: '' },
  detectedTone: { type: String, default: '' },
  showDetectedResult: { type: Boolean, default: false },
})

defineEmits(['restart', 'exit'])

function createScenario(title, introAlex, stageText) {
  return {
    title,
    introAlex,
    stages: stageText,
  }
}

const taskStages = [
  {
    title: 'Friendly outreach',
    text: 'A stranger offers quick social-media tasks with high pay and instant onboarding.',
    scammerLine: 'Hi Alex, fast task job. Earn today, no interview needed.',
    scammerThread: [
      'Hi Alex 👋 Quick remote task role, no interview needed.',
      'You can start in 10 minutes and get paid tonight.',
    ],
    phoneReply: 'Can you send your company site or ABN first?',
    alexTalk: [
      'I always check if a recruiter gives verifiable company details.',
      'When they rush me, that is usually a script.',
      'I’m 21 and study communication design in Melbourne, so I get many online offers.',
      'I learned to slow down first, then decide.',
    ],
    safeOption: 'Verify company via official website/ABN',
    riskOption: 'Move to private chat immediately',
    safeNote: 'Great. Independent verification blocks many scam chains.',
    riskNote: 'This usually starts the manipulation funnel.',
  },
  {
    title: 'Early reward bait',
    text: 'A dashboard shows instant earnings after tiny tasks.',
    scammerLine: 'See your balance? Keep going and earn more tonight.',
    scammerThread: [
      'See your balance? Keep going and earn more tonight.',
      'Finish 3 more tasks and we push your payout higher again.',
    ],
    phoneReply: 'Looks great... can I withdraw now?',
    alexTalk: [
      'A fake balance is emotionally powerful but technically easy to build.',
      'If withdrawals are blocked, the whole “profit” is fake.',
      'I keep screenshots so I can report patterns later.',
      'Excitement is normal, but I don’t let it control decisions.',
    ],
    safeOption: 'Test withdrawal terms first',
    riskOption: 'Keep increasing balance',
    safeNote: 'Correct. Withdrawal is the truth test.',
    riskNote: 'The hook is working exactly as scammers planned.',
  },
  {
    title: 'Verification fee demand',
    text: 'Alex is told to pay a platform fee to unlock funds.',
    scammerLine: 'Small verification fee now, then full payout unlocked.',
    scammerThread: [
      'Your account is successful ✅',
      'Just pay a $50 verification fee to unlock withdrawal.',
    ],
    phoneReply: 'Why do I have to pay before getting my own earnings?',
    alexTalk: [
      'Legit jobs do not ask me to pay to receive wages.',
      'Fee-before-withdrawal is one of the clearest warning signs.',
      'I tell friends: money out before money in = stop.',
      'The goal is to trigger sunk-cost thinking.',
    ],
    safeOption: 'Refuse payment and stop transfer',
    riskOption: 'Pay once to recover more',
    safeNote: 'Exactly right. Stop-loss prevents escalation.',
    riskNote: 'One payment often becomes repeated payments.',
  },
  {
    title: 'Threat escalation',
    text: 'A fake legal team threatens penalties and asks for ID.',
    scammerLine: 'FINAL WARNING: comply in 30 mins or legal action starts.',
    scammerThread: [
      'FINAL WARNING: Legal Department will proceed in 30 minutes.',
      'Submit passport + selfie now to avoid penalties.',
    ],
    phoneReply: 'This is getting threatening. I should stop this now.',
    alexTalk: [
      'Threat language is designed to bypass rational thinking.',
      'Scammers borrow authority words like legal, compliance, department.',
      'I never share identity files under pressure.',
      'At this point I block, record, and report.',
    ],
    safeOption: 'Block/report and secure accounts',
    riskOption: 'Send ID to avoid trouble',
    safeNote: 'Good move. Containment comes first.',
    riskNote: 'ID leakage may lead to secondary fraud.',
  },
  {
    title: 'Recovery choice',
    text: 'Alex decides whether to stop and report or keep negotiating.',
    scammerLine: 'Last transfer now and we release everything.',
    scammerThread: [
      'Last transfer now and we release everything.',
      'If you stop now, your account is permanently frozen.',
    ],
    phoneReply: 'No more payments. I’m preserving evidence and reporting.',
    alexTalk: [
      'I choose formal channels over emotional negotiation.',
      'Banks and official reporting lines are more useful than arguing with scammers.',
      'I keep timeline notes to help investigations.',
      'Stopping early is a strength, not a failure.',
    ],
    safeOption: 'Report + keep evidence',
    riskOption: 'Try one final negotiation',
    safeNote: 'Great ending. You regained control.',
    riskNote: 'Final-negotiation loops usually deepen losses.',
  },
]

const DATA = {
  task_based: createScenario(
    'Task-based job scam',
    [
      'Hey — I’m Alex, 21, from Melbourne. Uni by day, café shifts on weekends.',
      'I’m not a lawyer or cop. I’m exactly the kind of person these scammers target.',
      'I’ve seen classmates lose money to “easy task jobs”, so I started collecting scam scripts.',
      'I’ll guide this like a friend-to-friend chat: practical, fast, zero jargon.',
      'If you can spot what I spot, you can protect yourself earlier than I did.',
    ],
    taskStages,
  ),
  phishing: createScenario(
    'Phishing recruiter scam',
    [
      'I also got fake interview links that looked almost real.',
      'My advantage now is pattern memory: odd domain, urgency, repeated login prompts.',
      'I’ll show you where the trap appears before damage starts.',
      'You don’t need technical expertise—just a strong pause habit.',
      'Let’s practice it together.',
    ],
    taskStages,
  ),
  financial_fraud: createScenario(
    'Fake payroll / upfront fee scam',
    [
      'In my second year, I nearly paid an onboarding fee for a fake remote role.',
      'That experience taught me fee-based onboarding is a giant red flag.',
      'I now benchmark every request against normal employer behavior.',
      'In this simulation I’ll point out where pressure replaces logic.',
      'You can copy this checklist later for real job searches.',
    ],
    taskStages,
  ),
  identity_scam: createScenario(
    'Identity harvesting scam',
    [
      'Scammers once asked me for passport + selfie + utility bill in one go.',
      'That over-collection style is now easy for me to recognize.',
      'I’ll show you exactly how to guard your identity documents.',
      'Think “minimum data, maximum verification.”',
      'We’re training safe boundaries, not fear.',
    ],
    taskStages,
  ),
  investment: createScenario(
    'Job-to-investment hybrid scam',
    [
      'I’ve seen fake recruiters mix jobs with “guaranteed investment channels.”',
      'That blend is persuasive because it borrows trust from employment language.',
      'I now split every mixed offer into separate risk checks.',
      'In this walkthrough, I’ll call out each emotional trigger.',
      'By the end, you’ll read the script before it reads you.',
    ],
    taskStages,
  ),
}

const stage = ref(0)
const picked = ref('')
const riskCount = ref(0)

const scenario = computed(() => DATA[props.scenarioType] || DATA.task_based)
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

const isHighPressureOutcome = computed(() => riskCount.value >= 3 || pressurePercent.value >= 78)
const finalOutcomeImage = computed(() =>
  isHighPressureOutcome.value ? '/icons/Image7.png' : '/icons/Image6.png',
)
const finalOutcomeAlt = computed(() =>
  isHighPressureOutcome.value
    ? 'Alex celebrates regaining control after high-pressure scam pattern'
    : 'Alex points out fake balance and pressure tactics clearly',
)
const finalOutcomeCaption = computed(() =>
  isHighPressureOutcome.value
    ? 'High-pressure path recognised and recovered'
    : 'Low-pressure path: tactics caught early',
)
const finalOutcomeTitle = computed(() =>
  isHighPressureOutcome.value
    ? 'High-pressure path detected — now lock recovery actions in place.'
    : 'You kept pressure low and broke the script early.',
)

const stageImage = computed(() => {
  if (stage.value === 1) return '/icons/Image2.png'
  if (stage.value === 2) return '/icons/Image3.png'
  if (stage.value === 3) return '/icons/Image4.png'
  if (stage.value === 4) return '/icons/Image5.png'
  return '/icons/image1.png'
})

function playTone(kind) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = kind === 'safe' ? 'triangle' : 'sawtooth'
    osc.frequency.value = kind === 'safe' ? 680 : 210
    gain.gain.value = kind === 'safe' ? 0.045 : 0.075
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + (kind === 'safe' ? 0.11 : 0.15))
    osc.onended = () => {
      ctx.close().catch(() => {})
    }
  } catch {
    // fallback silently
  }
}

function pick(type) {
  if (picked.value) return
  picked.value = type
  if (type === 'risk') {
    riskCount.value += 1
  }
  playTone(type)
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
  max-width: 900px;
  margin: 0 auto;
}
.sim-head {
  margin-bottom: 10px;
}
.sim-kicker {
  margin: 0;
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #1b2e5e;
  font-weight: 800;
}
.sim-meta {
  margin: 6px 0 8px;
  color: #6b7280;
  font-size: 0.88rem;
}
.stage-track {
  display: flex;
  gap: 7px;
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
  grid-template-columns: minmax(0, 340px) 1fr;
  gap: 14px;
  background: #fff;
  border: 1px solid rgba(27, 46, 94, 0.14);
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 12px 22px rgba(27, 46, 94, 0.08);
}
.sim-visual {
  border-radius: 12px;
  background: #f8fbff;
  border: 1px solid rgba(27, 46, 94, 0.12);
  padding: 10px;
}
.sim-image {
  width: 100%;
  height: auto;
  max-height: 280px;
  object-fit: contain;
  border-radius: 10px;
  display: block;
  margin: 0 auto;
}

.lead {
  margin: 0 0 8px;
}

.intro-chat {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 10px;
  margin-top: 8px;
  align-items: start;
}

.intro-chat__avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #1b2e5e;
  color: #fff;
  font-weight: 700;
}

.intro-chat__thread {
  display: grid;
  gap: 7px;
}

.intro-bubble {
  justify-self: start;
  max-width: 100%;
}

.bubble-list {
  display: grid;
  gap: 6px;
  margin-top: 8px;
}
.bubble {
  margin: 0;
  border-radius: 12px;
  padding: 8px 10px;
  font-size: 0.82rem;
  line-height: 1.42;
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
.emotion-meter span,
.sound-hint {
  font-size: 0.78rem;
  color: #6b7280;
}
.sound-hint {
  margin-top: 8px;
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
  border: 1px solid rgba(27, 46, 94, 0.12);
  border-radius: 12px;
  padding: 8px;
  background: #fff;
}
.finale-image {
  height: 160px;
  max-height: 160px;
}
.finale-card figcaption {
  margin-top: 6px;
  font-size: 0.75rem;
  text-align: center;
  color: #6b7280;
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
  }

  .intro-chat {
    grid-template-columns: 1fr;
  }

  .intro-chat__avatar {
    display: none;
  }

  .recap-grid {
    grid-template-columns: 1fr;
  }
}
</style>
