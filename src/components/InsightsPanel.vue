<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { formatMoney, formatNumber } from '../utils/chartFormatters.js'
import LeafletD3Map from './LeafletD3Map.vue'
import PersonPictogramChart from './PersonPictogramChart.vue'
import DualAxisTrendChart from './DualAxisTrendChart.vue'
import {
  getAggregateSummary,
  getAgeDistribution,
  getScamTypeLabel,
  getLocationTrendByScamType,
  getScamTypeOptions,
  getScamTypeRank,
  getTimePeriod,
  getTrendByScamType,
  getAvailableYears,
} from '../services/scamInsightsService'

const scamTypeOptions = getScamTypeOptions()
const scamTypeLabelByValue = new Map(scamTypeOptions.map((option) => [option.value, option.label]))
const selectedScamType = ref(scamTypeOptions[0]?.value || '')
const selectedView = ref('trend')

const allYears = getAvailableYears()
const selectedYear = ref(allYears[0] || 2019)
const isPlaying = ref(false)
let playTimer = null

const viewOptions = [
  { key: 'trend', label: 'Trend & loss' },
  { key: 'age', label: 'Age groups' },
  { key: 'location', label: 'Location map' },
  { key: 'summary', label: 'Dataset summary' },
]

const trendData = computed(() => getTrendByScamType(selectedScamType.value))
const ageData = computed(() => getAgeDistribution(selectedScamType.value))
const summary = computed(() => getAggregateSummary())
const rankInfo = computed(() => getScamTypeRank(selectedScamType.value))
const timePeriod = computed(() => getTimePeriod())

const locationTrendData = computed(() => getLocationTrendByScamType(selectedScamType.value))

const insightsSceneKey = computed(() => `${selectedView.value}-${selectedScamType.value}`)
const selectedScamTypeLabel = computed(
  () => scamTypeLabelByValue.get(selectedScamType.value) || getScamTypeLabel(selectedScamType.value),
)

const yearLocationData = computed(() =>
  locationTrendData.value.filter((row) => Number(row.year) === Number(selectedYear.value)),
)

const totalAgeReports = computed(() =>
  ageData.value.reduce((sum, row) => sum + Number(row.value || 0), 0),
)

const youthAgeGroup = computed(() =>
  ageData.value.find((row) => row.label === '18–24' || row.label === '18-24'),
)

function getRelatableShareLabel(percent) {
  const safePercent = Number(percent || 0)

  if (!Number.isFinite(safePercent) || safePercent < 1) {
    return 'Less than 1 in 100'
  }

  if (safePercent >= 99) {
    return 'Almost everyone'
  }

  const friendlyBenchmarks = [
    { percent: 50, denominator: 2 },
    { percent: 33.3, denominator: 3 },
    { percent: 25, denominator: 4 },
    { percent: 20, denominator: 5 },
    { percent: 10, denominator: 10 },
    { percent: 5, denominator: 20 },
    { percent: 2, denominator: 50 },
    { percent: 1, denominator: 100 },
  ]

  const benchmark =
    friendlyBenchmarks.find((item) => safePercent >= item.percent - 3.5) ||
    friendlyBenchmarks[friendlyBenchmarks.length - 1]

  if (safePercent >= benchmark.percent + 3.5) {
    return `More than 1 in ${benchmark.denominator}`
  }

  if (safePercent < benchmark.percent) {
    return `Nearly 1 in ${benchmark.denominator}`
  }

  return `About 1 in ${benchmark.denominator}`
}

const agePictogramItems = computed(() => {
  if (!youthAgeGroup.value) return []

  const share = totalAgeReports.value
    ? (Number(youthAgeGroup.value.value || 0) / totalAgeReports.value) * 100
    : 0

  return [
    {
      label: '18–24',
      displayValue: `${formatNumber(youthAgeGroup.value.value)} reports`,
      helper: `${getRelatableShareLabel(share)} reports involved someone aged 18 to 24`,
      percent: share,
      statLabel: getRelatableShareLabel(share),
      statCaption: `${share.toFixed(1)}% of reports for this scam type came from 18 to 24 year olds`,
      highlighted: true,
      badge: 'Young job seekers',
    },
  ]
})

watch(selectedScamType, () => {
  if (allYears.length) {
    selectedYear.value = allYears[0]
  }
  stopPlayback()
})

function startPlayback() {
  if (isPlaying.value) return

  isPlaying.value = true

  playTimer = setInterval(() => {
    const currentIndex = allYears.indexOf(Number(selectedYear.value))
    const nextIndex = currentIndex >= allYears.length - 1 ? 0 : currentIndex + 1
    selectedYear.value = allYears[nextIndex]
  }, 1200)
}

function stopPlayback() {
  isPlaying.value = false
  if (playTimer) {
    clearInterval(playTimer)
    playTimer = null
  }
}

onBeforeUnmount(() => {
  stopPlayback()
})
</script>

<template>
  <section class="insights-panel" aria-label="Scam insights dashboard">
    <div class="insights-header">
      <div class="insights-hero">
        <p class="insights-kicker">Scam trends &amp; patterns</p>
        <h2 class="insights-wave-heading">
          Real scam
          <span class="insights-wave-word"
            >data
            <svg viewBox="0 0 100 18" aria-hidden="true">
              <path d="M2 12C16 4 28 16 42 9C57 2 70 16 85 10C91 7 94 8 98 11" />
            </svg>
          </span>
          from Australia
        </h2>
        <p class="insights-head-summary">
          Choose a scam type to explore loss trends, age groups, and regional patterns from reported
          data.
        </p>
      </div>
    </div>

    <div class="insights-buttons" aria-label="Choose insight type">
      <button
        v-for="option in viewOptions"
        :key="option.key"
        type="button"
        class="insights-button ms-control ms-control--pill"
        :class="{ 'insights-button--active': selectedView === option.key }"
        @click="selectedView = option.key"
      >
        {{ option.label }}
      </button>

      <label class="insights-select">
        <span class="insights-select__label">Scam type</span>
        <select v-model="selectedScamType" class="ms-select">
          <option v-for="type in scamTypeOptions" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
      </label>
    </div>

    <Transition name="insights-scene" mode="out-in">
      <article
        v-if="selectedView === 'trend'"
        :key="`trend-${insightsSceneKey}`"
        class="insights-card insights-card--scene"
      >
        <DualAxisTrendChart
          :scam-type="selectedScamType"
          :trend-data="trendData"
          :time-period="timePeriod"
        />
      </article>

      <article
        v-else-if="selectedView === 'age'"
        :key="`age-${insightsSceneKey}`"
        class="age-hero-card insights-card--scene"
      >
        <div class="age-hero-copy">
          <h3>Young adult risk indicator</h3>
          <p>
            This view focuses on 18–24 year olds, because JobSafer is designed for students and
            early-career job seekers.
          </p>
        </div>

        <div v-if="agePictogramItems[0]" class="age-stat-compact">
          <div class="age-stat-compact__copy">
            <p class="age-stat-compact__label">{{ agePictogramItems[0].label }}</p>
            <p class="age-stat-compact__value">{{ agePictogramItems[0].displayValue }}</p>
            <p class="age-stat-compact__helper">{{ agePictogramItems[0].helper }}</p>
          </div>
          <div class="age-stat-compact__visual" aria-hidden="true">
            <div class="age-proportion-bar">
              <span
                v-for="n in 5"
                :key="`age-dot-${n}`"
                class="age-proportion-bar__dot"
                :class="{ 'age-proportion-bar__dot--on': n === 1 }"
              ></span>
            </div>
            <p class="age-stat-compact__share">{{ agePictogramItems[0].statLabel }}</p>
          </div>
        </div>

        <PersonPictogramChart
          class="age-pictogram-chart--desktop"
          title=""
          note=""
          :items="agePictogramItems"
          empty-message="No 18–24 age-group data available for this scam type"
          tone="age"
        />
      </article>

      <article
        v-else-if="selectedView === 'location'"
        :key="`location-${insightsSceneKey}`"
        class="insights-card insights-card--scene"
      >
        <h3>Reported scam cases by location over time</h3>
        <p class="insights-muted insights-muted--location-desktop">
          Scam type: {{ selectedScamTypeLabel }} · Circle size represents report count
        </p>
        <p class="insights-muted insights-muted--location-mobile">
          Circle size shows reports. Color shows loss level.
        </p>

        <div v-if="!yearLocationData.length" class="empty-state">
          No location trend data available for this scam type
        </div>

        <div v-else class="map-sample-layout">
          <div class="map-controls-row">
            <div class="map-toolbar">
              <button
                type="button"
                class="map-control-btn ms-control ms-control--pill"
                @click="startPlayback"
              >
                ▶ Play
              </button>

              <button
                type="button"
                class="map-control-btn ms-control ms-control--pill"
                @click="stopPlayback"
              >
                ⏸ Pause
              </button>
            </div>

            <div class="map-year-row">
              <strong>Year: {{ selectedYear }}</strong>
            </div>

            <div class="map-slider-group">
              <input
                v-model.number="selectedYear"
                class="map-slider"
                type="range"
                :min="allYears[0]"
                :max="allYears[allYears.length - 1]"
                step="1"
                @input="stopPlayback"
              />

              <div class="map-year-labels">
                <span v-for="year in allYears" :key="year">{{ year }}</span>
              </div>
            </div>
          </div>

          <LeafletD3Map
            class="map-main"
            :map-data="locationTrendData"
            :selected-year="Number(selectedYear)"
          />
        </div>
      </article>

      <article
        v-else
        :key="`summary-${insightsSceneKey}`"
        class="insights-card insights-card--scene"
      >
        <h3>Dataset summary</h3>
        <p class="insights-muted">Time period: {{ summary.timePeriod }}</p>

        <div class="summary-dual-box">
          <div class="summary-dual-box__half">
            <strong class="summary-dual-box__value">{{
              formatNumber(summary.totalReportedCases)
            }}</strong>
            <span class="summary-dual-box__label">Total reported cases</span>
          </div>
          <div class="summary-dual-box__divider" aria-hidden="true"></div>
          <div class="summary-dual-box__half">
            <strong class="summary-dual-box__value">{{
              formatMoney(summary.totalCombinedLoss)
            }}</strong>
            <span class="summary-dual-box__label">Total combined financial loss</span>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-tile">
            <strong>{{ summary.topScamType?.label }}</strong>
            <span>Highest report count</span>
          </div>
        </div>

        <p v-if="rankInfo" class="rank-callout">
          {{ selectedScamTypeLabel }} ranks #{{ rankInfo.rank }} out of {{ rankInfo.totalTypes }}
          scam types by report frequency.
        </p>
      </article>
    </Transition>
  </section>
</template>

<style scoped>
.insights-panel {
  color: var(--ms-color-text-primary);
  display: grid;
  font-family: var(--ms-font-stack);
  gap: 14px;
}

.insights-header {
  display: flex;
  gap: 20px;
  justify-content: flex-start;
  min-height: 0;
}

.insights-hero {
  padding: 0 4px;
}

.insights-kicker {
  color: #d8a24a;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.13em;
  margin: 0 0 10px;
  text-transform: uppercase;
}

.insights-wave-heading {
  color: #1b2e5e;
  font-size: clamp(1.6rem, 2.8vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.08;
  margin: 0 0 14px;
}

.insights-wave-word {
  color: #1b2e5e;
  display: inline-flex;
  font-style: italic;
  margin: 0 5px;
  position: relative;
}

.insights-wave-word svg {
  bottom: -10px;
  left: -2px;
  position: absolute;
  width: 100%;
}

.insights-wave-word path {
  fill: none;
  stroke: #d8a24a;
  stroke-linecap: round;
  stroke-width: 4;
}

.insights-head-summary {
  color: rgba(43, 43, 43, 0.75);
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0;
  max-width: none;
  text-wrap: pretty;
  white-space: nowrap;
}

.section-title,
.insights-card h3 {
  color: var(--ms-color-brand);
  font-family: var(--ms-font-heading);
  font-weight: 800;
}

.section-title {
  font-size: clamp(2rem, 4vw, 3.2rem);
  letter-spacing: -0.04em;
  margin: 0 0 10px;
}

.section-copy,
.insights-muted,
.summary-tile span {
  color: var(--ms-color-text-secondary);
}

.section-copy {
  line-height: 1.7;
  margin: 0;
  max-width: 760px;
}

.insights-select {
  align-items: center;
  background: rgba(27, 46, 94, 0.06);
  border: 1.5px solid rgba(27, 46, 94, 0.18);
  border-radius: 20px;
  color: #1b2e5e;
  cursor: pointer;
  display: flex;
  font-size: 0.72rem;
  font-weight: 700;
  gap: 8px;
  letter-spacing: 0.08em;
  margin-left: auto;
  padding: 8px 12px 8px 14px;
  text-transform: uppercase;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  white-space: nowrap;
}

.insights-select:focus-within {
  border-color: #d8a24a;
  box-shadow: 0 0 0 3px rgba(216, 162, 74, 0.2);
}

.insights-select__label {
  color: rgba(27, 46, 94, 0.65);
  flex-shrink: 0;
  font-size: 0.68rem;
}

.insights-select select {
  appearance: none;
  background-color: transparent;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%231B2E5E' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E");
  background-position: calc(100% - 2px) center;
  background-repeat: no-repeat;
  border: 0;
  color: #1b2e5e;
  cursor: pointer;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  outline: none;
  padding-right: 20px;
  text-transform: none;
}

.insights-buttons {
  align-items: center;
  background: linear-gradient(
    120deg,
    rgba(27, 46, 94, 0.05) 0%,
    rgba(59, 111, 143, 0.08) 52%,
    rgba(216, 162, 74, 0.12) 100%
  );
  border: 1px solid rgba(27, 46, 94, 0.14);
  border-radius: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px;
  position: relative;
}

.insights-buttons::before {
  background: linear-gradient(90deg, rgba(216, 162, 74, 0.48), rgba(59, 111, 143, 0.46));
  border-radius: 999px;
  content: '';
  height: 2px;
  left: 14px;
  opacity: 0.6;
  position: absolute;
  right: 14px;
  top: 0;
}

.insights-button {
  backdrop-filter: blur(2px);
  color: #1b2e5e;
  font-weight: 700;
  min-height: 42px;
  border-color: rgba(27, 46, 94, 0.25);
  overflow: hidden;
  position: relative;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.insights-button::after {
  background: linear-gradient(
    100deg,
    rgba(216, 162, 74, 0),
    rgba(216, 162, 74, 0.34),
    rgba(139, 111, 246, 0.18)
  );
  content: '';
  inset: 0;
  opacity: 0;
  position: absolute;
  transform: translateX(-32%);
  transition:
    opacity 0.22s ease,
    transform 0.28s ease;
}

.insights-button:hover,
.insights-button:focus-visible {
  background: rgba(27, 46, 94, 0.07);
  border-color: rgba(27, 46, 94, 0.45);
  color: #1b2e5e;
  transform: translateY(-1px);
}

.insights-button:hover::after,
.insights-button:focus-visible::after {
  opacity: 1;
  transform: translateX(0);
}

.insights-button--active {
  background: #1b2e5e;
  border-color: #1b2e5e;
  box-shadow: 0 4px 14px rgba(27, 46, 94, 0.25);
  color: #fcf7f1;
}

.insights-button--active::after {
  opacity: 0;
}

.insights-card--scene {
  animation: insightsSceneIn 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.insights-scene-enter-active,
.insights-scene-leave-active {
  transition:
    opacity 220ms ease,
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.insights-scene-enter-from,
.insights-scene-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.insights-scene-enter-to,
.insights-scene-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.insights-card {
  animation: insightsCardLiftIn 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.insights-card {
  background: #ffffff;
  border: 1px solid #e5e2dc;
  border-left: 5px solid #d8a24a;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(26, 26, 42, 0.06);
  overflow: clip;
  padding: 20px 24px;
}

.insights-card h3 {
  font-size: clamp(1.15rem, 2vw, 1.45rem);
  letter-spacing: -0.03em;
  margin: 0 0 4px;
  min-height: 1.9rem;
}

.insights-muted {
  font-size: 0.83rem;
  line-height: 1.5;
  margin: 0 0 14px;
  min-height: 2.2rem;
}

.empty-state {
  background: var(--ms-color-surface-subtle);
  border: 1px solid var(--ms-color-border-soft);
  border-radius: 18px;
  color: var(--ms-color-text-secondary);
  padding: 18px;
}

.map-sample-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  min-width: 0;
}

.map-main {
  min-height: 0;
  width: 100%;
}

/* Horizontal controls row above the map */
.map-controls-row {
  align-items: center;
  background: rgba(27, 46, 94, 0.04);
  border: 1px solid rgba(27, 46, 94, 0.12);
  border-radius: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 6px;
  max-height: 52px;
  min-height: 44px;
  padding: 6px 12px;
}

.map-slider-group {
  display: grid;
  flex: 1;
  gap: 4px;
  min-width: 180px;
}

.map-toolbar {
  display: flex;
  gap: 8px;
}

.map-control-btn {
  color: #3b6f8f;
  border-color: rgba(59, 111, 143, 0.3);
  font-size: 0.82rem;
  font-weight: 700;
  min-height: 34px;
  padding: 6px 12px;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}
.map-control-btn:hover,
.map-control-btn:focus-visible {
  background: rgba(59, 111, 143, 0.08);
  border-color: rgba(59, 111, 143, 0.45);
  color: #3b6f8f;
}

.map-year-row {
  color: #1b2e5e;
  font-size: 0.95rem;
  font-weight: 700;
}

.map-slider {
  width: 100%;
  accent-color: #d8a24a;
}

.map-year-labels {
  color: rgba(43, 43, 43, 0.55);
  display: flex;
  font-size: 0.72rem;
  justify-content: space-between;
}

.summary-dual-box {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e5e2dc;
  border-radius: 10px;
  padding: 0;
  margin-bottom: 14px;
  overflow: hidden;
}

.summary-dual-box__half {
  display: grid;
  gap: 6px;
  text-align: center;
  justify-items: center;
  padding: 22px 18px;
  min-height: 108px;
}

.summary-dual-box__half:first-child {
  border-right: 1px solid #e3d7c8;
}

.summary-dual-box__value {
  color: #1b2e5e;
  font-family: var(--ms-font-heading);
  font-size: 28px;
  font-weight: 800;
}

.summary-dual-box__label {
  color: #5a5a5a;
  font-weight: 700;
  font-size: 0.95rem;
}

.summary-dual-box__divider {
  display: none;
}

.summary-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.summary-tile {
  animation: dataRowStaggerIn 360ms ease both;
  background: #ffffff;
  border: 1px solid #e5e2dc;
  border-radius: 10px;
  display: grid;
  gap: 6px;
  padding: 18px;
}

.summary-tile:nth-child(1) {
  border-top: 3px solid #1b2e5e;
}
.summary-tile:nth-child(2) {
  border-top: 3px solid #3b6f8f;
}
.summary-tile:nth-child(3) {
  border-top: 3px solid #d8a24a;
}

.summary-tile:nth-child(1) {
  animation-delay: 0ms;
}
.summary-tile:nth-child(2) {
  animation-delay: 80ms;
}
.summary-tile:nth-child(3) {
  animation-delay: 160ms;
}

@keyframes insightsCardLiftIn {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dataRowStaggerIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes insightsSceneIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.summary-tile strong {
  color: #1b2e5e;
  font-family: var(--ms-font-heading);
  font-size: 26px;
  font-weight: 800;
}

.summary-tile span {
  color: #5a5a5a;
  font-weight: 700;
  font-size: 0.9rem;
}

.rank-callout {
  background: linear-gradient(135deg, rgba(216, 162, 74, 0.1) 0%, rgba(59, 111, 143, 0.06) 100%);
  border: 1px solid #e3d7c8;
  border-left: 5px solid #d8a24a;
  border-radius: 18px;
  color: #2b2b2b;
  font-size: 1rem;
  font-weight: 700;
  margin: 18px 0 0;
  padding: 18px 20px;
}

.age-hero-card {
  background: #ffffff;
  border: 1px solid #e5e2dc;
  border-left: 5px solid #3b6f8f;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(26, 26, 42, 0.06);
  display: grid;
  gap: 18px;
  max-width: 100%;
  padding: 28px;
}

/* Match age-hero-copy headers to insights-card h3 style */
.age-hero-copy h3 {
  color: var(--ms-color-brand);
  font-family: var(--ms-font-heading);
  font-size: clamp(1.35rem, 2.5vw, 1.8rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0 0 4px;
  min-height: 2.2rem;
}

.age-hero-copy p {
  color: var(--ms-color-text-secondary);
  font-size: 0.88rem;
  line-height: 1.6;
  margin: 0 0 18px;
  min-height: 2.4rem;
}

.age-hero-card :deep(.picto-card) {
  width: 100%;
}

.age-hero-card :deep(.picto-card h3),
.age-hero-card :deep(.picto-note) {
  display: none;
}

.age-hero-card :deep(.picto-row) {
  align-items: center;
  background: #ffffff;
  border: 1px solid #e5e2dc;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(26, 26, 42, 0.06);
  display: grid;
  grid-template-columns: auto auto auto;
  justify-content: center;
  justify-items: center;
  column-gap: 56px;
  min-height: 220px;
  padding: 22px 28px;
}

.age-hero-card :deep(.picto-row__meta strong) {
  color: var(--ms-color-brand);
  font-size: 1.15rem;
}

.age-hero-card :deep(.picto-row__meta span) {
  font-size: 1.15rem;
}

.age-hero-card :deep(.picto-row__meta small) {
  font-size: 0.95rem;
  max-width: 150px;
}

.age-hero-card :deep(.picto-row__visual) {
  align-items: center;
  display: flex;
  justify-content: flex-start;
}

.age-hero-card :deep(.picto-icons) {
  display: flex;
  gap: 18px;
  justify-content: flex-start;
}

.age-hero-card :deep(.picto-icon) {
  height: 130px;
  width: 64px;
}

.age-hero-card :deep(.picto-icon__fg) {
  width: 64px;
}

.age-hero-card :deep(.picto-percent) {
  color: var(--ms-color-text-primary);
  font-size: 1.35rem;
  font-weight: 800;
  text-align: right;
}

@media (max-width: 760px) {
  .insights-header {
    display: grid;
    grid-template-columns: 1fr;
  }

  .summary-dual-box {
    grid-template-columns: 1fr;
  }

  .summary-dual-box__half {
    min-height: auto;
  }

  .summary-dual-box__half + .summary-dual-box__half {
    border-top: 1px solid var(--ms-color-border-default);
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 761px) {
  .summary-dual-box__half + .summary-dual-box__half {
    border-left: 1px solid var(--ms-color-border-default);
  }
}

/* Age groups: prevent overflow on narrow screens */
.age-hero-card {
  overflow-x: auto;
}

/* Insights panel narrow-screen adaptations */
.insights-muted--location-mobile,
.age-stat-compact {
  display: none;
}

.age-pictogram-chart--desktop {
  display: block;
}

@media (max-width: 767px) {
  .insights-panel {
    padding-top: 72px;
  }

  .insights-muted--location-desktop {
    display: none;
  }

  .insights-muted--location-mobile {
    display: block;
  }

  .age-pictogram-chart--desktop {
    display: none;
  }

  .age-stat-compact {
    align-items: center;
    background: #f4ede0;
    border: 1px solid #e3d7c8;
    border-radius: 10px;
    display: flex;
    gap: 12px;
    justify-content: space-between;
    padding: 12px 14px;
  }

  .age-stat-compact__label {
    color: #1b2e5e;
    font-size: 0.72rem;
    font-weight: 800;
    margin: 0 0 4px;
    text-transform: uppercase;
  }

  .age-stat-compact__value {
    color: #1b2e5e;
    font-size: 1.05rem;
    font-weight: 800;
    margin: 0 0 4px;
  }

  .age-stat-compact__helper {
    color: #2b2b2b;
    font-size: 0.8rem;
    line-height: 1.35;
    margin: 0;
  }

  .age-stat-compact__visual {
    align-items: flex-end;
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-shrink: 0;
  }

  .age-proportion-bar {
    display: flex;
    gap: 5px;
  }

  .age-proportion-bar__dot {
    background: #e3d7c8;
    border-radius: 999px;
    display: block;
    height: 10px;
    width: 10px;
  }

  .age-proportion-bar__dot--on {
    background: #1b2e5e;
  }

  .age-stat-compact__share {
    color: #6b7280;
    font-size: 0.68rem;
    margin: 0;
    text-align: right;
  }

  .age-hero-card {
    gap: 12px;
    padding: 16px;
  }

  .age-hero-copy p {
    margin-bottom: 8px;
    min-height: 0;
  }

  .insights-head-summary {
    white-space: normal;
  }
}

@media (max-width: 720px) {
  .insights-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .insights-select {
    width: 100%;
    min-width: 0;
  }

  .map-sample-layout {
    grid-template-columns: 1fr;
  }

  .map-controls-row {
    padding: 8px 12px;
    gap: 10px;
  }

  .map-year-labels {
    font-size: 0.62rem;
    flex-wrap: wrap;
    gap: 2px;
  }

  .age-hero-card :deep(.picto-row) {
    column-gap: 24px;
    padding: 24px;
  }
}

@media (max-width: 480px) {
  .insights-buttons {
    gap: 8px;
    padding: 10px;
  }

  .insights-button {
    font-size: 0.82rem;
    min-height: 36px;
    padding: 6px 12px;
  }

  .insights-card {
    padding: 18px 16px;
  }

  .map-controls-row {
    padding: 8px 10px;
    gap: 8px;
  }

  .map-toolbar {
    gap: 6px;
  }

  .map-control-btn {
    min-height: 34px;
    font-size: 0.8rem;
  }

  .map-year-row {
    font-size: 0.82rem;
  }

  .map-slider-group {
    min-width: 120px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .insights-card,
  .insights-card--scene,
  .summary-tile {
    animation: none !important;
  }

  .insights-scene-enter-active,
  .insights-scene-leave-active {
    transition: none !important;
  }

  .insights-scene-enter-from,
  .insights-scene-leave-to,
  .insights-scene-enter-to,
  .insights-scene-leave-from {
    opacity: 1;
    transform: none;
  }
}
</style>
