<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
import { ArrowRight } from 'lucide-vue-next'
import ResultPanel from './components/ResultPanel.vue'
import SubmissionPanel from './components/SubmissionPanel.vue'
import InsightsPanel from './components/InsightsPanel.vue'
import ScamSimulation from './components/ScamSimulation.vue'
import SimulatorQuickCheckModal from './components/SimulatorQuickCheckModal.vue'
import ScamTypeQuiz from './components/ScamTypeQuiz.vue'
import {
  analyzeTextContent,
  analyzeTextContentByBackend,
  extractTextFromSubmission,
  lookupAbnByBackend,
} from './services/scamAnalysisEngine'
import { generateGeminiSummary } from './services/geminiSummaryService'
import { buildTimingSignalsForAi } from './services/walkthroughTimingService'
import { formatCoachApiError, safeParseJsonStorage } from './utils/clientSecurity.js'
import { scamTypeMeta } from './constants/scamSimulationData'

const isAnalyzing = ref(false)
const result = ref(null)
const scannerStatusIndex = ref(0)
const scannerPulseTick = ref(0)

const resultPanelTransitionKey = computed(() => {
  if (result.value?.riskScore != null)
    return `live-${result.value.riskScore}-${result.value.riskTier}`
  return 'live-empty-state'
})
const extractedTextPreview = ref('')
const submissionQuickMode = ref('text')
const isMenuOpen = ref(false)
const highlightKeySignals = ref(false)
const menuToggleButton = ref(null)
const isNavElevated = ref(false)
const activeNavId = ref('home-section')
const isPageFading = ref(false)
const statsBandRef = ref(null)
const heroParticlesCanvas = ref(null)
const isHeroLottieFailed = ref(false)
const statsAnimated = ref(false)
const statsLossValue = ref('$0B')
const statsVictimValue = ref('0')
const statsTaskValue = ref('0%')
const latestAnalyzedInput = ref('')
const lastEvidenceSnapshot = ref({
  inputType: 'text',
  text: '',
  link: '',
})
const abnQuery = ref('')
const abnResults = ref([])
const abnLoading = ref(false)
const abnError = ref('')
const confirmedAbn = ref(null)
const SITE_PASSWORD = (import.meta.env.VITE_SITE_PASSWORD || '').trim()
const SITE_PASSWORD_SESSION_KEY = 'stepsafe-site-password-auth'
const requiresSitePassword = computed(() => Boolean(SITE_PASSWORD))
const isSiteAuthorized = ref(!SITE_PASSWORD)
const sitePasswordInput = ref('')
const sitePasswordError = ref('')
const NAV_SCROLL_GAP = 18
const NAV_SCROLL_LIFT = 0
const LEARN_SCROLL_SETTLE_MS = 120
const LEARN_BUTTON_EXTRA_GAP = -18
const CHECK_SCAM_TARGET_ID = 'check-scam-panel'
const EXTRACTED_PREVIEW_MAX_CHARS = 420
const SCROLL_SECTION_IDS = [
  'home-section',
  'check-section',
  'insights-section',
  'learn-section',
  'support-section',
]

const FEMALE_LOTTIE_SRC =
  'https://lottie.host/9075ec25-d2b0-4f31-b387-fb48af7f4314/ZycTb7dy1X.lottie'
let highlightTimer = null
let pageFadeTimer = null
let statsObserver = null
let particleAnimationFrame = null
let particleReduceMotionQuery = null
let particleReduceMotionHandler = null
let particleResizeHandler = null
let stageMotionFrame = null
let hasPageShellInitialized = false
let scannerStatusTimer = null

const heroParticleState = {
  canvas: null,
  context: null,
  host: null,
  width: 0,
  height: 0,
  dpr: 1,
  particles: [],
}

const topActions = [
  { label: 'Suspicious message', mode: 'text', action: 'open-check' },
  { label: 'Upload job PDF', mode: 'pdf', action: 'open-check' },
  { label: 'Verify recruiter', mode: 'link', action: 'open-check' },
]

const primarySections = [
  { label: 'Insights', id: 'insights-section' },
  { label: 'Learn', id: 'learn-section' },
  { label: 'Support', id: 'support-section' },
]

const learnScenarioOptions = [
  { key: 'task_based', label: 'Task-based job scam', icon: '📋' },
  { key: 'phishing', label: 'Phishing recruiter scam', icon: '🎣' },
  { key: 'financial_fraud', label: 'Fake payroll / upfront fee scam', icon: '💸' },
  { key: 'identity_scam', label: 'Identity document harvesting scam', icon: '🪪' },
  { key: 'investment', label: 'Job-to-investment hybrid scam', icon: '📈' },
]

const quickTips = [
  {
    title: 'Task scam warning signs',
    summary: 'Fast red flags for step-by-step simple task scams and fake commission loops.',
    href: 'https://www.scamwatch.gov.au/types-of-scams/jobs-and-employment-scams',
    source: 'Scamwatch',
    stripColor: '#D0312D',
    image: '/icons/Task scam warning signs.png',
    fallback: '/icons/StepSafeIcon.png',
  },
  {
    title: 'How to spot fake remote jobs',
    summary: 'FTC guidance for fake checks, upfront fee traps, and high-pay low-effort bait.',
    href: 'https://consumer.ftc.gov/articles/job-scams',
    source: 'FTC Consumer Advice',
    stripColor: '#1F2D6B',
    image: '/icons/job-scams-blue.jpg',
    fallback: '/icons/StepSafeIcon.png',
  },
  {
    title: 'Unicorn job scams in Australia',
    summary: 'AFP coverage of job scams targeting vulnerable Australians who are looking for work.',
    href: 'https://www.afp.gov.au/news-centre/media-release/unicorn-job-scams-criminals-target-vulnerable-aussies-looking-work',
    source: 'AFP News',
    stripColor: '#3B6F8F',
    image: '/icons/job-scams-in-australia.jpg',
    fallback: '/icons/StepSafeIcon.png',
  },
]

const learningCards = [
  {
    title: "Employment scams are on the rise. Here's what to look out for",
    summary: 'Coverage of warning signs and recent scam growth trends in Australia.',
    href: 'https://www.sbs.com.au/news/article/employment-scams-are-on-the-rise-heres-what-to-look-out-for/2xgyuapu0',
    source: 'SBS News',
    stripColor: '#1F2D6B',
    image: "/icons/Employment scams are on the rise. Here's what to look out for.avif",
    fallback: '/icons/StepSafeIcon.png',
  },
  {
    title: "'An elaborate ruse': The scam that's surging in Australia",
    summary: 'Explainer on task scam mechanics and how to protect yourself from losses.',
    href: 'https://www.sbs.com.au/news/article/an-elaborate-ruse-the-scam-thats-surging-in-australia-and-how-to-protect-yourself/fxvbsllo7',
    source: 'SBS News',
    stripColor: '#D0312D',
    image: "/icons/An elaborate ruse The scam that's surging in Australia.avif",
    fallback: '/icons/StepSafeIcon.png',
  },
  {
    title: 'Sam thought he had a marketing job - it was actually a task-based scam',
    summary: 'Case study with concrete red flags from a real task-based scam timeline.',
    href: 'https://www.abc.net.au/news/2025-07-26/employment-scams-work-marketing-messages/105089062',
    source: 'ABC News',
    stripColor: '#1F2D6B',
    image: '/icons/sam-thought-marketing-job-task-scam.avif',
    fallback: '/icons/StepSafeIcon.png',
  },
]

quickTips.forEach((item) => {
  item.image = item.image?.startsWith('/') ? item.image : '/icons/job-scams-blue.jpg'
  item.fallback = item.fallback || '/icons/StepSafeIcon.png'
})

learningCards.forEach((item) => {
  item.image = item.image?.startsWith('/') ? item.image : '/icons/EmploymentScamWarningPic.png'
  item.fallback = item.fallback || '/icons/StepSafeIcon.png'
})

const resourceImageStatus = reactive({})

const urgencyStats = [
  {
    key: 'loss',
    target: 2.2,
    label: 'lost to scams in Australia in 2025',
  },
  {
    key: 'victims',
    label: 'people aged 18-24 may be caught in job scams',
  },
  {
    key: 'task',
    target: 47,
    label: 'Task scams up year on year',
  },
]

const statsEvidenceNote =
  'Source: ACCC media release (30 Mar 2026) and Scamwatch Targeting Scams Report 2025 infographic text.'

const howItWorksSteps = [
  {
    number: '1',
    title: 'Check Scam',
    description:
      'Upload a message, PDF, or link. Get a quick risk alert with key red flags highlighted.',
    hint: 'Open scanner console with Text, Link, PDF, or ABN evidence.',
  },
  {
    number: '2',
    title: 'Insights',
    description:
      'See scam loss patterns by type, age, and region through clear data visualization.',
    hint: 'Explore animated trend, age, map, and summary views.',
  },
  {
    number: '3',
    title: 'Learn',
    description:
      'Try realistic scam scenarios to spot your weak points and practice safer decisions.',
    hint: 'Run mission-based scenarios with Alex and reinforce safer choices.',
  },
  {
    number: '4',
    title: 'Support',
    description: 'Support resources are coming soon to help you take action fast.',
    hint: 'Save evidence and prepare your report handoff pathway.',
  },
]

const scannerStatusLines = [
  'Checking urgency language',
  'Detecting payment pressure',
  'Looking for identity red flags',
]

const scannerStatusCurrent = computed(
  () => scannerStatusLines[scannerStatusIndex.value % scannerStatusLines.length],
)

const footerFriendLinks = [
  {
    label: 'Scamwatch (Australian Government)',
    href: 'https://www.scamwatch.gov.au/',
    icon: 'https://www.google.com/s2/favicons?domain=scamwatch.gov.au&sz=64',
  },
  {
    label: 'Australian Competition and Consumer Commission (ACCC)',
    href: 'https://www.accc.gov.au/',
    icon: 'https://www.google.com/s2/favicons?domain=accc.gov.au&sz=64',
  },
  {
    label: 'ASIC MoneySmart (Australia)',
    href: 'https://moneysmart.gov.au/',
    icon: 'https://www.google.com/s2/favicons?domain=moneysmart.gov.au&sz=64',
  },
  {
    label: 'Federal Trade Commission (FTC)',
    href: 'https://consumer.ftc.gov/',
    icon: 'https://www.google.com/s2/favicons?domain=consumer.ftc.gov&sz=64',
  },
]

const footerProductLinks = [
  { label: 'Home', sectionId: 'home-section' },
  { label: 'Check Scam', sectionId: CHECK_SCAM_TARGET_ID },
  { label: 'Insights', sectionId: 'insights-section' },
  { label: 'Learn', sectionId: 'learn-section' },
  { label: 'Support', sectionId: 'support-section' },
]

const footerLegalLinks = [
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
]

const learnScamType = ref('task_based')
const learnStep = ref('entry')
const pendingQuickCheck = ref(null)
const quickCheckModalOpen = ref(false)
const quickCheckTargetKey = ref('')
const learnCompletion = ref({})
const learnSectionRef = ref(null)
const learnQuizResult = ref(null)
const simulatorPersonalSummary = ref({
  paragraph: '',
  topRisk: '',
  nextAction: '',
  hesitationInsight: '',
  tone: '',
  loading: false,
  error: '',
  source: 'idle',
})

function resetSimulatorPersonalSummary() {
  simulatorPersonalSummary.value = {
    paragraph: '',
    topRisk: '',
    nextAction: '',
    hesitationInsight: '',
    tone: '',
    loading: false,
    error: '',
    source: 'idle',
  }
}

const learnMeta = computed(
  () => scamTypeMeta[learnScamType.value] || { label: 'Unknown', tone: '' },
)

function handleQuizComplete(payload) {
  if (!payload?.type) return
  learnScamType.value = payload.type
  learnQuizResult.value = payload
  learnStep.value = 'quiz_result'
  persistLearnState({ step: 'quiz_result', scamType: payload.type, quizResult: payload })
  // Scroll to the same position as clicking "Learn" in the nav bar
  setTimeout(() => scrollToSection('learn-section'), 450)
}

function persistLearnState(update) {
  try {
    const current = safeParseJsonStorage(localStorage.getItem('stepsafe_learn_state') || '') || {}
    const next = { ...current, scamType: learnScamType.value, ...update }
    localStorage.setItem('stepsafe_learn_state', JSON.stringify(next))
  } catch {
    // ignore storage errors
  }
}

function loadLearnState() {
  try {
    const state = safeParseJsonStorage(localStorage.getItem('stepsafe_learn_state') || '{}') || {}
    if (state?.scamType) learnScamType.value = state.scamType
    if (state?.quizResult) learnQuizResult.value = state.quizResult
    if (state?.step === 'walkthrough') learnStep.value = 'walkthrough'
    else if (state?.step) learnStep.value = state.step
    if (state?.completedByType) learnCompletion.value = state.completedByType
  } catch {
    // ignore storage errors
  }
}

function getStaticOffsetTop(node) {
  let offset = 0
  let current = node
  while (current instanceof HTMLElement) {
    offset += current.offsetTop
    current = current.offsetParent
  }
  return offset
}

function scrollToLearn(extraGap = 0) {
  const targetId = learnStep.value === 'entry' ? 'learn-core-anchor' : 'learn-workflow-anchor'
  const anchor = document.getElementById(targetId)
  if (!(anchor instanceof HTMLElement)) return
  const header = document.querySelector('.top-strip')
  const headerHeight = header instanceof HTMLElement ? header.offsetHeight : 0
  const stickyTopInset =
    header instanceof HTMLElement
      ? Number.parseFloat(window.getComputedStyle(header).top || '0') || 0
      : 0
  const dynamicGap = NAV_SCROLL_GAP + extraGap
  const top =
    getStaticOffsetTop(anchor) - headerHeight - stickyTopInset - dynamicGap - NAV_SCROLL_LIFT
  window.scrollTo({ top, behavior: 'smooth' })
}

function startLearnQuiz() {
  learnStep.value = 'quiz'
  persistLearnState({ step: 'quiz' })
  scrollToLearnAfterRender(LEARN_BUTTON_EXTRA_GAP)
}

function scrollToLearnAfterRender(extraGap = 0) {
  nextTick(() => {
    scrollToLearn(extraGap)
    window.setTimeout(() => {
      scrollToLearn(extraGap)
    }, LEARN_SCROLL_SETTLE_MS)
  })
}

function startWalkthroughDirectly() {
  learnQuizResult.value = null
  learnStep.value = 'walkthrough'
  resetSimulatorPersonalSummary()
  persistLearnState({ step: 'walkthrough', quizResult: null })
  scrollToLearnAfterRender(LEARN_BUTTON_EXTRA_GAP)
}

function openWalkthroughFromQuiz() {
  learnStep.value = 'walkthrough'
  resetSimulatorPersonalSummary()
  persistLearnState({ step: 'walkthrough' })
  scrollToLearnAfterRender(LEARN_BUTTON_EXTRA_GAP)
}

function backToWorkflowChoice() {
  learnStep.value = 'entry'
  resetSimulatorPersonalSummary()
  persistLearnState({ step: 'entry' })
  // Delay allows fullscreen exit layout reflow before computing scroll position
  setTimeout(scrollToLearn, 450)
}

const showResult = computed(() => result.value !== null)

const resultPanelAnalysisType = computed(() => lastEvidenceSnapshot.value.inputType || 'text')

const resultPanelLinkUrl = computed(() => lastEvidenceSnapshot.value.link || '')

const resultPanelMessagePlain = computed(() => {
  const snap = lastEvidenceSnapshot.value
  if (snap.inputType === 'text') return latestAnalyzedInput.value
  if (snap.inputType === 'link') return snap.text
  return extractedTextPreview.value || latestAnalyzedInput.value
})

let revealObserver = null

function scrollToSection(sectionId) {
  const remap = {
    'learn-section': 'learn-core-anchor',
    'check-section': 'check-scam-panel',
  }
  const node = document.getElementById(remap[sectionId] || sectionId)
  if (!node) return

  const header = document.querySelector('.top-strip')
  const headerHeight = header instanceof HTMLElement ? header.offsetHeight : 0
  const stickyTopInset =
    header instanceof HTMLElement
      ? Number.parseFloat(window.getComputedStyle(header).top || '0') || 0
      : 0
  const top =
    getStaticOffsetTop(node) - headerHeight - stickyTopInset - NAV_SCROLL_GAP - NAV_SCROLL_LIFT

  window.scrollTo({ top, behavior: 'smooth' })
}

function setLearnScenario(typeKey) {
  learnScamType.value = typeKey
  persistLearnState({ scamType: typeKey })
}

function isQuickCheckDone(scenarioType) {
  const status = learnCompletion.value?.[scenarioType]?.reinforcement?.status
  return status === 'answered' || status === 'skipped'
}

function requestLearnScenario(typeKey) {
  if (
    learnStep.value === 'entry' &&
    pendingQuickCheck.value?.scenarioType &&
    !isQuickCheckDone(pendingQuickCheck.value.scenarioType)
  ) {
    quickCheckTargetKey.value = typeKey
    quickCheckModalOpen.value = true
    return
  }
  setLearnScenario(typeKey)
}

function onQuickCheckResult(payload) {
  handleReinforcementResult(payload)
  pendingQuickCheck.value = null
}

function onQuickCheckModalClose() {
  quickCheckModalOpen.value = false
  if (quickCheckTargetKey.value) {
    setLearnScenario(quickCheckTargetKey.value)
    quickCheckTargetKey.value = ''
  }
}

/** One friendly line from dwell times when Gemini is off or sanitises hesitation away. */
function buildOfflineHesitationInsight(timings = []) {
  const sig = buildTimingSignalsForAi(timings)
  const slow = sig?.slowestStageNumbers?.filter((n) => n > 0) || []
  if (!slow.length) return ''

  const a = slow[0]
  const b = slow[1]
  if (b && b !== a) {
    return `Longest dwells on stages ${a} & ${b} — rehearse slowing wherever that scripted pacing repeats.`
      .slice(0, 200)
      .trim()
  }

  return `Longest dwell on stage ${a} — note what stalled you before the rush returned.`
    .slice(0, 200)
    .trim()
}

function buildOfflineCoachInsights({ history = [], highPressure = false }) {
  const risks = history.filter((h) => h.choice === 'risk')
  const firstRisk = risks[0]
  const tags = [...new Set(risks.map((h) => h.riskTag).filter(Boolean))]
  const topTag = tags[0] || 'unverified recruiter pressure'

  const paragraph = highPressure
    ? `Compliance kept narrowing before proof arrived — lean on slower verification next time scripts heat up.`
    : `You stayed in the cautious lane repeatedly — that inertia is exactly what scripted hustles expect you to ditch.`

  const topRisk = firstRisk?.riskReason
    ? `${firstRisk.riskReason}`.slice(0, 220).replace(/\.$/, '')
    : risks.length
      ? `The standout pattern was escalating requests around "${topTag}".`
      : `Watch for blurry identity cues paired with timelines that discourage independent checks.`

  const nextAction =
    risks.length &&
    [...new Set(risks.map((h) => String(h.safeAction || '').trim()).filter(Boolean))]
      .slice(0, 2)
      .join(' ')
      ? [...new Set(risks.map((h) => String(h.safeAction || '').trim()).filter(Boolean))]
          .slice(0, 2)
          .join(' ')
      : `Pick one recruiter message this week and run it through official channels before any deposit or identity share.`

  return {
    paragraph,
    topRisk,
    nextAction,
    tone: highPressure ? 'steady-guardrails' : 'confident-grounding',
  }
}

async function markScenarioCompleted(payload) {
  const scenarioType = payload?.scenarioType || learnScamType.value
  if (!scenarioType) return

  const localSummaryTextRaw = String(payload?.localSummaryText || '').trim()
  const localSummaryPoints = Array.isArray(payload?.localSummaryPoints)
    ? payload.localSummaryPoints
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .slice(0, 3)
    : []
  const history = Array.isArray(payload?.feedbackHistory) ? payload.feedbackHistory : []

  const sanitizedHistory = history
    .map((item) => ({
      stage: Number(item?.stage || 0),
      choice: item?.choice === 'risk' ? 'risk' : 'safe',
      riskTag: String(item?.riskTag || ''),
      riskReason: String(item?.riskReason || ''),
      safeAction: String(item?.safeAction || ''),
      learningPoint: String(item?.learningPoint || ''),
      summarySeed: String(item?.summarySeed || ''),
      timestamp: Number(item?.timestamp || Date.now()),
    }))
    .filter((item) => item.stage > 0)

  const fallbackSummaryText =
    localSummaryTextRaw ||
    localSummaryPoints.join(' ') ||
    'You completed the scenario and reviewed key warning patterns.'

  const highRiskCount = sanitizedHistory.filter((item) => item.choice === 'risk').length

  const timingsRaw = Array.isArray(payload?.interactionTiming) ? payload.interactionTiming : []
  const interactionTimingSanitized = timingsRaw
    .map((row) => ({
      stage: Number(row?.stage || 0),
      dwellMs: Number(row?.dwellMs || 0),
      choice: row?.choice === 'risk' ? 'risk' : 'safe',
    }))
    .filter((row) => row.stage > 0)

  simulatorPersonalSummary.value = {
    paragraph: '',
    topRisk: '',
    nextAction: '',
    hesitationInsight: '',
    tone: '',
    loading: false,
    error: '',
    source: 'idle',
  }

  let aiSummaryText = fallbackSummaryText
  let aiSummaryError = ''
  let summarySource = 'idle'

  /** @type {{ paragraph: string, topRisk: string, nextAction: string, tone: string }} */
  let aiCoachPack = buildOfflineCoachInsights({
    history: sanitizedHistory,
    highPressure: Boolean(payload?.highPressure),
  })

  /** @type {string} */
  let hesitationInsightOut = buildOfflineHesitationInsight(interactionTimingSanitized)

  if (sanitizedHistory.length) {
    simulatorPersonalSummary.value = {
      paragraph: '',
      topRisk: '',
      nextAction: '',
      hesitationInsight: '',
      tone: '',
      loading: true,
      error: '',
      source: 'idle',
    }

    try {
      const aiResult = await generateGeminiSummary({
        scenarioType,
        scenarioMeta: payload?.scenarioMeta || {},
        feedbackHistory: sanitizedHistory,
        riskCount: Number(payload?.riskCount || highRiskCount),
        highPressure: Boolean(payload?.highPressure),
        interactionTiming: interactionTimingSanitized,
      })

      if (aiResult.ok && aiResult.data?.summary) {
        aiCoachPack = {
          paragraph: String(aiResult.data.summary || '').trim(),
          topRisk: String(aiResult.data.topRisk || '').trim(),
          nextAction: String(aiResult.data.nextAction || '').trim(),
          tone: String(aiResult.data.tone || '').trim(),
        }
        const fromModel = String(aiResult.data.hesitationInsight ?? '').trim()
        hesitationInsightOut =
          fromModel || buildOfflineHesitationInsight(interactionTimingSanitized)
        aiSummaryText = aiCoachPack.paragraph || fallbackSummaryText
        summarySource = 'ai'
        aiSummaryError = ''
      } else {
        const reason =
          typeof aiResult?.reason === 'string' && aiResult.reason.trim()
            ? aiResult.reason.trim()
            : 'error'
        const detail =
          typeof aiResult?.detail === 'string' && aiResult.detail.trim()
            ? aiResult.detail.trim()
            : ''
        aiSummaryError = formatCoachApiError(reason, detail)
        aiCoachPack = buildOfflineCoachInsights({
          history: sanitizedHistory,
          highPressure: Boolean(payload?.highPressure),
        })
        hesitationInsightOut = buildOfflineHesitationInsight(interactionTimingSanitized)
        aiSummaryText = aiCoachPack.paragraph
        summarySource = 'fallback'
      }
    } catch (err) {
      const msg =
        err instanceof Error && err.message ? err.message.trim() : String(err || '').trim()
      aiSummaryError = formatCoachApiError('exception', msg)
      aiCoachPack = buildOfflineCoachInsights({
        history: sanitizedHistory,
        highPressure: Boolean(payload?.highPressure),
      })
      hesitationInsightOut = buildOfflineHesitationInsight(interactionTimingSanitized)
      aiSummaryText = aiCoachPack.paragraph
      summarySource = 'fallback'
    }

    simulatorPersonalSummary.value = {
      paragraph: aiCoachPack.paragraph,
      topRisk: aiCoachPack.topRisk,
      nextAction: aiCoachPack.nextAction,
      hesitationInsight: hesitationInsightOut,
      tone: aiCoachPack.tone,
      loading: false,
      error: aiSummaryError,
      source: summarySource,
    }
  }

  const recapRiskPoints =
    localSummaryPoints.length > 0
      ? localSummaryPoints
      : [
          ...new Set(
            sanitizedHistory
              .filter((item) => item.choice === 'risk')
              .map(
                (item) =>
                  `Stage ${item.stage}: ${item.riskTag || 'pressure signal'} → ${item.safeAction || 'Pause and verify independently.'}`,
              ),
          ),
        ].slice(0, 3)

  const nextCompletion = {
    ...learnCompletion.value,
    [scenarioType]: {
      completed: true,
      completedAt: Date.now(),
      highPressure: Boolean(payload?.highPressure),
      riskCount: Number(payload?.riskCount || highRiskCount),
      localSummaryPoints,
      localSummaryText: fallbackSummaryText,
      aiSummaryText,
      aiCoach: {
        paragraph: aiCoachPack.paragraph,
        topRisk: aiCoachPack.topRisk,
        nextAction: aiCoachPack.nextAction,
        tone: aiCoachPack.tone,
        hesitationInsight: sanitizedHistory.length ? hesitationInsightOut : '',
      },
      interactionTiming: interactionTimingSanitized,
      aiSummaryError,
      summarySource,
      feedbackHistory: sanitizedHistory,
      recap: {
        highRiskCount: Number(payload?.riskCount || highRiskCount),
        keyRiskPoints: recapRiskPoints,
        improvementAdvice:
          recapRiskPoints[0] ||
          'Pause, verify source authenticity, and never transfer money under urgency pressure.',
      },
    },
  }

  learnCompletion.value = nextCompletion
  persistLearnState({ completedByType: nextCompletion })

  pendingQuickCheck.value = {
    scenarioType,
    feedbackHistory: sanitizedHistory,
  }
}

function handleReinforcementResult(payload) {
  const scenarioType = payload?.scenarioType || learnScamType.value
  if (!scenarioType) return

  const current = learnCompletion.value?.[scenarioType] || {}
  const updatedCompletion = {
    ...learnCompletion.value,
    [scenarioType]: {
      ...current,
      reinforcement: {
        status: String(payload?.status || 'skipped'),
        answer: payload?.answer === 'correct' || payload?.answer === 'wrong' ? payload.answer : '',
        prompt: String(payload?.prompt || ''),
        reason: String(payload?.reason || ''),
        timestamp: Number(payload?.timestamp || Date.now()),
      },
    },
  }

  learnCompletion.value = updatedCompletion
  persistLearnState({ completedByType: updatedCompletion })
}

function navigateToSection(sectionId) {
  isMenuOpen.value = false
  activeNavId.value = sectionId
  isPageFading.value = true
  if (pageFadeTimer) {
    clearTimeout(pageFadeTimer)
  }
  pageFadeTimer = window.setTimeout(() => {
    isPageFading.value = false
  }, 200)
  scrollToSection(sectionId)
}

function handleFooterProductNavigation(item) {
  if (!item?.sectionId) return

  if (item.sectionId === CHECK_SCAM_TARGET_ID || item.sectionId === 'check-section') {
    goToCheckScam()
    return
  }

  navigateToSection(item.sectionId)
}

function goToCheckScam() {
  navigateToSection(CHECK_SCAM_TARGET_ID)
}

function navigateToHowStep(stepNumber) {
  const sectionMap = {
    1: null,
    2: 'insights-section',
    3: 'learn-section',
    4: 'support-section',
  }
  if (stepNumber === '1') {
    goToCheckScam()
  } else {
    const id = sectionMap[stepNumber]
    if (id) navigateToSection(id)
  }
}

function externalAriaLabel(label) {
  return `${label} (opens in a new tab)`
}

function getResourceKey(item) {
  return item.href
}

function isResourceImageReady(item) {
  const key = getResourceKey(item)
  return resourceImageStatus[key] === 'loaded'
}

function markResourceImageLoaded(item) {
  const key = getResourceKey(item)
  resourceImageStatus[key] = 'loaded'
}

function markResourceImageError(event, item) {
  const image = event?.target
  if (!(image instanceof HTMLImageElement)) {
    markResourceImageLoaded(item)
    return
  }

  const fallback = item.fallback || '/icons/StepSafeIcon.png'
  if (image.getAttribute('src') !== fallback) {
    image.setAttribute('src', fallback)
    return
  }

  markResourceImageLoaded(item)
}

function onHeroLottieError() {
  isHeroLottieFailed.value = true
}

function triggerTopAction(action) {
  isMenuOpen.value = false
  submissionQuickMode.value = action.mode
  goToCheckScam()
}

function syncActiveSectionByViewport() {
  const header = document.querySelector('.top-strip')
  const headerHeight = header instanceof HTMLElement ? header.offsetHeight : 0
  const threshold = headerHeight + 80

  let selected = 'home-section'
  for (const id of SCROLL_SECTION_IDS) {
    const node = document.getElementById(id)
    if (!node) continue

    const top = node.getBoundingClientRect().top
    if (top <= threshold) {
      selected = id
    }
  }

  activeNavId.value = selected
}

function updateSnapStageMotion() {
  const stages = document.querySelectorAll('.snap-stage')
  const viewportCenter = window.innerHeight * 0.56

  stages.forEach((node) => {
    if (!(node instanceof HTMLElement)) return

    const rect = node.getBoundingClientRect()
    const center = rect.top + rect.height * 0.5
    const delta = center - viewportCenter
    const normalized = Math.max(-1, Math.min(1, delta / window.innerHeight))
    const offset = Math.round(normalized * 46)
    const scale = Math.max(0.91, 1 - Math.abs(normalized) * 0.06)
    const dim = Math.min(0.36, 0.1 + Math.abs(normalized) * 0.28)
    const curtainProgress = Math.max(0, Math.min(1, -rect.top / (rect.height * 0.68)))
    const curtainShift = Math.round(curtainProgress * 24)

    node.style.setProperty('--parallax-offset', `${offset}px`)
    node.style.setProperty('--stack-scale', `${scale.toFixed(3)}`)
    node.style.setProperty('--stack-dim', `${dim.toFixed(3)}`)
    node.style.setProperty('--curtain-progress', `${curtainProgress.toFixed(3)}`)
    node.style.setProperty('--curtain-shift', `${curtainShift}`)
  })
}

function scheduleSnapStageMotion() {
  if (stageMotionFrame) return

  stageMotionFrame = requestAnimationFrame(() => {
    stageMotionFrame = null
    updateSnapStageMotion()
  })
}

function startScannerStatusLoop() {
  stopScannerStatusLoop()
  scannerStatusTimer = window.setInterval(() => {
    scannerStatusIndex.value = (scannerStatusIndex.value + 1) % scannerStatusLines.length
    scannerPulseTick.value += 1
  }, 1900)
}

function stopScannerStatusLoop() {
  if (scannerStatusTimer) {
    clearInterval(scannerStatusTimer)
    scannerStatusTimer = null
  }
}

function animateValue({ from, to, duration, onTick, onDone }) {
  const start = performance.now()
  const frame = (now) => {
    const progress = Math.min((now - start) / duration, 1)
    const eased = 1 - (1 - progress) ** 3
    onTick(from + (to - from) * eased)

    if (progress < 1) {
      requestAnimationFrame(frame)
      return
    }

    onDone?.()
  }

  requestAnimationFrame(frame)
}

function runStatsAnimation() {
  if (statsAnimated.value) return
  statsAnimated.value = true

  animateValue({
    from: 0,
    to: urgencyStats[0].target,
    duration: 1500,
    onTick: (value) => {
      statsLossValue.value = `$${Math.max(0, value).toFixed(2)}B`
    },
    onDone: () => {
      statsLossValue.value = '$2.18B'
    },
  })

  statsVictimValue.value = '1 in 3'

  animateValue({
    from: 0,
    to: urgencyStats[2].target,
    duration: 1500,
    onTick: (value) => {
      statsTaskValue.value = `${Math.max(0, Math.round(value))}%`
    },
    onDone: () => {
      statsTaskValue.value = '47%'
    },
  })
}

function initStatsObserver() {
  if (!(statsBandRef.value instanceof HTMLElement)) return
  if (statsObserver) {
    statsObserver.disconnect()
  }

  statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        runStatsAnimation()
        statsObserver?.disconnect()
        statsObserver = null
      })
    },
    { threshold: 0.15 },
  )

  statsObserver.observe(statsBandRef.value)
}

function handleWindowScroll() {
  isNavElevated.value = window.scrollY > 8
  syncActiveSectionByViewport()
  scheduleSnapStageMotion()
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

function handleDocumentPointerDown(event) {
  if (!isMenuOpen.value) return

  const target = event.target
  if (!(target instanceof Node)) return

  const menu = document.getElementById('mobile-site-menu')
  const toggle = menuToggleButton.value

  if (menu?.contains(target) || toggle?.contains(target)) return

  closeMenu()
}

function handleGlobalKeydown(event) {
  if (event.key !== 'Escape') return
  if (!isMenuOpen.value) return

  closeMenu()
  nextTick(() => {
    if (menuToggleButton.value instanceof HTMLElement) {
      menuToggleButton.value.focus()
    }
  })
}

function initRevealObserver() {
  if (revealObserver) {
    revealObserver.disconnect()
  }

  const candidates = Array.from(document.querySelectorAll('.reveal-on-scroll'))

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          revealObserver?.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -8% 0px',
    },
  )

  candidates.forEach((node) => revealObserver?.observe(node))
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

function createHeroParticles(count) {
  heroParticleState.particles = Array.from({ length: count }).map(() => ({
    x: randomBetween(0, heroParticleState.width),
    y: randomBetween(0, heroParticleState.height),
    radius: randomBetween(1.2, 2.9),
    alpha: randomBetween(0.35, 0.72),
    vx: randomBetween(-0.18, 0.18),
    vy: randomBetween(-0.14, 0.14),
  }))
}

function resizeHeroParticleCanvas() {
  if (!(heroParticleState.canvas instanceof HTMLCanvasElement)) return
  if (!(heroParticleState.host instanceof HTMLElement)) return

  const width = Math.max(1, heroParticleState.host.clientWidth)
  const height = Math.max(1, heroParticleState.host.clientHeight)
  const dpr = window.devicePixelRatio || 1

  heroParticleState.width = width
  heroParticleState.height = height
  heroParticleState.dpr = dpr

  heroParticleState.canvas.width = Math.floor(width * dpr)
  heroParticleState.canvas.height = Math.floor(height * dpr)
  heroParticleState.canvas.style.width = `${width}px`
  heroParticleState.canvas.style.height = `${height}px`

  if (heroParticleState.context) {
    heroParticleState.context.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  const count = Math.floor(randomBetween(40, 61))
  createHeroParticles(count)
}

function drawHeroParticles() {
  const ctx = heroParticleState.context
  if (!ctx) return

  ctx.clearRect(0, 0, heroParticleState.width, heroParticleState.height)
  ctx.fillStyle = '#D4CFC8'

  heroParticleState.particles.forEach((particle) => {
    ctx.globalAlpha = particle.alpha * 0.4
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
    ctx.fill()
  })

  ctx.globalAlpha = 1
}

function stepHeroParticles() {
  heroParticleState.particles.forEach((particle) => {
    particle.x += particle.vx
    particle.y += particle.vy

    if (particle.x < -8) particle.x = heroParticleState.width + 8
    if (particle.x > heroParticleState.width + 8) particle.x = -8
    if (particle.y < -8) particle.y = heroParticleState.height + 8
    if (particle.y > heroParticleState.height + 8) particle.y = -8
  })
}

function stopHeroParticles() {
  if (particleAnimationFrame) {
    cancelAnimationFrame(particleAnimationFrame)
    particleAnimationFrame = null
  }
}

function runHeroParticleFrame() {
  stepHeroParticles()
  drawHeroParticles()
  particleAnimationFrame = requestAnimationFrame(runHeroParticleFrame)
}

function initHeroParticles() {
  const canvas = heroParticlesCanvas.value
  if (!(canvas instanceof HTMLCanvasElement)) return

  const context = canvas.getContext('2d')
  if (!context) return

  heroParticleState.canvas = canvas
  heroParticleState.context = context
  heroParticleState.host = canvas.parentElement

  resizeHeroParticleCanvas()
  stopHeroParticles()

  const prefersReducedMotion =
    particleReduceMotionQuery instanceof MediaQueryList && particleReduceMotionQuery.matches

  drawHeroParticles()
  if (!prefersReducedMotion) {
    runHeroParticleFrame()
  }
}

onMounted(async () => {
  restoreSiteAuthorization()

  if (isSiteAuthorized.value) {
    await nextTick()
    initializePageShell()
  }
})

watch(showResult, async (visible) => {
  if (!visible) {
    highlightKeySignals.value = false
    return
  }

  await nextTick()
  scrollToSection('result-section')
  initRevealObserver()

  const resultHeading = document.getElementById('result-heading')
  if (resultHeading instanceof HTMLElement) {
    window.setTimeout(() => {
      resultHeading.focus({ preventScroll: true })
    }, 260)
  }

  highlightKeySignals.value = true

  if (highlightTimer) {
    clearTimeout(highlightTimer)
  }

  if (stageMotionFrame) {
    cancelAnimationFrame(stageMotionFrame)
    stageMotionFrame = null
  }

  highlightTimer = window.setTimeout(() => {
    highlightKeySignals.value = false
  }, 3200)
})

onBeforeUnmount(() => {
  teardownPageShell()
})

async function handleSubmission(payload) {
  isAnalyzing.value = true
  result.value = null

  lastEvidenceSnapshot.value = {
    inputType: payload.inputType,
    text: String(payload.text ?? '').trim(),
    link: String(payload.link ?? '').trim(),
  }

  const textContent = await extractTextFromSubmission(payload)
  if (payload.inputType === 'pdf') {
    extractedTextPreview.value = textContent.slice(0, EXTRACTED_PREVIEW_MAX_CHARS)
    if (textContent.length > EXTRACTED_PREVIEW_MAX_CHARS) {
      extractedTextPreview.value += '...'
    }
  } else {
    extractedTextPreview.value = ''
  }

  setTimeout(async () => {
    try {
      result.value = await analyzeTextContentByBackend(textContent, {
        inputType: payload.inputType,
        message_type: payload.inputType === 'link' ? 'Email' : 'Email',
        platform: payload.inputType === 'link' ? 'LinkedIn' : 'Gmail',
        job_type: 'Remote',
      })
    } catch {
      // Backend unavailable: fall back to local rule-based analyzer for demo/testing.
      const local = analyzeTextContent(textContent)
      result.value = {
        ...local,
        binaryLabel: local.suspicious ? 'Suspicious' : 'Not suspicious',
      }
    }
    latestAnalyzedInput.value = textContent
    isAnalyzing.value = false
  }, 850)
}

async function searchAbn() {
  const query = abnQuery.value.trim()

  if (!query) {
    abnError.value = 'Please enter an ABN or business name.'
    abnResults.value = []
    confirmedAbn.value = null
    return
  }

  abnLoading.value = true
  abnError.value = ''
  abnResults.value = []
  confirmedAbn.value = null

  try {
    const result = await lookupAbnByBackend(query)

    abnResults.value = Array.isArray(result.results) ? result.results : []

    if (!abnResults.value.length) {
      abnError.value = result.message || 'No ABN record found.'
    }
  } catch (error) {
    abnError.value = error instanceof Error ? error.message : 'ABN lookup failed.'
  } finally {
    abnLoading.value = false
  }
}

function clearAbn() {
  abnQuery.value = ''
  abnResults.value = []
  abnError.value = ''
  confirmedAbn.value = null
}

function confirmAbn(record) {
  confirmedAbn.value = record
}

function restoreSiteAuthorization() {
  if (!requiresSitePassword.value || typeof window === 'undefined') {
    isSiteAuthorized.value = true
    return
  }

  isSiteAuthorized.value = window.sessionStorage.getItem(SITE_PASSWORD_SESSION_KEY) === 'granted'
}

function initializePageShell() {
  if (hasPageShellInitialized || !isSiteAuthorized.value) return

  hasPageShellInitialized = true
  particleReduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  particleReduceMotionHandler = () => initHeroParticles()
  particleResizeHandler = () => resizeHeroParticleCanvas()

  particleReduceMotionQuery.addEventListener('change', particleReduceMotionHandler)
  window.addEventListener('resize', particleResizeHandler)

  initHeroParticles()
  initRevealObserver()
  initStatsObserver()
  startScannerStatusLoop()
  updateSnapStageMotion()
  loadLearnState()
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('scroll', handleWindowScroll, { passive: true })
  document.addEventListener('pointerdown', handleDocumentPointerDown, true)
  handleWindowScroll()
}

function teardownPageShell() {
  if (revealObserver) {
    revealObserver.disconnect()
  }

  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('scroll', handleWindowScroll)
  document.removeEventListener('pointerdown', handleDocumentPointerDown, true)

  if (statsObserver) {
    statsObserver.disconnect()
  }

  if (pageFadeTimer) {
    clearTimeout(pageFadeTimer)
  }

  if (highlightTimer) {
    clearTimeout(highlightTimer)
  }

  stopHeroParticles()
  stopScannerStatusLoop()

  if (stageMotionFrame) {
    cancelAnimationFrame(stageMotionFrame)
    stageMotionFrame = null
  }

  if (particleReduceMotionQuery && particleReduceMotionHandler) {
    particleReduceMotionQuery.removeEventListener('change', particleReduceMotionHandler)
  }

  if (particleResizeHandler) {
    window.removeEventListener('resize', particleResizeHandler)
  }

  hasPageShellInitialized = false
}

async function unlockSite() {
  if (!requiresSitePassword.value) {
    isSiteAuthorized.value = true
    return
  }

  if (sitePasswordInput.value !== SITE_PASSWORD) {
    sitePasswordError.value = 'Incorrect password. Please try again.'
    return
  }

  sitePasswordError.value = ''
  isSiteAuthorized.value = true
  window.sessionStorage.setItem(SITE_PASSWORD_SESSION_KEY, 'granted')
  await nextTick()
  initializePageShell()
}
</script>

<template>
  <section
    v-if="requiresSitePassword && !isSiteAuthorized"
    class="site-password-gate"
    aria-label="Protected site access"
  >
    <div class="site-password-card">
      <span class="site-password-card__eyebrow">Private preview</span>
      <h1>Enter password to access StepSafe</h1>
      <p>
        This site is password-protected to reduce casual scraping and unauthorized access while the
        project is being reviewed.
      </p>

      <form class="site-password-form" @submit.prevent="unlockSite">
        <label class="site-password-form__label" for="site-password-input"> Site password </label>
        <input
          id="site-password-input"
          v-model="sitePasswordInput"
          class="site-password-form__input"
          type="password"
          autocomplete="current-password"
          placeholder="Enter password"
          @input="sitePasswordError = ''"
        />

        <p v-if="sitePasswordError" class="site-password-form__error" role="alert">
          {{ sitePasswordError }}
        </p>

        <button type="submit" class="site-password-form__button">Unlock site</button>
      </form>
    </div>
  </section>

  <main v-else id="home" class="page-shell">
    <header
      class="top-strip"
      :class="{ 'top-strip--elevated': isNavElevated }"
      aria-label="Top action bar"
    >
      <div class="top-strip__inner">
        <button
          class="brand-home"
          type="button"
          aria-label="Go to Home section"
          @click="navigateToSection('home-section')"
        >
          <img src="/icons/stepsafe_logo.svg" alt="JobSafer" />
          <span>JobSafer</span>
        </button>

        <nav class="top-nav-desktop" aria-label="Primary navigation">
          <button
            type="button"
            class="top-nav-link"
            :class="{ 'top-nav-link--active': activeNavId === 'home-section' }"
            @click="navigateToSection('home-section')"
          >
            Home
          </button>
          <button
            type="button"
            class="top-nav-link"
            :class="{
              'top-nav-link--active':
                activeNavId === CHECK_SCAM_TARGET_ID || activeNavId === 'check-section',
            }"
            @click="goToCheckScam"
          >
            Check scam
          </button>
          <button
            v-for="section in primarySections"
            :key="`desktop-${section.id}`"
            type="button"
            class="top-nav-link"
            :class="{ 'top-nav-link--active': activeNavId === section.id }"
            @click="navigateToSection(section.id)"
          >
            {{ section.label }}
          </button>
        </nav>

        <button
          ref="menuToggleButton"
          type="button"
          class="top-hamburger"
          aria-label="Toggle navigation"
          aria-controls="mobile-site-menu"
          :aria-expanded="isMenuOpen"
          @click="toggleMenu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <button
          v-if="isMenuOpen"
          type="button"
          class="top-menu-backdrop"
          aria-label="Close navigation menu"
          tabindex="-1"
          @click="closeMenu"
        ></button>

        <nav
          id="mobile-site-menu"
          class="top-menu"
          :class="{ 'top-menu--open': isMenuOpen }"
          aria-label="Site navigation"
        >
          <div class="top-menu__inner">
            <button
              type="button"
              class="menu-link menu-link--home"
              @click="navigateToSection('home-section')"
            >
              <span class="menu-link__icon" aria-hidden="true">🏠</span>
              <span class="menu-link__label">Home</span>
            </button>

            <div class="menu-divider" aria-hidden="true"></div>

            <div class="menu-group">
              <button type="button" class="menu-link menu-link--check" @click="goToCheckScam">
                <span class="menu-link__icon" aria-hidden="true">🔍</span>
                <span class="menu-link__label">Check Scam</span>
                <span class="menu-link__badge">Free</span>
              </button>
              <div class="menu-subactions" role="group" aria-label="Check scam quick actions">
                <button
                  v-for="action in topActions"
                  :key="action.label"
                  type="button"
                  class="menu-sublink"
                  @click="triggerTopAction(action)"
                >
                  {{ action.label }}
                </button>
              </div>
            </div>

            <button
              v-for="section in primarySections"
              :key="section.id"
              type="button"
              class="menu-link"
              :class="`menu-link--${section.id.replace('-section', '')}`"
              @click="navigateToSection(section.id)"
            >
              <span class="menu-link__icon" aria-hidden="true">{{
                section.id === 'insights-section'
                  ? '📊'
                  : section.id === 'learn-section'
                    ? '🎮'
                    : '📌'
              }}</span>
              <span class="menu-link__label">{{ section.label }}</span>
            </button>
          </div>
        </nav>
      </div>
    </header>

    <div class="flow-wrapper" :class="{ 'flow-wrapper--fading': isPageFading }">
      <section
        id="home-section"
        class="hero-band scene-panel scene-panel--hero snap-stage section-a section-fade section-fade--hero reveal-on-scroll"
        aria-label="Hero section"
      >
        <canvas ref="heroParticlesCanvas" class="hero-particles" aria-hidden="true"></canvas>
        <div class="container-shell hero-band__inner">
          <div class="hero-copy">
            <p class="hero-eyebrow">
              JobSafer · we help you pause before you pay or share anything
            </p>
            <h1 class="hero-title-kinetic">
              Spot job
              <span class="hero-wordmark"
                ><span class="hero-wordmark__red">scams</span>
                <svg viewBox="0 0 170 22" aria-hidden="true">
                  <path d="M2 16C25 5 42 20 62 12C84 3 103 20 126 12C141 7 152 8 168 13" />
                </svg>
              </span>
              before they cost you.
            </h1>
            <p class="hero-summary copy-block">
              All scams follow patterns — we are here to help you spot them before they cost you.
              Never be ashamed of a tricky script; you are not alone in this.
            </p>
            <div class="hero-tags" aria-label="Common scam angles JobSafer helps with">
              <span>Task scams</span>
              <span>📩 Fake Recruiters</span>
              <span>💸 Upfront Fee Traps</span>
            </div>
            <div class="hero-actions">
              <a
                class="cta-primary cta-primary--solid"
                href="#check-section"
                @click.prevent="goToCheckScam"
              >
                Check scam now
                <ArrowRight :size="16" aria-hidden="true" />
              </a>
              <button
                type="button"
                class="cta-primary cta-primary--secondary"
                @click="navigateToSection('learn-section')"
              >
                Try the simulator
              </button>
            </div>
            <p class="hero-free-note">Free &amp; open to everyone · No sign-up needed</p>
          </div>
          <div class="hero-art" aria-hidden="true">
            <div class="hero-orb hero-orb--a"></div>
            <div class="hero-orb hero-orb--b"></div>
            <div class="hero-art__card">
              <DotLottieVue
                v-if="!isHeroLottieFailed"
                class="hero-lottie"
                :src="FEMALE_LOTTIE_SRC"
                autoplay
                loop
                @error="onHeroLottieError"
              />
              <img
                v-else
                class="hero-lottie-fallback hero-lottie-fallback--visible"
                src="/icons/female-employee-data-security.gif"
                alt="Female security illustration"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      <section
        ref="statsBandRef"
        class="stats-strip scene-panel scene-panel--raise scene-panel--alert snap-stage section-fade section-fade--stats reveal-on-scroll"
        aria-label="Scam impact stats"
      >
        <div class="container-shell stats-strip__inner">
          <article class="stat-tile">
            <p class="stat-tile__value">{{ statsLossValue }}</p>
            <p class="stat-tile__label">{{ urgencyStats[0].label }}</p>
          </article>
          <article class="stat-tile">
            <p class="stat-tile__value" :class="{ 'stat-tile__value--flip': statsAnimated }">
              {{ statsVictimValue }}
            </p>
            <p class="stat-tile__label">{{ urgencyStats[1].label }}</p>
          </article>
          <article class="stat-tile">
            <p class="stat-tile__value">{{ statsTaskValue }}</p>
            <p class="stat-tile__label">{{ urgencyStats[2].label }}</p>
          </article>
        </div>
        <p class="stats-strip__source">{{ statsEvidenceNote }}</p>
      </section>

      <section
        class="how-it-works scene-panel scene-panel--raise snap-stage section-c section-fade section-fade--how"
      >
        <div class="container-shell">
          <div class="how-heading-wrap reveal-on-scroll reveal-soft">
            <p class="scene-kicker">Scam journey map</p>
            <h2 class="section-title">How JobSafer Works</h2>
          </div>
          <p class="how-copy">
            You can start anywhere.
            <span class="how-copy__em how-copy__em--check">Check Scam</span>,
            <span class="how-copy__em how-copy__em--insights">Insights</span>,
            <span class="how-copy__em how-copy__em--learn">Learn</span>, and
            <span class="how-copy__em how-copy__em--support">Support</span>
            work together to keep you safer.
          </p>
          <div class="how-workflow-panel">
            <div class="how-grid">
              <svg
                class="how-grid__connector"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="howConnectorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#D9A441" />
                    <stop offset="58%" stop-color="#0F9F8F" />
                    <stop offset="100%" stop-color="#3B6F8F" />
                  </linearGradient>
                </defs>
                <line class="how-grid__connector-base" x1="0" y1="5" x2="100" y2="5"></line>
                <line class="how-grid__connector-flow" x1="0" y1="5" x2="100" y2="5"></line>
              </svg>
              <article
                v-for="step in howItWorksSteps"
                :key="step.number"
                class="how-step reveal-on-scroll reveal-soft"
                :class="`how-step--${step.number}`"
                :style="{ '--reveal-delay': `${(Number(step.number) - 1) * 150}ms` }"
                role="button"
                tabindex="0"
                :aria-label="`Go to ${step.title} section`"
                @click="navigateToHowStep(step.number)"
                @keydown.enter.prevent="navigateToHowStep(step.number)"
              >
                <p class="how-step__number" :data-step="step.number">{{ step.number }}</p>
                <h3>{{ step.title }}</h3>
                <p>{{ step.description }}</p>
                <p class="how-step__hint">{{ step.hint }}</p>
                <span class="how-step__nav-hint" aria-hidden="true">Go to {{ step.title }} →</span>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section
        id="check-section"
        class="flow-section flow-section--check scene-panel scene-panel--scanner snap-stage section-a section-fade section-fade--check reveal-on-scroll"
        aria-label="Check section"
      >
        <div id="check-scam-panel" class="container-shell">
          <div class="scan-console-shell reveal-on-scroll reveal-soft" aria-hidden="true">
            <p class="scan-console-shell__kicker">Scan status</p>
            <div class="scan-console-shell__line" :key="`scan-status-${scannerPulseTick}`">
              <span class="scan-console-shell__dot"></span>
              <span>{{ scannerStatusCurrent }}</span>
            </div>
            <div class="scan-console-shell__meter" role="presentation">
              <span class="scan-console-shell__meter-bar"></span>
            </div>
          </div>
          <SubmissionPanel
            :quick-mode="submissionQuickMode"
            :is-analyzing="isAnalyzing"
            :preview-mode="false"
            :abn-query="abnQuery"
            :abn-results="abnResults"
            :abn-loading="abnLoading"
            :abn-error="abnError"
            :confirmed-abn="confirmedAbn"
            @submit="handleSubmission"
            @update:abn-query="abnQuery = $event"
            @search-abn="searchAbn"
            @clear-abn="clearAbn"
            @confirm-abn="confirmAbn"
          />
        </div>
      </section>

      <section
        v-if="isAnalyzing"
        class="panel section-b loading-panel reveal-on-scroll"
        aria-label="Analyzing status"
      >
        <div class="container-shell">
          <h2 class="section-title">Analyzing now</h2>
          <p class="copy-block">The content is being processed now.</p>
        </div>
      </section>

      <section
        id="result-section"
        class="flow-section scene-panel scene-panel--raise scene-panel--result snap-stage section-c section-fade section-fade--result reveal-on-scroll"
        aria-label="Result section"
      >
        <div class="container-shell">
          <Transition v-if="showResult" name="result-crossfade" mode="out-in">
            <ResultPanel
              :key="resultPanelTransitionKey"
              :result="result"
              :highlight-key-signals="highlightKeySignals"
              :analysis-input-type="resultPanelAnalysisType"
              :link-evidence-url="resultPanelLinkUrl"
              :message-evidence-plain="resultPanelMessagePlain"
              :extracted-text-preview="extractedTextPreview"
              :analysis-source-text="resultPanelMessagePlain"
            />
          </Transition>
        </div>
      </section>

      <section
        class="info-grid scene-panel scene-panel--resources snap-stage section-c section-fade section-fade--news"
        aria-label="Guidance blocks"
      >
        <div class="container-shell info-grid__inner">
          <article
            class="info-block info-block--warning reveal-on-scroll reveal-slide-left"
            style="--reveal-delay: 0ms"
          >
            <h2 class="section-title">Quick tips</h2>
            <p class="info-summary">Fast scam checks for step-by-step simple tasks fraud.</p>
            <div class="info-layout">
              <div class="info-rows">
                <a
                  v-for="item in quickTips"
                  :key="item.href"
                  class="resource-row"
                  :style="{ '--strip-accent': item.stripColor || '#D0312D' }"
                  :href="item.href"
                  :aria-label="externalAriaLabel(item.title)"
                  title="Opens in a new tab"
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerpolicy="no-referrer"
                >
                  <span class="resource-accent" aria-hidden="true"></span>
                  <div class="resource-main">
                    <p class="resource-title">{{ item.title }}</p>
                    <p class="resource-copy">{{ item.summary }}</p>
                    <span class="resource-source">{{ item.source }}</span>
                  </div>
                  <figure
                    class="resource-media"
                    :class="{ 'resource-media--loading': !isResourceImageReady(item) }"
                    aria-hidden="true"
                  >
                    <img
                      :src="item.image"
                      alt=""
                      loading="lazy"
                      referrerpolicy="no-referrer"
                      @load="markResourceImageLoaded(item)"
                      @error="markResourceImageError($event, item)"
                    />
                  </figure>
                </a>
              </div>
            </div>
          </article>

          <article
            class="info-block info-block--safe reveal-on-scroll reveal-slide-right"
            style="--reveal-delay: 120ms"
          >
            <h2 class="section-title">Scam alerts</h2>
            <p class="info-summary">
              Recent news coverage and case reports on employment and task scams.
            </p>
            <div class="info-layout">
              <div class="info-rows">
                <a
                  v-for="item in learningCards"
                  :key="item.href"
                  class="resource-row"
                  :style="{ '--strip-accent': item.stripColor || '#1F2D6B' }"
                  :href="item.href"
                  :aria-label="externalAriaLabel(item.title)"
                  title="Opens in a new tab"
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerpolicy="no-referrer"
                >
                  <span class="resource-accent" aria-hidden="true"></span>
                  <div class="resource-main">
                    <p class="resource-title">{{ item.title }}</p>
                    <p class="resource-copy">{{ item.summary }}</p>
                    <span class="resource-source">{{ item.source }}</span>
                  </div>
                  <figure
                    class="resource-media"
                    :class="{ 'resource-media--loading': !isResourceImageReady(item) }"
                    aria-hidden="true"
                  >
                    <img
                      :src="item.image"
                      alt=""
                      loading="lazy"
                      referrerpolicy="no-referrer"
                      @load="markResourceImageLoaded(item)"
                      @error="markResourceImageError($event, item)"
                    />
                  </figure>
                </a>
              </div>
            </div>
          </article>
        </div>
      </section>

      <div
        class="editorial-transition editorial-transition--data-band section-fade section-fade--data-bridge"
        aria-hidden="true"
      ></div>

      <section
        id="insights-section"
        class="panel scene-panel scene-panel--data snap-stage section-a section-fade section-fade--insights reveal-on-scroll"
        aria-label="Insights section"
      >
        <div class="container-shell">
          <InsightsPanel />
        </div>
      </section>

      <section
        id="learn-section"
        class="panel scene-panel scene-panel--raise scene-panel--simulator snap-stage section-b section-fade section-fade--learn reveal-on-scroll"
        aria-label="Learn section"
        ref="learnSectionRef"
      >
        <div class="container-shell">
          <div id="learn-core-anchor" class="learn-hero">
            <div class="learn-hero__copy">
              <p class="learn-kicker-main">Scenario simulator</p>
              <h2 class="learn-wave-heading">
                Practice before it
                <span class="learn-wave-word"
                  >happens
                  <svg viewBox="0 0 160 20" aria-hidden="true">
                    <path d="M2 14C20 4 38 18 58 10C78 2 98 18 118 10C133 5 144 7 158 12" />
                  </svg>
                </span>
              </h2>
              <p class="learn-head-summary">
                Work through real scam scripts with Alex. Spot the pressure tactics, make decisions,
                and see exactly where things go wrong.
              </p>
            </div>
          </div>

          <div class="learn-flow-scroll">
            <div id="learn-workflow-anchor" class="learn-flow">
              <div v-if="learnStep === 'entry'" class="learn-entry">
                <p class="learn-entry__eyebrow">Pick your mission</p>
                <h4>Train with Alex</h4>
                <p class="learn-entry__mission-subline">
                  Compact mission board · choose one scenario
                </p>
                <div class="learn-scenario-grid" role="list" aria-label="Scam scenario options">
                  <button
                    v-for="option in learnScenarioOptions"
                    :key="option.key"
                    type="button"
                    class="scenario-chip"
                    :class="{ 'scenario-chip--active': learnScamType === option.key }"
                    @click="requestLearnScenario(option.key)"
                  >
                    <span class="scenario-chip__label">
                      <b>{{ option.label }}</b>
                      <i aria-hidden="true">{{ option.icon }}</i>
                    </span>
                    <em v-if="learnCompletion?.[option.key]?.completed" class="scenario-chip__done"
                      >Done</em
                    >
                  </button>
                </div>
                <div class="learn-entry__actions">
                  <button class="learn-primary" type="button" @click="startWalkthroughDirectly">
                    Start walkthrough
                  </button>
                  <button class="learn-secondary" type="button" @click="startLearnQuiz">
                    Test scam type
                  </button>
                </div>
              </div>

              <div v-else-if="learnStep === 'quiz'" class="learn-quiz-only">
                <ScamTypeQuiz @complete="handleQuizComplete" />
                <button
                  class="learn-secondary learn-secondary--full learn-skip-link"
                  type="button"
                  @click="startWalkthroughDirectly"
                >
                  Skip to walkthrough →
                </button>
              </div>

              <div v-else-if="learnStep === 'quiz_result'" class="learn-quiz-complete">
                <p class="learn-cover__eyebrow">Scam Type Finder result</p>
                <h3>{{ learnMeta.label }}</h3>
                <p>{{ learnMeta.tone }}</p>
                <button
                  class="learn-primary learn-primary--full"
                  type="button"
                  @click="openWalkthroughFromQuiz"
                >
                  See how this scam works — start walkthrough →
                </button>
              </div>

              <ScamSimulation
                v-else
                :scenario-type="learnScamType"
                :detected-label="learnMeta.label"
                :detected-tone="learnMeta.tone"
                :show-detected-result="!!learnQuizResult"
                :coach-paragraph="simulatorPersonalSummary.paragraph"
                :coach-top-risk="simulatorPersonalSummary.topRisk"
                :coach-next-action="simulatorPersonalSummary.nextAction"
                :coach-tone="simulatorPersonalSummary.tone"
                :coach-hesitation-insight="simulatorPersonalSummary.hesitationInsight"
                :coach-source="simulatorPersonalSummary.source"
                :coach-loading="simulatorPersonalSummary.loading"
                :coach-error="simulatorPersonalSummary.error"
                @completed="markScenarioCompleted"
                @restart="backToWorkflowChoice"
                @exit="backToWorkflowChoice"
              />
            </div>

            <SimulatorQuickCheckModal
              :open="quickCheckModalOpen"
              :scenario-type="pendingQuickCheck?.scenarioType || learnScamType"
              :feedback-history="pendingQuickCheck?.feedbackHistory || []"
              @result="onQuickCheckResult"
              @close="onQuickCheckModalClose"
            />
          </div>
        </div>
      </section>

      <section
        id="support-section"
        class="panel scene-panel scene-panel--support snap-stage section-a section-fade section-fade--support reveal-on-scroll"
        aria-label="Support section"
      >
        <div class="container-shell">
          <h2 class="section-title">Support</h2>
          <p class="section-copy copy-block">
            Report suspicious recruiters and keep evidence records to help follow-up investigation.
          </p>
        </div>
      </section>

      <!-- ── Pre-footer CTA band ── -->
      <section
        class="cta-band scene-panel scene-panel--raise scene-panel--final snap-stage"
        aria-label="Call to action"
      >
        <div class="container-shell cta-band__inner">
          <div class="cta-band__text">
            <p class="cta-band__eyebrow">You're not alone</p>
            <h2 class="cta-band__title">Stay one step ahead of scammers</h2>
            <p class="cta-band__sub">
              Check a message, explore the data, or run through a scenario — no sign-up needed.
            </p>
          </div>
          <div class="cta-band__actions">
            <button
              type="button"
              class="cta-band__btn cta-band__btn--primary"
              @click="goToCheckScam"
            >
              Check a message
            </button>
            <button
              type="button"
              class="cta-band__btn cta-band__btn--ghost"
              @click="navigateToSection('learn-section')"
            >
              Try a scenario
            </button>
          </div>
        </div>
      </section>

      <footer class="site-footer" aria-label="Site information">
        <div class="container-shell site-footer__inner">
          <div class="site-footer__brand">
            <img src="/icons/stepsafe_logo.svg" alt="JobSafer" />
            <span>JobSafer</span>
          </div>
          <p class="site-footer__summary">Built for scam awareness and recovery.</p>

          <section class="site-footer__links" aria-label="Footer links and legal">
            <div class="site-footer__col site-footer__col--product">
              <p class="site-footer__heading">Product</p>
              <div class="site-footer__link-list">
                <button
                  v-for="item in footerProductLinks"
                  :key="item.sectionId"
                  type="button"
                  class="site-footer__link site-footer__link--button"
                  @click="handleFooterProductNavigation(item)"
                >
                  <span>{{ item.label }}</span>
                </button>
              </div>
            </div>

            <div class="site-footer__col">
              <p class="site-footer__heading">Resources</p>
              <div class="site-footer__link-list">
                <a
                  v-for="item in footerFriendLinks"
                  :key="item.href"
                  class="site-footer__link"
                  :href="item.href"
                  :aria-label="externalAriaLabel(item.label)"
                  title="Opens in a new tab"
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerpolicy="no-referrer"
                >
                  <span>{{ item.label }}</span>
                </a>
              </div>
            </div>

            <div class="site-footer__col">
              <p class="site-footer__heading">Legal</p>
              <div class="site-footer__link-list">
                <a
                  v-for="item in footerLegalLinks"
                  :key="item.label"
                  class="site-footer__link"
                  :href="item.href"
                >
                  <span>{{ item.label }}</span>
                </a>
              </div>
              <p class="site-footer__meta">©2026 JobSafer</p>
              <div class="site-footer__team" aria-label="Production Team">
                <span class="site-footer__team-label">Production Team</span>
                <img
                  class="site-footer__team-icon"
                  src="/icons/TeamIcon.png"
                  alt="Production Team"
                  loading="lazy"
                />
              </div>
            </div>
          </section>
        </div>
      </footer>
    </div>
  </main>
</template>

<style scoped>
.site-password-gate {
  align-items: center;
  background:
    radial-gradient(circle at top, rgba(27, 46, 94, 0.12), transparent 34%),
    linear-gradient(180deg, #fcf7f1 0%, #f4ede0 100%);
  color: #1a1a2a;
  display: grid;
  min-height: 100vh;
  padding: 32px 20px;
}

.site-password-card {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(27, 46, 94, 0.12);
  border-radius: 28px;
  box-shadow: 0 24px 60px rgba(27, 46, 94, 0.12);
  margin: 0 auto;
  max-width: 540px;
  padding: 32px;
  width: min(100%, 540px);
}

.site-password-card__eyebrow {
  color: #1b2e5e;
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.site-password-card h1 {
  color: #1b2e5e;
  font-family: var(--ms-font-heading);
  font-size: clamp(2rem, 4vw, 2.8rem);
  line-height: 1.05;
  margin: 0 0 12px;
}

.site-password-card p {
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

.site-password-form {
  display: grid;
  gap: 12px;
  margin-top: 24px;
}

.site-password-form__label {
  color: #1b2e5e;
  font-weight: 700;
}

.site-password-form__input {
  background: #fffdfa;
  border: 1px solid #d9d7d1;
  border-radius: 16px;
  color: #1a1a2a;
  font-family: var(--ms-font-stack);
  font-size: 1rem;
  padding: 14px 16px;
}

.site-password-form__input:focus {
  border-color: #1b2e5e;
  box-shadow: 0 0 0 4px rgba(27, 46, 94, 0.12);
  outline: none;
}

.site-password-form__error {
  color: #b42318;
  font-size: 0.92rem;
  margin: 0;
}

.site-password-form__button {
  background: #1b2e5e;
  border: 0;
  border-radius: 999px;
  color: white;
  cursor: pointer;
  font-family: var(--ms-font-stack);
  font-size: 1rem;
  font-weight: 800;
  padding: 14px 18px;
}

.site-password-form__button:hover {
  background: #13244a;
}

.page-shell {
  background: #fcf7f1;
  color: #4b5563;
  min-height: 100vh;
  overflow-x: hidden;
  padding: 0;
  position: relative;
}

:global(html),
:global(body) {
  max-width: 100%;
  overflow-x: hidden;
  scroll-behavior: smooth;
  scroll-snap-type: y mandatory;
}

.container-shell {
  margin: 0 auto;
  max-width: 1280px;
  padding: 0 32px;
}

.flow-wrapper {
  display: grid;
  gap: 0;
  max-width: 100%;
  opacity: 1;
  padding-top: 76px;
  position: relative;
  width: 100%;
  z-index: 1;
  transition: opacity 0.2s ease;
}

/* Scene rhythm + rise-cover transitions */
.scene-panel {
  isolation: isolate;
  position: relative;
  scroll-snap-align: start;
  transform: translate3d(0, var(--parallax-offset, 0px), 0) scale(var(--stack-scale, 1));
  transition:
    transform 0.42s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.42s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

.scene-panel::after {
  background: radial-gradient(
    120% 78% at 50% -8%,
    rgba(15, 23, 42, calc(var(--stack-dim, 0) * 0.42)),
    transparent 68%
  );
  content: '';
  inset: 0;
  opacity: var(--stack-dim, 0);
  pointer-events: none;
  position: absolute;
  z-index: 2;
}

.scene-panel--raise {
  margin-top: -22px;
  z-index: 3;
}

.scene-panel--raise::before {
  background: linear-gradient(180deg, rgba(252, 247, 241, 0.95) 0%, rgba(252, 247, 241, 0) 100%);
  content: '';
  height: 84px;
  left: 0;
  opacity: calc(var(--curtain-progress, 0) * 0.85);
  pointer-events: none;
  position: absolute;
  right: 0;
  top: calc(var(--curtain-shift, 0) * -1px);
  z-index: 1;
}

.scene-panel--hero {
  z-index: 1;
}

.scene-panel--alert {
  box-shadow:
    0 -16px 34px rgba(208, 49, 45, 0.18),
    0 18px 34px rgba(27, 46, 94, 0.1);
  z-index: 4;
}

.scene-panel--scanner,
.scene-panel--result,
.scene-panel--resources,
.scene-panel--data,
.scene-panel--simulator,
.scene-panel--support,
.scene-panel--final {
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
}

.flow-wrapper--fading {
  opacity: 0.86;
}

.section-a {
  background-color: #fcf7f1;
  background-image: none;
}

.section-b {
  background-color: #f4ede0;
  background-image: none;
}

.section-c {
  background-color: #fcf7f1;
  background-image: none;
}

.hero-band {
  background-size: 32px 32px;
}

.flow-section--check {
  background-size: 20px 20px;
}

.section-fade {
  position: relative;
}

.section-fade::after {
  display: none;
}

.editorial-transition {
  background: linear-gradient(180deg, #f4ede0 0%, #fcf7f1 100%);
  border-bottom: 1px solid #e3d7c8;
  border-top: 1px solid #e3d7c8;
  margin: 0;
  min-height: 52px;
  overflow: hidden;
  padding: 18px 0;
  width: 100%;
}

.editorial-transition--data-band {
  background: linear-gradient(110deg, #f4ede0 0%, #fcf7f1 52%, rgba(59, 111, 143, 0.06) 100%);
  border-top: 1px solid #e3d7c8;
  margin: 0;
  min-height: 44px;
  padding: 0;
}

.flow-section--result .container-shell:last-child {
  padding-bottom: 8px;
}

.result-crossfade-enter-active,
.result-crossfade-leave-active {
  transition:
    opacity 0.28s ease,
    transform 0.28s ease;
}

.result-crossfade-enter-from,
.result-crossfade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.result-crossfade-enter-to,
.result-crossfade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.preview-mode-strip {
  align-items: center;
  background: #f4ede0;
  border: 1px solid rgba(27, 46, 94, 0.14);
  border-radius: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 10px 16px;
}

.preview-mode-strip--on {
  background: #1b2e5e;
  border-color: #1b2e5e;
}

.preview-mode-strip__label {
  color: #1b2e5e;
  font-size: 0.82rem;
  font-weight: 500;
  line-height: 1.45;
}

.preview-mode-strip--on .preview-mode-strip__label {
  color: rgba(255, 255, 255, 0.9);
}

.preview-mode-strip__btn {
  background: #1b2e5e;
  border: 0;
  border-radius: 999px;
  color: #ffffff;
  cursor: pointer;
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 6px 10px;
  transition: background 0.2s ease;
}

.preview-mode-strip--on .preview-mode-strip__btn {
  background: #d0312d;
}

.preview-mode-strip__btn:hover,
.preview-mode-strip__btn:focus-visible {
  background: #13244a;
}

.preview-mode-strip--on .preview-mode-strip__btn:hover,
.preview-mode-strip--on .preview-mode-strip__btn:focus-visible {
  background: #b12825;
}

.preview-mode-strip__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preview-mode-strip__btn--active {
  outline: 2px solid rgba(216, 162, 74, 0.95);
  outline-offset: 2px;
}

.preview-mode-strip__btn--ghost {
  background: transparent;
  border: 1px solid rgba(27, 46, 94, 0.35);
  color: #1b2e5e;
}

.preview-mode-strip--on .preview-mode-strip__btn--ghost {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.45);
  color: #fcf7f1;
}

.preview-result-banner {
  align-items: center;
  background: rgba(208, 49, 45, 0.07);
  border: 1px dashed rgba(208, 49, 45, 0.3);
  border-radius: 10px;
  color: #b12825;
  display: flex;
  font-size: 0.78rem;
  font-weight: 600;
  gap: 8px;
  letter-spacing: 0.04em;
  margin-bottom: 14px;
  padding: 8px 14px;
}

.learn-intro-copy {
  margin-top: 0;
  color: #6b7280;
}

.learn-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.88fr);
  gap: 24px;
  align-items: start;
  padding: 20px 0 10px;
}

.learn-shell--review {
  grid-template-columns: minmax(280px, 0.78fr) minmax(0, 1.22fr);
}

.learn-shell--intro {
  grid-template-columns: minmax(0, 1.12fr) minmax(320px, 0.88fr);
}

.learn-hero {
  margin-bottom: 24px;
  padding: 0 4px;
}

.learn-hero__copy {
  max-width: 680px;
}

.learn-kicker-main {
  color: #d8a24a;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.13em;
  margin: 0 0 10px;
  text-transform: uppercase;
}

.learn-wave-heading {
  color: #1b2e5e;
  font-size: clamp(1.9rem, 3.6vw, 2.9rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.08;
  margin: 0 0 14px;
}

.learn-wave-word {
  color: #1b2e5e;
  display: inline-flex;
  font-style: italic;
  margin: 0 5px;
  position: relative;
}

.learn-wave-word svg {
  bottom: -10px;
  left: -2px;
  position: absolute;
  width: 100%;
}

.learn-wave-word path {
  fill: none;
  stroke: #7a9a82;
  stroke-linecap: round;
  stroke-width: 4;
}

.learn-head-summary {
  color: #5a5a5a;
  font-size: 0.98rem;
  line-height: 1.6;
  margin: 0;
  max-width: 560px;
}

.learn-hero__icon {
  width: 76px;
  height: 76px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: #fef2f2;
  border: 1px solid #e5e2dc;
}

.learn-hero__icon img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.learn-hero__eyebrow {
  margin: 0 0 6px;
  font-size: 0.82rem;
  color: #1b2e5e;
  font-weight: 700;
}

.learn-hero__content h3 {
  margin: 0 0 var(--ms-space-title-gap);
  font-size: var(--ms-type-title-lg);
  line-height: var(--ms-line-title-tight);
  letter-spacing: -0.01em;
  color: #1b2e5e;
  font-weight: 800;
  white-space: normal;
  word-wrap: break-word;
}

.learn-hero__content {
  padding-left: 6px;
}

.learn-hero__content p {
  margin: 0;
  color: #6b7280;
  max-width: 64ch;
  font-size: var(--ms-type-body-lg);
  line-height: var(--ms-line-body-loose);
}

.learn-flow-scroll {
  overflow-x: hidden;
  width: 100%;
  max-width: 100%;
}

.learn-flow {
  display: grid;
  gap: var(--ms-space-section-gap);
  width: 100%;
  max-width: 100%;
  margin-inline: auto;
  transition:
    opacity 0.2s ease,
    transform 0.22s ease;
}

.learn-entry {
  background: #fcf7f1;
  border: 1px solid #e3d7c8;
  border-left: 5px solid #3b6f8f;
  border-radius: 20px;
  padding: 20px;
  display: grid;
  gap: 14px;
  box-shadow: 0 12px 24px rgba(27, 46, 94, 0.08);
}

.learn-entry__eyebrow {
  margin: 0;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #1b2e5e;
  font-weight: 800;
}

.learn-entry h4 {
  margin: 0;
  color: #1b2e5e;
  font-size: var(--ms-type-title-md);
  line-height: var(--ms-line-title-regular);
}

.learn-entry__intro {
  margin: 0;
  color: #6b7280;
  font-size: var(--ms-type-body-lg);
  line-height: var(--ms-line-body-loose);
}

.learn-entry__progress {
  margin: 0;
  color: #1b2e5e;
  font-size: var(--ms-type-body-md);
  line-height: var(--ms-line-body-regular);
  font-weight: 700;
}

.learn-entry__statusline {
  margin: 0;
  color: #1b2e5e;
  background: rgba(27, 46, 94, 0.07);
  border: 1px solid rgba(27, 46, 94, 0.14);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 0.82rem;
  line-height: 1.45;
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.learn-entry__statusline-divider {
  color: rgba(27, 46, 94, 0.48);
}

.learn-entry__microhint {
  margin: -2px 0 0;
  color: #1b2e5e;
  font-size: var(--ms-type-body-sm);
  font-weight: 600;
  line-height: var(--ms-line-body-compact);
}

.learn-entry__microhint-inline {
  margin-left: 8px;
  font-weight: 700;
  white-space: normal;
}

.learn-scenario-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.scenario-chip {
  text-align: left;
  border: 1px solid rgba(27, 46, 94, 0.2);
  background: #ffffff;
  border-radius: 14px;
  padding: 12px;
  display: grid;
  gap: 4px;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease;
}

.scenario-chip:hover,
.scenario-chip:focus-visible {
  transform: translateY(-1px);
  border-color: #3b6f8f;
  box-shadow: 0 8px 14px rgba(59, 111, 143, 0.12);
}

.scenario-chip__label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}

.scenario-chip__label i {
  font-style: normal;
  font-size: 1.1rem;
}

.scenario-chip__label b {
  color: #1b2e5e;
  font-weight: 700;
  font-size: var(--ms-type-body-md);
  line-height: var(--ms-line-body-regular);
  order: 1;
}

.scenario-chip__label i {
  order: 2;
}

.scenario-chip__done {
  font-style: normal;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.4rem;
  font-weight: 800;
  color: #166534;
  background: #ecfdf5;
  border: 1px solid rgba(22, 101, 52, 0.24);
  border-radius: 999px;
  padding: 1px 2px;
  line-height: 1.1;
  transform: scale(0.92);
  transform-origin: left center;
}

.scenario-chip--active {
  background: rgba(59, 111, 143, 0.08);
  border-color: rgba(59, 111, 143, 0.28);
}

.learn-entry--compact {
  gap: 10px;
  padding: 16px 18px;
}

.learn-entry__progress-line {
  color: #4b5563;
  font-size: 0.8rem;
  line-height: 1.4;
  margin: 0;
}

.learn-scenario-list {
  display: grid;
  gap: 6px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.scenario-row {
  align-items: center;
  background: #ffffff;
  border: 1px solid rgba(27, 46, 94, 0.16);
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  gap: 10px;
  min-height: 60px;
  max-height: 72px;
  padding: 0 12px;
  text-align: left;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
  width: 100%;
}

.scenario-row:hover,
.scenario-row:focus-visible {
  border-color: rgba(59, 111, 143, 0.45);
  background: rgba(59, 111, 143, 0.05);
}

.scenario-row--active {
  background: rgba(59, 111, 143, 0.1);
  border-color: rgba(59, 111, 143, 0.4);
}

.scenario-row__icon {
  flex: 0 0 auto;
  font-size: 1.1rem;
  line-height: 1;
}

.scenario-row__label {
  color: #1b2e5e;
  flex: 1 1 auto;
  font-size: 0.86rem;
  font-weight: 700;
  line-height: 1.25;
  min-width: 0;
}

.scenario-row__badge {
  background: #ecfdf5;
  border: 1px solid rgba(22, 101, 52, 0.22);
  border-radius: 999px;
  color: #166534;
  flex: 0 0 auto;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  padding: 3px 8px;
  text-transform: uppercase;
}

.learn-entry__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.learn-primary--compact,
.learn-secondary--compact {
  min-height: 40px;
  padding: 8px 14px;
  font-size: 0.84rem;
}

.learn-primary--full,
.learn-secondary--full {
  width: 100%;
}

.learn-skip-link {
  margin-top: 8px;
}

.learn-cover {
  background: #fcf7f1;
  border-radius: 22px;
  border: 1px solid #e3d7c8;
  border-left: 5px solid #d8a24a;
  padding: 22px;
  display: grid;
  gap: 14px;
  box-shadow: 0 8px 24px rgba(216, 162, 74, 0.12);
}

.learn-quiz-complete {
  background: #fcf7f1;
  border-radius: 22px;
  border: 1px solid #e3d7c8;
  border-left: 5px solid #d8a24a;
  padding: 22px;
  display: grid;
  gap: 14px;
  box-shadow: 0 8px 20px rgba(216, 162, 74, 0.1);
}

.learn-cover__eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
  font-weight: 700;
  color: #1b2e5e;
}

.learn-cover__steps {
  display: grid;
  gap: 10px;
}

.learn-step {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 10px;
  align-items: center;
  background: #f4ede0;
  border-radius: 14px;
  padding: 10px 12px;
  border: 1px solid rgba(27, 46, 94, 0.08);
}

.learn-step span {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e8412a;
  color: #ffffff;
  font-weight: 700;
}

.learn-cover__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.learn-primary,
.learn-secondary {
  border-radius: 14px;
  padding: 12px 16px;
  font-weight: 700;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  min-height: 44px;
  font-size: var(--ms-type-body-md);
  line-height: var(--ms-line-body-compact);
  transition:
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.learn-primary::after,
.learn-secondary::after {
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

.learn-primary {
  background: #1b2e5e;
  color: #ffffff;
  box-shadow: 0 10px 20px rgba(27, 46, 94, 0.18);
}

.learn-primary:hover,
.learn-primary:focus-visible {
  background: #13244a;
  box-shadow: 0 14px 24px rgba(27, 46, 94, 0.22);
}

.learn-primary:active {
  box-shadow: 0 10px 18px rgba(27, 46, 94, 0.18);
}

.learn-secondary {
  background: #fcf7f1;
  color: #1b2e5e;
  border: 1px solid rgba(27, 46, 94, 0.18);
}

.term {
  font-weight: 700;
}

.term--walkthrough {
  color: #1b2e5e;
}

.term--check {
  color: #0f766e;
}

.learn-secondary:hover,
.learn-secondary:focus-visible {
  background: #f4ede0;
}

.learn-secondary:active {
  box-shadow: 0 8px 14px rgba(27, 46, 94, 0.14);
}

.learn-primary:hover::after,
.learn-primary:focus-visible::after,
.learn-secondary:hover::after,
.learn-secondary:focus-visible::after {
  transform: translateX(0);
}

.learn-lock {
  background: #fcf7f1;
  border-radius: 18px;
  border: 1px dashed rgba(27, 46, 94, 0.28);
  padding: 18px;
  display: grid;
  gap: 12px;
  color: #4b5563;
  box-shadow: 0 12px 24px rgba(27, 46, 94, 0.06);
}

.learn-lock__image {
  width: 100%;
  border-radius: 16px;
  display: block;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border: 1px solid rgba(27, 46, 94, 0.08);
}

.learn-lock__eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
  color: #1b2e5e;
  font-weight: 700;
}

.learn-quiz,
.learn-simulation {
  display: grid;
  gap: 16px;
}

.learn-header {
  background: #fcf7f1;
  color: #1b2e5e;
  border-radius: 18px;
  padding: 18px;
  border: 1px solid #e3d7c8;
  border-left: 5px solid #3b6f8f;
  box-shadow: 0 8px 20px rgba(59, 111, 143, 0.1);
}

.learn-header--complete {
  box-shadow:
    0 0 0 2px rgba(232, 65, 42, 0.24),
    0 14px 28px rgba(27, 46, 94, 0.08);
}

.learn-kicker {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
  color: #3b6f8f;
  font-weight: 700;
}

.learn-header h3 {
  margin: 8px 0 6px;
  font-size: 1.4rem;
}

.learn-copy {
  margin: 0;
  color: #6b7280;
}

.learn-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  background: rgba(232, 65, 42, 0.1);
  color: #1b2e5e;
  border: 1px solid rgba(232, 65, 42, 0.2);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
}

.learn-quiz-complete__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.learn-quiz-complete__hint {
  color: #6b7280;
  font-size: 0.9rem;
}

.learn-complete {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fff7df;
  border: 1px solid rgba(232, 65, 42, 0.16);
  color: #1a1a2a;
}

@media (max-width: 980px) {
  .learn-shell {
    grid-template-columns: 1fr;
  }

  .learn-shell--review,
  .learn-shell--intro {
    grid-template-columns: 1fr;
  }
}

.copy-block {
  line-height: 1.7;
  margin: 0;
  max-width: 65ch;
}

.top-strip {
  color: #1a1a2a;
  left: 0;
  padding: 10px 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 90;
}

.top-strip__inner {
  align-items: center;
  background: rgba(252, 247, 241, 0.97);
  border: 1px solid #e3d7c8;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(59, 111, 143, 0.06);
  display: flex;
  gap: 14px;
  margin: 0 auto;
  max-width: 1200px;
  min-height: 35px;
  padding: 4px 24px;
  position: relative;
  transition: box-shadow 0.24s ease;
  width: calc(100% - 96px);
}

.top-strip--elevated .top-strip__inner {
  box-shadow: 0 8px 22px rgba(59, 111, 143, 0.14);
}

.brand-home {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 20px;
  color: #1b2e5e;
  cursor: pointer;
  display: inline-flex;
  font-size: 0.94rem;
  font-weight: 800;
  gap: 8px;
  letter-spacing: -0.01em;
  min-height: 35px;
  margin-right: 8px;
  padding: 6px 12px;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.brand-home:hover {
  opacity: 0.78;
}

.brand-home img {
  background: transparent;
  display: block;
  height: 24px;
  object-fit: contain;
  width: auto;
}

.top-nav-desktop {
  align-items: center;
  display: inline-flex;
  gap: 8px;
  margin-left: auto;
}

.top-nav-link {
  background: transparent;
  border: 0;
  border-radius: 20px;
  color: #2b2b2b;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  min-height: 35px;
  padding: 6px 14px;
  position: relative;
  transition: all 200ms ease;
}

.top-nav-link:hover,
.top-nav-link:focus-visible {
  background: rgba(59, 111, 143, 0.08);
  color: #3b6f8f;
}

/* Active: navy text + mustard bottom-line — no filled pill */
.top-nav-link--active {
  color: #1b2e5e;
  font-weight: 700;
}

.top-nav-link--active::after {
  background: #d8a24a;
  border-radius: 2px;
  bottom: 4px;
  content: '';
  height: 2px;
  left: 14px;
  position: absolute;
  right: 14px;
}

.top-nav-cta {
  background: #1b2e5e;
  border: 0;
  border-radius: 24px;
  color: #fcf7f1;
  cursor: pointer;
  font-size: 0.84rem;
  font-weight: 700;
  min-height: 28px;
  overflow: hidden;
  padding: 6px 16px;
  position: relative;
  transition:
    background 0.25s ease,
    box-shadow 0.25s ease;
}

.top-nav-cta::after {
  background: linear-gradient(
    90deg,
    rgba(59, 111, 143, 0) 0%,
    rgba(59, 111, 143, 0.4) 60%,
    rgba(216, 162, 74, 0.5) 100%
  );
  content: '';
  inset: 0;
  position: absolute;
  transform: translateX(-100%);
  transition: transform 0.35s ease;
}

.top-nav-cta:hover,
.top-nav-cta:focus-visible {
  background: #13244a;
  box-shadow: 0 6px 18px rgba(27, 46, 94, 0.22);
}

.top-nav-cta:hover::after,
.top-nav-cta:focus-visible::after {
  transform: translateX(0);
}

.top-nav-cta--active {
  box-shadow: 0 6px 18px rgba(27, 46, 94, 0.22);
}

.top-hamburger {
  background: transparent;
  border: 0;
  cursor: pointer;
  display: none;
  height: 28px;
  margin-left: auto;
  padding: 6px 4px;
  width: 28px;
}

.top-hamburger span {
  background: #1b2e5e;
  display: block;
  height: 2px;
  margin-bottom: 4px;
  width: 16px;
}

.top-hamburger span:last-child {
  margin-bottom: 0;
}

.top-menu {
  background: linear-gradient(160deg, #1b2e5e 0%, #2a4f7a 100%);
  border: 1px solid rgba(252, 247, 241, 0.12);
  border-radius: 18px;
  box-shadow: 0 16px 40px rgba(27, 46, 94, 0.35);
  display: none;
  inset: calc(100% + 4px) 48px auto;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  position: absolute;
  transition:
    max-height 0.26s ease,
    opacity 0.2s ease;
  min-width: 240px;
}

.top-menu--open {
  max-height: 560px;
  opacity: 1;
  pointer-events: auto;
  z-index: 101;
}

.top-menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  margin: 0;
  padding: 0;
  border: 0;
  background: rgba(15, 23, 42, 0.28);
  cursor: default;
}

.top-menu__inner {
  display: grid;
  gap: 2px;
  padding: 14px 0 16px;
}

.menu-link,
.menu-sublink {
  align-items: center;
  background: transparent;
  border: 0;
  color: rgba(252, 247, 241, 0.8);
  cursor: pointer;
  display: flex;
  font-size: 0.92rem;
  font-weight: 600;
  gap: 10px;
  min-height: 44px;
  padding: 10px 20px;
  text-align: left;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
  width: 100%;
}

.menu-link__icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.menu-link__label {
  flex: 1;
}

.menu-link__badge {
  background: rgba(216, 162, 74, 0.25);
  border: 1px solid rgba(216, 162, 74, 0.4);
  border-radius: 999px;
  color: #d8a24a;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 2px 7px;
  text-transform: uppercase;
}

.menu-link:hover,
.menu-link:focus-visible,
.menu-sublink:hover,
.menu-sublink:focus-visible {
  background: rgba(252, 247, 241, 0.08);
  color: #fcf7f1;
}

.menu-link--home {
  color: rgba(252, 247, 241, 0.7);
}

.menu-link--check {
  background: rgba(208, 49, 45, 0.12);
  border-left: 3px solid #d0312d;
  color: #fcf7f1;
  font-size: 1rem;
  font-weight: 800;
  padding-left: 17px;
}

.menu-link--check:hover,
.menu-link--check:focus-visible {
  background: rgba(208, 49, 45, 0.2);
}

.menu-divider {
  background: rgba(252, 247, 241, 0.1);
  height: 1px;
  margin: 4px 20px;
}

.menu-group {
  display: grid;
  gap: 2px;
}

.menu-subactions {
  display: grid;
  gap: 2px;
  padding-left: 0;
}

.menu-sublink {
  color: rgba(252, 247, 241, 0.55);
  font-size: 0.8rem;
  font-weight: 500;
  padding-left: 50px;
}

.menu-sublink:hover,
.menu-sublink:focus-visible {
  color: rgba(252, 247, 241, 0.85);
}

.hero-band {
  overflow: hidden;
  padding: 82px 0 52px;
  position: relative;
  isolation: isolate;
}

.hero-particles {
  inset: 0;
  opacity: 0.4;
  pointer-events: none;
  position: absolute;
  z-index: 0;
}

.hero-band__inner {
  display: grid;
  gap: 26px;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
  position: relative;
  z-index: 1;
}

.hero-copy {
  background: transparent;
  padding: 0;
  position: relative;
  z-index: 2;
}

.hero-eyebrow {
  color: #3b6f8f;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  margin: 0 0 18px;
  text-transform: uppercase;
}

h1 {
  color: #1b2e5e;
  font-size: clamp(3rem, 6vw, 64px);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.04;
  margin: 0 0 26px;
  max-width: 980px;
}

.hero-wordmark {
  color: #1b2e5e;
  display: inline-flex;
  font-size: 1.08em;
  font-style: italic;
  margin: 0 4px;
  position: relative;
}

.hero-wordmark svg {
  bottom: -12px;
  left: -2px;
  position: absolute;
  width: 100%;
}

.hero-wordmark path {
  fill: none;
  stroke: #d8a24a;
  stroke-linecap: round;
  stroke-width: 4.5;
  stroke-dasharray: 220;
  stroke-dashoffset: 220;
  animation: heroUnderlineDraw 920ms cubic-bezier(0.22, 1, 0.36, 1) 360ms forwards;
}

.hero-wordmark__red {
  color: #d0312d;
  display: inline-block;
  opacity: 0;
  transform: translateY(12px) scale(0.96);
  animation: heroScamWordIn 620ms cubic-bezier(0.22, 1, 0.36, 1) 160ms forwards;
}

.hero-title-kinetic {
  animation: heroHeadlineIn 620ms cubic-bezier(0.22, 1, 0.36, 1) 20ms both;
}

.hero-free-note {
  color: #7a7a7a;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  margin: 10px 0 0;
}

.hero-highlight {
  color: #1b2e5e;
}

.hero-summary {
  color: #2b2b2b;
  font-size: 1.05rem;
  line-height: 1.65;
  margin: 0 0 18px;
  max-width: 540px;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0 0 22px;
}

.hero-tags span {
  background: #eef2ff;
  border-radius: 20px;
  color: #1b2e5e;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 12px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin: 0 0 12px;
}

.hero-actions .cta-band__btn {
  min-height: 48px;
}

.cta-primary {
  align-items: center;
  background: #1b2e5e;
  border-radius: 12px;
  border: 2px solid transparent;
  box-sizing: border-box;
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  justify-content: center;
  line-height: 1.2;
  min-height: 48px;
  padding: 14px 24px;
  text-decoration: none;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.hero-actions .cta-primary--secondary {
  background: #ffffff;
  border-color: #1b2e5e;
  color: #1b2e5e;
}

.hero-actions .cta-primary--secondary:hover,
.hero-actions .cta-primary--secondary:focus-visible {
  background: rgba(27, 46, 94, 0.06);
  border-color: #1b2e5e;
  color: #1b2e5e;
  transform: translateY(-1px);
}

.hero-actions .cta-primary--secondary:active {
  background: rgba(27, 46, 94, 0.1);
}

.hero-actions .cta-primary--solid:hover,
.hero-actions .cta-primary--solid:focus-visible {
  background: #152952;
  color: #ffffff;
  transform: translateY(-1px);
}

.hero-actions .cta-primary--solid:active {
  background: #152952;
}

.hero-art {
  align-items: center;
  background: transparent;
  display: flex;
  justify-content: center;
  min-height: 300px;
  pointer-events: none;
  padding: 8px;
  position: relative;
  z-index: 0;
}

.hero-orb {
  border-radius: 999px;
  filter: blur(0.3px);
  pointer-events: none;
  position: absolute;
  z-index: 0;
}

.hero-orb--a {
  animation: ambientDriftA 8.8s ease-in-out infinite;
  background: radial-gradient(circle at 35% 35%, rgba(216, 164, 65, 0.44), rgba(216, 164, 65, 0));
  height: 170px;
  right: 34px;
  top: 18px;
  width: 170px;
}

.hero-orb--b {
  animation: ambientDriftB 10.4s ease-in-out infinite;
  background: radial-gradient(circle at 55% 55%, rgba(139, 111, 246, 0.26), rgba(139, 111, 246, 0));
  bottom: 10px;
  height: 196px;
  right: -24px;
  width: 196px;
}

.hero-art__card {
  align-items: center;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  display: flex;
  justify-content: center;
  min-height: auto;
  overflow: visible;
  padding: 0;
  position: relative;
}

.hero-lottie {
  animation: heroFloat 5.4s ease-in-out infinite;
  display: block;
  height: min(360px, 68vw);
  transform: scale(1.9);
  transform-origin: center;
  width: min(340px, 100%);
}

.hero-lottie-fallback {
  display: none;
  height: min(360px, 68vw);
  object-fit: cover;
  width: min(340px, 100%);
}

.hero-lottie-fallback--visible {
  display: block;
}

.preview-band__visual {
  border-radius: 12px;
  justify-self: start;
  margin: 0;
  overflow: hidden;
}

.preview-band__lottie {
  animation: previewFloat 3.2s ease-in-out infinite;
  border: 0;
  display: block;
  height: 84px;
  width: 130px;
}

.stats-strip {
  background: #d0312d;
  border-top: 4px solid #d0312d;
  border-radius: 16px 16px 0 0;
  color: #ffffff;
  margin-top: 0;
  overflow: hidden;
  position: relative;
  z-index: 4;
}

.stats-strip::before {
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.28) 1px, transparent 1px);
  background-size: 14px 14px;
  content: '';
  inset: 0;
  opacity: 0.05;
  pointer-events: none;
  position: absolute;
}

.stats-strip__inner {
  align-items: stretch;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding-bottom: 22px;
  padding-top: 22px;
  position: relative;
  z-index: 1;
}

.stats-strip__source {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.78rem;
  line-height: 1.5;
  margin: 8px auto 0;
  max-width: 1280px;
  padding: 0 28px 14px;
  position: relative;
  word-break: break-word;
  z-index: 1;
}

.stat-tile {
  border-right: 1px solid rgba(255, 255, 255, 0.32);
  padding-right: 16px;
}

.stat-tile:last-child {
  border-right: 0;
  padding-right: 0;
}

.stat-tile__value {
  color: #ffffff;
  font-size: clamp(1.45rem, 2.3vw, 2.1rem);
  font-weight: 800;
  line-height: 1;
  margin: 0 0 6px;
}

.stat-tile__value--flip {
  animation: statFlip 0.6s ease;
}

.stat-tile__label {
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0;
}

.how-it-works {
  background: #ffffff;
  padding: 64px 0 64px;
}

.how-it-works > .container-shell {
  background: #ffffff;
  border: 1px solid #e3d7c8;
  border-radius: 22px;
  box-shadow: none;
  padding: 28px 28px 24px;
}

.how-it-works .section-title {
  color: #1b2e5e;
}

.how-it-works .section-title::after {
  background: #d8a24a;
}

.how-workflow-panel {
  background: #fcf7f1;
  border: 1px solid #e3d7c8;
  border-radius: 16px;
  margin-top: 16px;
  padding: 18px 18px 16px;
}

.how-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  position: relative;
}

.how-copy {
  color: #2b2b2b;
  font-size: 0.98rem;
  line-height: 1.6;
  margin: 0 0 16px;
  max-width: 62ch;
}

.how-copy__em {
  font-weight: 800;
}

.how-copy__em--check {
  color: #1b2e5e;
}

.how-copy__em--insights {
  color: #3b6f8f;
}

.how-copy__em--learn {
  color: #1b2e5e;
}

.how-copy__em--support {
  color: #5a5a5a;
}

.how-grid__connector {
  height: 10px;
  left: 12%;
  position: absolute;
  right: 12%;
  top: 27px;
  width: 76%;
  z-index: 0;
}

.how-grid__connector line {
  animation: howDashFlow 2s linear infinite;
  fill: none;
  opacity: 0.35;
  stroke: #3b6f8f;
  stroke-dasharray: 6 8;
  stroke-width: 2;
}

.how-grid__connector-base {
  stroke: rgba(27, 46, 94, 0.26);
  stroke-dasharray: 0;
}

.how-grid__connector-flow {
  opacity: 1;
  stroke: url(#howConnectorGradient);
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation:
    howConnectorDraw 1.25s cubic-bezier(0.22, 1, 0.36, 1) 220ms forwards,
    howDashFlow 2.1s linear 1.35s infinite;
}

.how-step {
  background: transparent;
  border-radius: 0;
  cursor: pointer;
  outline: none;
  padding: 18px;
  position: relative;
  z-index: 1;
}

/* Step 2: mustard accent on dark bg */
.how-step--2 .how-step__number {
  border-color: #d8a24a;
  color: #d8a24a;
}

/* Step 3: sage on dark bg */
.how-step--3 .how-step__number {
  border-color: #7a9a82;
  color: #7a9a82;
}

/* Step 4: Support — dark numeral on ivory panel */
.how-step--4 .how-step__number {
  background: #f4ede0;
  border-color: #1b2e5e;
  color: #1b2e5e;
}

.how-step__number {
  align-items: center;
  background: #fcf7f1;
  border: 2px solid #e3d7c8;
  border-radius: 999px;
  color: #1b2e5e;
  display: inline-flex;
  font-size: 16px;
  font-weight: 800;
  height: 42px;
  justify-content: center;
  line-height: 1;
  margin: 0 0 12px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
  width: 42px;
}

.how-step:hover .how-step__number,
.how-step:focus-within .how-step__number {
  background: #f4ede0;
  border-color: #3b6f8f;
  color: #1b2e5e;
  transform: scale(1.06);
}

.how-step--2:hover .how-step__number,
.how-step--2:focus-within .how-step__number {
  background: #d8a24a;
  border-color: #d8a24a;
  color: #fcf7f1;
}

.how-step--3:hover .how-step__number,
.how-step--3:focus-within .how-step__number {
  background: #7a9a82;
  border-color: #7a9a82;
  color: #fcf7f1;
}

.how-step--4:hover .how-step__number,
.how-step--4:focus-within .how-step__number {
  background: #1b2e5e;
  border-color: #1b2e5e;
  color: #fcf7f1;
}

.how-step h3 {
  color: #1b2e5e;
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 10px;
  transition: color 0.18s ease;
}

.how-step:hover h3,
.how-step:focus-within h3 {
  color: #3b6f8f;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.how-step p {
  color: #2b2b2b;
  font-size: 14px;
  line-height: 1.45;
  margin: 0;
}

.how-step__hint {
  color: #1b2e5e;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  margin-top: 8px;
  opacity: 0.74;
}

.how-step__nav-hint {
  color: #3b6f8f;
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-top: 10px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.how-step:hover .how-step__nav-hint,
.how-step:focus-within .how-step__nav-hint {
  opacity: 1;
}

.info-grid {
  background: linear-gradient(180deg, #f4ede0 0%, #f4ede0 62%, rgba(244, 237, 224, 0.9) 100%);
  border-top: 1px solid #e3d7c8;
  padding: 64px 0 64px;
}

/* Column blocks: warm-sand editorial wrapper */
.info-grid .info-block {
  background: #fcf7f1;
  border: 1px solid #e3d7c8;
  border-radius: 18px;
  box-shadow: 0 14px 28px rgba(27, 46, 94, 0.08);
  padding: 24px 24px 22px;
  position: relative;
  overflow: hidden;
}

.info-grid .info-block::before {
  background: linear-gradient(90deg, transparent, rgba(217, 164, 65, 0.34), transparent);
  content: '';
  height: 2px;
  left: 12px;
  position: absolute;
  right: 12px;
  top: 0;
}

.info-grid .section-title {
  color: #1b2e5e;
  font-size: clamp(1.15rem, 2.2vw, 1.45rem);
}
.info-grid .info-block--warning .section-title {
  border-left-color: #d0312d;
}
.info-grid .info-block--warning .section-title::after {
  background: #d0312d;
}
.info-grid .info-block--safe .section-title {
  border-left-color: #3b6f8f;
}
.info-grid .info-block--safe .section-title::after {
  background: #3b6f8f;
}

.info-grid .info-summary {
  color: #3b6f8f;
  font-size: 0.87rem;
  margin-bottom: 18px;
}

/* Items: light ivory surface with thin accent border */
.info-grid .info-rows {
  gap: 10px;
}

.info-grid .resource-row {
  align-items: flex-start;
  background: #fcf7f1;
  border: 1px solid #e3d7c8;
  border-bottom: 1px solid #e3d7c8;
  border-left: 3px solid var(--strip-accent, #1b2e5e);
  border-radius: 10px;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) 88px;
  padding: 12px 14px;
  position: relative;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease;
}

.info-grid .resource-row::after {
  background: linear-gradient(
    100deg,
    rgba(216, 162, 74, 0),
    rgba(216, 162, 74, 0.26),
    rgba(139, 111, 246, 0.18)
  );
  content: '';
  inset: 0;
  opacity: 0;
  pointer-events: none;
  position: absolute;
  transition: opacity 0.2s ease;
}

.info-grid .resource-row:hover,
.info-grid .resource-row:focus-visible {
  background: #ffffff;
  border-color: rgba(27, 46, 94, 0.22);
  box-shadow: 0 10px 22px rgba(27, 46, 94, 0.12);
  transform: translateY(-4px);
}

.info-grid .resource-row:hover::after,
.info-grid .resource-row:focus-visible::after {
  opacity: 1;
}

/* Hide old left accent strip */
.info-grid .resource-accent {
  display: none;
}

.info-grid .resource-title {
  color: #1b2e5e;
  font-size: 0.93rem;
  font-weight: 700;
}

.info-grid .resource-copy {
  color: #2b2b2b;
  font-size: 0.81rem;
}

.info-grid .resource-source {
  background: transparent;
  border: 1px solid #e3d7c8;
  color: #3b6f8f;
}

.info-grid .resource-media {
  transition: transform 0.24s ease;
}

.info-grid .resource-row:hover .resource-media,
.info-grid .resource-row:focus-visible .resource-media {
  transform: translateY(-2px) scale(1.04);
}

.info-grid .info-block--safe .resource-source {
  border-color: #e3d7c8;
  color: #3b6f8f;
}

/* Quick tips: red accent */
.info-block--warning .section-title {
  border-left-color: #d0312d;
}

.info-block--warning .section-title::after {
  background: #d0312d;
}

/* Scam alerts: sage green accent */
.info-block--safe .section-title {
  border-left-color: #7a9a82;
}

.info-block--safe .section-title::after {
  background: #7a9a82;
}

.section-title {
  border-left: 5px solid #1b2e5e;
  color: #1b2e5e;
  font-size: clamp(1.9rem, 3.4vw, 2.6rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin: 0 0 16px;
  padding-left: 14px;
}

.section-title::after {
  background: #d8a24a;
  border-radius: 2px;
  content: '';
  display: block;
  height: 4px;
  margin-top: 10px;
  width: 52px;
}

.info-grid__inner {
  align-items: start;
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr 1fr;
  padding-bottom: 0;
}

.info-grid__closure {
  background: #fcf7f1;
  border: 1px solid #e3d7c8;
  border-radius: 12px;
  color: #4b5563;
  font-size: 0.82rem;
  grid-column: 1 / -1;
  line-height: 1.55;
  margin: 4px 0 0;
  padding: 14px 18px;
  text-align: center;
}

.panel {
  background: transparent;
  padding: 0;
}

.info-block {
  background: transparent;
  padding: 0;
}

.info-summary {
  color: #6b7280;
  font-size: 15px;
  line-height: 1.4;
  margin: 0 0 14px;
}

.info-layout {
  display: block;
}

.info-rows {
  display: grid;
  gap: 0;
}

.resource-row {
  align-items: flex-start;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #d5d1ca;
  border-radius: 0;
  box-shadow: 0 0 0 rgba(26, 26, 42, 0);
  color: #6b7280;
  display: grid;
  gap: 14px;
  grid-template-columns: 3px minmax(0, 1fr) 120px;
  min-height: 0;
  padding: 18px 12px;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.resource-row:hover,
.resource-row:focus-visible {
  border-color: #bab4ab;
  box-shadow: 0 14px 24px rgba(26, 26, 42, 0.14);
  transform: translateY(-4px);
}

.resource-row:hover .resource-accent,
.resource-row:focus-visible .resource-accent {
  filter: saturate(1.12) brightness(1.03);
}

.resource-accent {
  background: linear-gradient(180deg, var(--strip-accent, #d0312d), #1a1a2a);
  border-radius: 999px;
  display: inline-flex;
  height: calc(100% - 6px);
  margin-top: 3px;
  min-height: 80px;
  transition: filter 0.2s ease;
}

.resource-inset {
  align-items: center;
  background: rgba(27, 46, 94, 0.08);
  color: #1b2e5e;
  border-radius: 12px;
  display: flex;
  height: 52px;
  justify-content: center;
  width: 52px;
}

.resource-inset--learn {
  background: rgba(27, 46, 94, 0.08);
  color: #1b2e5e;
}

.resource-main {
  align-self: center;
  display: grid;
  gap: 8px;
  min-width: 0;
  overflow-wrap: anywhere;
}

.resource-title {
  color: #1a1a2a;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 6px;
}

.resource-copy {
  color: #6b7280;
  font-size: 15px;
  font-weight: 400;
  line-height: 1.35;
  margin: 0 0 6px;
}

.resource-source {
  align-self: start;
  background: rgba(27, 46, 94, 0.06);
  border: 1px solid rgba(27, 46, 94, 0.18);
  border-radius: 999px;
  color: #1b2e5e;
  display: inline-flex;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  max-width: max-content;
  padding: 4px 10px;
  white-space: nowrap;
  text-transform: uppercase;
}

.info-block--safe .resource-source {
  background: rgba(122, 154, 130, 0.1);
  border-color: rgba(122, 154, 130, 0.22);
  color: #5a7e63;
}

.resource-media {
  align-self: flex-start;
  border-radius: 6px;
  height: 66px;
  margin: 0;
  overflow: hidden;
  width: 88px;
}

.resource-media img {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.resource-media--loading {
  background: #f2efe8;
}

.flow-section {
  scroll-margin-top: 112px;
}

/* Legacy snap-stage hooks kept inert — editorial motion uses reveal-on-scroll only */
.snap-stage::before,
.snap-stage::after {
  display: none;
}

.snap-stage .container-shell {
  filter: none;
  transform: none;
}

.flow-section--check {
  background: #fcf7f1;
  overflow-x: clip;
  padding: 64px 0 64px;
  position: relative;
}

.flow-section--check::before {
  display: none;
}

.scan-console-shell {
  align-items: center;
  background: linear-gradient(
    110deg,
    rgba(11, 25, 58, 0.96) 0%,
    rgba(26, 54, 106, 0.96) 56%,
    rgba(15, 159, 143, 0.84) 100%
  );
  border: 1px solid rgba(252, 247, 241, 0.22);
  border-radius: 14px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 16px 28px rgba(15, 23, 42, 0.25);
  color: #fcf7f1;
  display: grid;
  gap: 10px;
  grid-template-columns: auto 1fr;
  margin: 0 0 16px;
  padding: 12px 14px;
}

.scan-console-shell__kicker {
  color: rgba(252, 247, 241, 0.78);
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  margin: 0;
  text-transform: uppercase;
}

.scan-console-shell__line {
  align-items: center;
  animation: scannerLinePulse 0.38s ease;
  display: inline-flex;
  gap: 9px;
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.scan-console-shell__dot {
  animation: scannerDotBlink 1.3s ease-in-out infinite;
  background: #d9a441;
  border-radius: 999px;
  box-shadow: 0 0 0 0 rgba(217, 164, 65, 0.55);
  display: inline-flex;
  height: 9px;
  width: 9px;
}

.scan-console-shell__meter {
  background: rgba(252, 247, 241, 0.2);
  border-radius: 999px;
  grid-column: 1 / -1;
  height: 5px;
  overflow: hidden;
  position: relative;
}

.scan-console-shell__meter-bar {
  animation: scannerMeterSweep 2.4s ease-in-out infinite;
  background: linear-gradient(90deg, #d9a441, #0f9f8f 58%, #8b6ff6);
  border-radius: inherit;
  display: block;
  height: 100%;
  width: 46%;
}

.preview-band {
  background: linear-gradient(110deg, #f4ede0 0%, #fcf7f1 60%, rgba(59, 111, 143, 0.05) 100%);
  border-bottom: 1px solid #e3d7c8;
  border-top: 1px solid #e3d7c8;
  overflow: hidden;
  padding: 18px 0;
  position: relative;
}

.preview-band--animated::before {
  animation: previewSweep 2.8s ease-in-out infinite;
  background: linear-gradient(120deg, rgba(59, 111, 143, 0.08), rgba(59, 111, 143, 0));
  content: '';
  inset: 0;
  pointer-events: none;
  position: absolute;
}

.preview-band__inner {
  align-items: center;
  display: grid;
  gap: 20px;
  grid-template-columns: auto minmax(0, 1fr);
}

.preview-band__title {
  color: #1b2e5e;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  margin: 0 0 4px;
  text-transform: none;
}

.preview-band__byline {
  color: #5a5a5a;
  font-size: 0.82rem;
  letter-spacing: 0.02em;
  margin: 0 0 8px;
}

.panel {
  padding: 44px 0;
}

.section-fade--insights {
  background: linear-gradient(180deg, #f8fbfd 0%, #fcf7f1 100%);
}

.panel.section-fade--insights {
  padding-top: 64px;
}

@media (max-width: 767px) {
  .panel.section-fade--insights {
    padding-top: 20px;
  }
}

.section-fade--learn {
  background: linear-gradient(180deg, rgba(59, 111, 143, 0.14) 0%, #3b6f8f 24%);
  padding-top: 64px;
}

/* learn hero text on Steel Blue background */
.section-fade--learn .learn-kicker-main {
  color: #d8a24a;
}
.section-fade--learn .learn-wave-heading {
  color: #fcf7f1;
}
.section-fade--learn .learn-wave-word {
  color: #fcf7f1;
}
.section-fade--learn .learn-head-summary {
  color: rgba(252, 247, 241, 0.78);
}

.section-copy {
  color: #6b7280;
  line-height: 1.7;
  margin: 0 0 22px;
  font-size: 1rem;
}

.preview-placeholder {
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(229, 226, 220, 0.9);
  border-radius: 12px;
  box-shadow: none;
  padding: 22px;
}

.preview-placeholder__subtitle {
  color: #6b7280;
  margin: 0 0 16px;
}

.preview-placeholder__grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.preview-placeholder__card {
  animation: shimmerSkeleton 1.5s ease-in-out infinite;
  background: linear-gradient(90deg, #f2efe8 0%, #e5e2dc 50%, #f2efe8 100%);
  background-size: 200% 100%;
  border-radius: 10px;
  display: block;
  height: 120px;
}

.feature-preview-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.feature-preview {
  align-items: center;
  background: #ffffff;
  border-left: 4px solid #1b2e5e;
  border-radius: 0;
  color: #1a1a2a;
  display: grid;
  gap: 8px;
  min-height: 120px;
  padding: 16px 18px;
  position: relative;
}

.feature-preview h3 {
  color: #1a1a2a;
  margin: 0;
}

.feature-preview span {
  background: transparent;
  border-radius: 0;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
  padding: 0;
  position: static;
}

.feature-preview-note {
  color: #6b7280;
  margin: 14px 0 0;
}

/* ── Pre-footer CTA band ───────────────────────────────── */
.cta-band {
  background: #1b2e5e;
  padding: 72px 0;
}

.cta-band__inner {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 40px;
  justify-content: space-between;
}

.cta-band__text {
  flex: 1;
  max-width: 560px;
  min-width: 260px;
}

.cta-band__eyebrow {
  color: #d8a24a;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  margin: 0 0 12px;
  text-transform: uppercase;
}

.cta-band__title {
  color: #fcf7f1;
  font-size: clamp(1.8rem, 3.2vw, 2.6rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.18;
  margin: 0 0 14px;
}

.cta-band__sub {
  color: rgba(252, 247, 241, 0.72);
  font-size: 1rem;
  line-height: 1.65;
  margin: 0;
  max-width: 460px;
}

.cta-band__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.cta-band__btn {
  border-radius: 28px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 700;
  padding: 13px 28px;
  transition:
    background 0.22s ease,
    box-shadow 0.22s ease,
    transform 0.18s ease;
}

.cta-band__btn--primary {
  background: #fcf7f1;
  border: 0;
  color: #1b2e5e;
}

.cta-band__btn--primary:hover {
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(252, 247, 241, 0.25);
  transform: translateY(-2px);
}

.cta-band__btn--ghost {
  background: transparent;
  border: 2px solid rgba(252, 247, 241, 0.35);
  color: #fcf7f1;
}

.cta-band__btn--ghost:hover {
  border-color: #d8a24a;
  box-shadow: 0 8px 24px rgba(216, 162, 74, 0.2);
  color: #d8a24a;
  transform: translateY(-2px);
}

/* ─────────────────────────────────────────────────────── */

.site-footer {
  background: #0f1e3d;
  border-top: 0;
  color: #f2efe8;
  padding: 40px 0 42px;
}

.site-footer__inner {
  display: grid;
  gap: 14px;
}

.site-footer__brand {
  align-items: center;
  display: inline-flex;
  font-size: 1.08rem;
  font-weight: 700;
  gap: 10px;
}

.site-footer__summary {
  color: #f2efe8;
  line-height: 1.5;
  margin: 0;
}

.site-footer__brand img {
  height: 40px;
  object-fit: contain;
  width: auto;
}

.site-footer__links {
  border-bottom: 1px solid rgba(252, 247, 241, 0.12);
  border-top: 1px solid rgba(252, 247, 241, 0.08);
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 18px 0 16px;
}

.site-footer__col--product .site-footer__link-list {
  display: grid;
  gap: 6px;
}

.site-footer__heading {
  color: rgba(252, 247, 241, 0.55);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin: 0 0 10px;
  text-transform: uppercase;
}

.site-footer__link-list {
  display: grid;
  gap: 6px;
}

.site-footer__link {
  align-items: center;
  border-radius: 20px;
  color: #f2efe8;
  display: inline-flex;
  font-size: 14px;
  line-height: 1.35;
  min-height: 35px;
  padding: 6px 14px;
  text-decoration: none;
  word-break: break-word;
}

.site-footer__link--button {
  background: transparent;
  border: 0;
  cursor: pointer;
  font: inherit;
  justify-content: flex-start;
  text-align: left;
}

.site-footer__link:hover,
.site-footer__link:focus-visible {
  background: rgba(216, 162, 74, 0.15);
  color: #d8a24a;
  text-decoration: none;
}

.site-footer__meta {
  color: #f2efe8;
  font-size: 0.86rem;
  margin: 8px 0 0;
}

.site-footer__team {
  align-items: center;
  display: inline-flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
}

.site-footer__team-label {
  color: #f2efe8;
  font-size: 0.8rem;
  font-weight: 600;
}

.site-footer__team-icon {
  background: transparent;
  border: 0;
  border-radius: 0;
  display: block;
  height: 46px;
  object-fit: contain;
  width: auto;
}

@keyframes scanSweep {
  0% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(252px);
  }

  100% {
    transform: translateY(0);
  }
}

@keyframes resultFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes statFlip {
  0% {
    opacity: 0;
    transform: rotateX(90deg);
  }

  100% {
    opacity: 1;
    transform: rotateX(0);
  }
}

@keyframes shieldPulse {
  0% {
    opacity: 0;
    transform: scale(0.75);
    transform-origin: 140px 138px;
  }

  25% {
    opacity: 0.8;
  }

  100% {
    opacity: 0;
    transform: scale(1.32);
    transform-origin: 140px 138px;
  }
}

@keyframes shieldGridFlicker {
  0%,
  100% {
    opacity: 0.2;
  }

  50% {
    opacity: 0.85;
  }
}

@keyframes shieldCheckTrace {
  0% {
    stroke-dashoffset: 86;
  }

  40% {
    stroke-dashoffset: 0;
  }

  70% {
    stroke-dashoffset: 0;
  }

  100% {
    stroke-dashoffset: -86;
  }
}

@keyframes shieldSparkle {
  0%,
  100% {
    opacity: 0.25;
    transform: scale(0.9);
    transform-origin: center;
  }

  50% {
    opacity: 1;
    transform: scale(1.25);
    transform-origin: center;
  }
}

@keyframes shimmerSkeleton {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

@keyframes previewSweep {
  0% {
    opacity: 0;
    transform: translateX(-35%);
  }

  25% {
    opacity: 1;
  }

  80% {
    opacity: 0.1;
    transform: translateX(35%);
  }

  100% {
    opacity: 0;
    transform: translateX(40%);
  }
}

@keyframes previewChipIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes previewFloat {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-5px);
  }
}

@keyframes heroHeadlineIn {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes heroScamWordIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes heroUnderlineDraw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes heroFloat {
  0%,
  100% {
    transform: scale(1.9) translateY(0px);
  }

  50% {
    transform: scale(1.9) translateY(-10px);
  }
}

@keyframes howDashFlow {
  from {
    stroke-dashoffset: 0;
  }

  to {
    stroke-dashoffset: -56;
  }
}

@keyframes howConnectorDraw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes scannerDotBlink {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(217, 164, 65, 0.55);
    opacity: 0.72;
  }

  55% {
    box-shadow: 0 0 0 6px rgba(217, 164, 65, 0);
    opacity: 1;
  }
}

@keyframes scannerMeterSweep {
  0% {
    transform: translateX(-58%);
  }

  50% {
    transform: translateX(108%);
  }

  100% {
    transform: translateX(-58%);
  }
}

@keyframes scannerLinePulse {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ambientDriftA {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(24px, -16px, 0) scale(1.08);
  }

  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes ambientDriftB {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(-28px, 18px, 0) scale(1.05);
  }

  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
}

.reveal-on-scroll {
  --reveal-duration: 0.36s;
  --reveal-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --reveal-x: 0px;
  --reveal-y: 8px;
  opacity: 0;
  transform: translate3d(var(--reveal-x), var(--reveal-y), 0);
  transition:
    opacity var(--reveal-duration) var(--reveal-ease),
    transform var(--reveal-duration) var(--reveal-ease);
  transition-delay: var(--reveal-delay, 0ms);
}

.reveal-on-scroll.is-visible {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

.reveal-slide-left {
  --reveal-duration: 0.38s;
  --reveal-x: -12px;
  --reveal-y: 0;
}

.reveal-slide-right {
  --reveal-duration: 0.38s;
  --reveal-x: 12px;
  --reveal-y: 0;
}

.reveal-soft {
  --reveal-duration: 0.36s;
  --reveal-y: 8px;
}

.reveal-fade-up {
  --reveal-duration: 0.36s;
  --reveal-y: 8px;
}

.result-section-enter {
  animation: none;
}

@media (max-width: 980px) {
  .container-shell {
    padding: 0 24px;
  }

  .section-title {
    font-size: 32px;
  }

  /* Reduce vertical padding on tall sections when narrow */
  .how-it-works {
    padding: 48px 0;
  }

  .info-grid {
    padding: 44px 0 40px;
  }

  /* How-it-works grid: reduce columns on medium screens */
  .how-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .top-strip {
    padding: 8px 14px;
  }

  .top-strip__inner {
    border-radius: 20px;
    max-width: 100%;
    min-height: 35px;
    padding: 4px 14px;
    width: calc(100% - 48px);
  }

  .top-nav-desktop {
    display: none;
  }

  .top-hamburger {
    display: inline-block;
  }

  .top-menu {
    display: block;
    inset: calc(100% + 4px) 24px auto;
  }

  .hero-band__inner,
  .info-grid__inner,
  .feature-preview-grid {
    grid-template-columns: 1fr;
  }

  .learn-scenario-grid {
    grid-template-columns: 1fr;
  }

  .preview-band__inner {
    grid-template-columns: 1fr;
  }

  .preview-band__visual {
    justify-self: start;
  }

  .resource-row {
    align-items: flex-start;
    display: flex;
    gap: 12px;
    padding: 14px 10px;
  }

  .resource-main {
    flex: 1 1 auto;
    min-width: 0;
  }

  .resource-media {
    flex: 0 0 64px;
    height: 64px;
    width: 64px;
    min-width: 64px;
  }

  .stats-strip__inner,
  .how-grid,
  .preview-placeholder__grid {
    grid-template-columns: 1fr;
  }

  .stats-strip__source {
    padding: 0 24px;
  }

  .how-grid__connector {
    display: none;
  }

  .stat-tile {
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.32);
    padding-bottom: 12px;
    padding-right: 0;
  }

  .stat-tile:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }
}

@media (max-width: 760px) {
  :global(html),
  :global(body) {
    scroll-snap-type: none;
  }

  .scene-panel {
    transform: none;
  }

  .scene-panel::after,
  .scene-panel--raise::before {
    display: none;
  }

  .scene-panel--raise {
    margin-top: 0;
  }

  .top-strip {
    padding: 8px 10px;
  }

  .top-strip__inner {
    min-height: 35px;
    padding: 4px 10px;
    width: calc(100% - 20px);
  }

  .top-menu {
    inset: calc(100% + 4px) 16px auto;
  }

  .stats-strip__source {
    font-size: 0.74rem;
    padding: 0 16px;
  }

  .menu-link,
  .menu-sublink {
    padding: 10px 26px;
  }

  .menu-sublink {
    padding-left: 40px;
  }

  h1 {
    font-size: clamp(2.2rem, 10vw, 3rem);
  }

  .section-title {
    font-size: 28px;
  }

  .hero-band,
  .flow-section--check,
  .preview-band,
  .panel,
  .site-footer {
    padding: 34px 0;
  }

  .how-it-works {
    padding: 36px 0;
  }

  .info-grid {
    padding: 36px 0 32px;
  }

  /* how-grid: 1 column on very narrow */
  .how-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .site-footer__links {
    grid-template-columns: 1fr;
  }

  .site-footer__team {
    justify-content: flex-start;
  }
}

@media (max-width: 767px) {
  .info-grid {
    padding: 24px 0 22px;
  }

  .info-grid__inner {
    gap: 14px;
    grid-template-columns: 1fr;
  }

  .info-block {
    background: #f4ede0;
    border: 1px solid #e3d7c8;
    border-radius: 12px;
    padding: 12px 12px 10px;
  }

  .info-grid .section-title {
    font-size: 1.35rem;
    margin-bottom: 8px;
  }

  .info-summary {
    font-size: 0.84rem;
    line-height: 1.4;
    margin-bottom: 8px;
  }

  .info-rows {
    gap: 6px;
  }

  .info-grid .resource-row {
    align-items: flex-start;
    background: #fcf7f1;
    border: 1px solid #e3d7c8;
    border-radius: 8px;
    box-shadow: none;
    display: flex;
    flex-direction: row;
    gap: 10px;
    grid-template-columns: unset;
    max-height: 110px;
    min-height: 84px;
    padding: 8px 10px;
    transform: none;
  }

  .info-grid .resource-row:hover,
  .info-grid .resource-row:focus-visible {
    background: #ffffff;
    box-shadow: none;
    transform: none;
  }

  .resource-main {
    flex: 1 1 auto;
    min-width: 0;
  }

  .resource-title {
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    display: -webkit-box;
    font-size: 0.88rem;
    line-height: 1.3;
    margin: 0 0 2px;
    overflow: hidden;
  }

  .resource-copy {
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    display: -webkit-box;
    font-size: 0.76rem;
    line-height: 1.35;
    margin: 0 0 4px;
    overflow: hidden;
  }

  .resource-source {
    background: transparent;
    border: 0;
    display: inline;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    max-width: none;
    padding: 0;
    text-transform: uppercase;
    white-space: normal;
  }

  .resource-media {
    border-radius: 8px;
    flex: 0 0 56px;
    height: 56px;
    min-width: 56px;
    width: 56px;
  }
}

/* ── 480px and below: compact mobile ── */
@media (max-width: 480px) {
  .container-shell {
    padding: 0 16px;
  }

  h1 {
    font-size: clamp(1.9rem, 9vw, 2.5rem);
  }

  .section-title {
    font-size: 22px;
  }

  .hero-band,
  .flow-section--check,
  .preview-band,
  .panel,
  .site-footer {
    padding: 28px 0;
  }

  .how-it-works {
    padding: 28px 0;
  }

  .info-grid {
    padding: 28px 0 24px;
  }

  /* Quick Tips / Scam Alerts: full-width copy, compact thumb on the right */
  .resource-row {
    align-items: flex-start;
    display: flex;
    flex-direction: row;
    gap: 10px;
    padding: 10px 8px;
    width: 100%;
  }

  .resource-accent {
    flex: 0 0 3px;
    min-height: 48px;
    width: 3px;
  }

  .resource-main {
    flex: 1 1 auto;
    min-width: 0;
    width: auto;
  }

  .resource-media {
    flex: 0 0 48px;
    align-self: flex-start;
    height: 48px;
    width: 48px;
    min-width: 48px;
    border-radius: 8px;
    overflow: hidden;
    margin: 0;
    float: none;
  }

  .resource-media img {
    height: 100%;
    width: 100%;
    object-fit: cover;
    display: block;
  }

  .resource-title {
    font-size: 0.9rem;
  }

  .resource-copy {
    font-size: 0.78rem;
    line-height: 1.45;
  }

  .resource-source {
    font-size: 0.66rem;
  }

  /* Hero area compact */
  .hero-band {
    padding-bottom: 32px;
  }

  .hero-band__inner {
    gap: 20px;
  }

  .hero-tags {
    margin-bottom: 14px;
  }

  .hero-free-note {
    font-size: 0.75rem;
    margin-bottom: 6px;
  }

  .flow-section--check {
    padding-top: 64px;
  }

  .flow-section--check::before {
    height: 28px;
    top: -28px;
  }

  /* How it works compact */
  .how-step {
    padding: 12px 10px;
  }

  .how-step h3 {
    margin-bottom: 4px;
    font-size: 1rem;
  }

  .how-step p {
    font-size: 0.82rem;
    line-height: 1.4;
    margin: 0;
  }

  .how-step__number {
    width: 38px;
    height: 38px;
    font-size: 1rem;
    margin-bottom: 8px;
  }

  .how-grid {
    gap: 12px;
  }

  /* Navigation compact */
  .top-strip__inner {
    padding: 4px 8px;
    min-height: 32px;
  }

  .top-wordmark {
    font-size: 0.9rem;
  }

  /* Footer compact */
  .site-footer {
    padding: 24px 0 20px;
  }

  .site-footer__links {
    gap: 12px;
  }

  /* CTA band compact */
  .cta-band {
    padding: 36px 0;
  }
}

/* ── 375px: smallest supported width ── */
@media (max-width: 375px) {
  .container-shell {
    padding: 0 12px;
  }

  h1 {
    font-size: clamp(1.7rem, 8.5vw, 2.2rem);
    letter-spacing: -0.03em;
  }

  .section-title {
    font-size: 20px;
  }

  .hero-band,
  .flow-section--check,
  .panel {
    padding: 22px 0;
  }

  .how-it-works,
  .info-grid {
    padding: 22px 0 20px;
  }

  /* Resource rows: tightest on 375px */
  .resource-row {
    padding: 8px 6px;
  }

  .resource-media {
    height: 36px;
    width: 36px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
  }

  .hero-particles {
    display: none;
  }

  .hero-lottie {
    display: none;
  }

  .hero-lottie-fallback {
    display: block;
  }

  .reveal-on-scroll,
  .reveal-on-scroll.is-visible {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .scene-panel,
  .scene-panel--raise {
    margin-top: 0;
    transform: none;
  }

  .scene-panel::after,
  .scene-panel--raise::before,
  .hero-orb {
    display: none;
  }
}
</style>
