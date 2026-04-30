<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import LeafletD3Map from './LeafletD3Map.vue'
import PersonPictogramChart from './PersonPictogramChart.vue'
import DualAxisTrendChart from './DualAxisTrendChart.vue'
import {
  getAggregateSummary,
  getAgeDistribution,
  getFinancialLossByScamType,
  getLocationTrendByScamType,
  getScamTypeRank,
  getScamTypes,
  getTimePeriod,
  getTrendByScamType,
  getAvailableYears,
} from '../services/scamInsightsService'

const scamTypes = getScamTypes()
const selectedScamType = ref(scamTypes[0] || '')
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
const lossData = computed(() => getFinancialLossByScamType(selectedScamType.value))
const ageData = computed(() => getAgeDistribution(selectedScamType.value))
const summary = computed(() => getAggregateSummary())
const rankInfo = computed(() => getScamTypeRank(selectedScamType.value))
const timePeriod = computed(() => getTimePeriod())

const locationTrendData = computed(() =>
  getLocationTrendByScamType(selectedScamType.value),
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

const agePictogramItems = computed(() => {
  if (!youthAgeGroup.value) return []

  const share = totalAgeReports.value
    ? (Number(youthAgeGroup.value.value || 0) / totalAgeReports.value) * 100
    : 0

  return [
    {
      label: '18–24',
      displayValue: `${formatNumber(youthAgeGroup.value.value)} reports`,
      helper: `${share.toFixed(1)}% of reports for this scam type`,
      percent: share,
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

function formatNumber(value) {
  return Number(value || 0).toLocaleString()
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`
}
</script>

<template>
  <section class="insights-panel" aria-label="Scam insights dashboard">
    <div class="insights-header">
      <div>
        <h2 class="section-title">Insights</h2>
        <p class="section-copy">
          Explore reported scam data by choosing a scam type and the kind of insight you want to see.
        </p>
      </div>

      <label class="insights-select">
        Scam type
        <select v-model="selectedScamType">
          <option v-for="type in scamTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </label>
    </div>

    <div class="insights-buttons" aria-label="Choose insight type">
      <button
        v-for="option in viewOptions"
        :key="option.key"
        type="button"
        class="insights-button"
        :class="{ 'insights-button--active': selectedView === option.key }"
        @click="selectedView = option.key"
      >
        {{ option.label }}
      </button>
    </div>

    <article v-if="selectedView === 'trend'" class="insights-card">
      <DualAxisTrendChart
        :scam-type="selectedScamType"
        :trend-data="trendData"
        :time-period="timePeriod"
      />
    </article>

    <article v-if="selectedView === 'age'" class="age-hero-card">
      <div class="age-hero-copy">
        <h3>Young adult risk indicator</h3>
        <p>
          This view focuses on 18–24 year olds, because StepSafe is designed for
          students and early-career job seekers.
        </p>
      </div>

      <PersonPictogramChart
        title=""
        note=""
        :items="agePictogramItems"
        empty-message="No 18–24 age-group data available for this scam type"
        tone="age"
      />
    </article>

    <article v-if="selectedView === 'location'" class="insights-card">
      <h3>Reported scam cases by location over time</h3>
      <p class="insights-muted">
        Scam type: {{ selectedScamType }} · Circle size represents report count
      </p>

      <div v-if="!yearLocationData.length" class="empty-state">
        No location trend data available for this scam type
      </div>

      <div v-else class="map-sample-layout">
        <div class="map-toolbar">
          <button type="button" class="map-control-btn" @click="startPlayback">
            Play
          </button>

          <button type="button" class="map-control-btn" @click="stopPlayback">
            Pause
          </button>
        </div>

        <LeafletD3Map
          :map-data="locationTrendData"
          :selected-year="Number(selectedYear)"
        />

        <div class="map-year-row">
          <strong>Year: {{ selectedYear }}</strong>
        </div>

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
    </article>

    <article v-if="selectedView === 'summary'" class="insights-card">
      <h3>Dataset summary</h3>
      <p class="insights-muted">Time period: {{ summary.timePeriod }}</p>

      <div class="summary-grid">
        <div class="summary-tile">
          <strong>{{ formatNumber(summary.totalReportedCases) }}</strong>
          <span>Total reported cases</span>
        </div>

        <div class="summary-tile">
          <strong>{{ formatMoney(summary.totalCombinedLoss) }}</strong>
          <span>Total combined financial loss</span>
        </div>

        <div class="summary-tile">
          <strong>{{ summary.topScamType?.label }}</strong>
          <span>Highest report count</span>
        </div>
      </div>

      <p v-if="rankInfo" class="rank-callout">
        {{ selectedScamType }} ranks #{{ rankInfo.rank }} out of {{ rankInfo.totalTypes }}
        scam types by report frequency.
      </p>
    </article>
  </section>
</template>

<style scoped>
.insights-panel {
  color: var(--ms-color-text-primary);
  display: grid;
  font-family: var(--ms-font-stack);
  gap: 20px;
}

.insights-header {
  align-items: end;
  display: flex;
  gap: 20px;
  justify-content: space-between;
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
  color: var(--ms-color-brand);
  display: grid;
  font-size: 13px;
  font-weight: 800;
  gap: 6px;
  min-width: 220px;
  text-transform: uppercase;
}

.insights-select select {
  background: var(--ms-color-surface-panel);
  border: 1px solid var(--ms-color-border-default);
  border-radius: 14px;
  color: var(--ms-color-text-primary);
  font: inherit;
  padding: 10px 12px;
  text-transform: none;
}

.insights-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.insights-button {
  background: var(--ms-color-surface-panel);
  border: 1px solid var(--ms-color-border-default);
  border-radius: 999px;
  color: var(--ms-color-brand);
  cursor: pointer;
  font-weight: 800;
  padding: 10px 14px;
}

.insights-button:hover,
.insights-button:focus-visible,
.map-control-btn:hover,
.map-control-btn:focus-visible {
  background: var(--ms-color-success-soft);
}

.insights-button--active {
  background: var(--ms-color-brand);
  border-color: var(--ms-color-brand);
  color: #ffffff;
}

.insights-card {
  background: var(--ms-color-surface-panel);
  border: 1px solid var(--ms-color-border-default);
  border-radius: 28px;
  box-shadow: 0 18px 40px rgba(44, 62, 140, 0.08);
  padding: 24px;
}

.insights-card h3 {
  font-size: clamp(1.35rem, 2.5vw, 1.8rem);
  letter-spacing: -0.03em;
  margin: 0 0 6px;
}

.insights-muted {
  line-height: 1.6;
  margin: 0 0 18px;
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
  gap: 14px;
}

.map-toolbar {
  display: flex;
  gap: 8px;
}

.map-control-btn {
  background: var(--ms-color-surface-subtle);
  border: 1px solid var(--ms-color-border-default);
  border-radius: 999px;
  color: var(--ms-color-brand);
  cursor: pointer;
  font-weight: 800;
  padding: 8px 14px;
}

.map-year-row {
  color: var(--ms-color-text-primary);
  font-size: 0.95rem;
}

.map-slider {
  width: 100%;
}

.map-year-labels {
  color: var(--ms-color-text-secondary);
  display: flex;
  font-size: 0.72rem;
  justify-content: space-between;
}

.summary-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.summary-tile {
  background: var(--ms-color-surface-subtle);
  border: 1px solid var(--ms-color-border-soft);
  border-radius: 20px;
  display: grid;
  gap: 6px;
  padding: 18px;
}

.summary-tile strong {
  color: var(--ms-color-brand);
  font-family: var(--ms-font-heading);
  font-size: 24px;
  font-weight: 800;
}

.summary-tile span {
  font-weight: 700;
}

.rank-callout {
  background: var(--ms-color-success-soft);
  border: 1px solid var(--ms-color-border-soft);
  border-left: 5px solid var(--ms-color-brand);
  border-radius: 18px;
  color: var(--ms-color-brand);
  font-weight: 800;
  margin: 18px 0 0;
  padding: 16px;
}

.age-hero-card {
  background: var(--ms-color-surface-panel);
  border: 1px solid var(--ms-color-border-default);
  border-radius: 28px;
  box-shadow: 0 18px 40px rgba(44, 62, 140, 0.08);
  display: grid;
  gap: 24px;
  max-width: 1040px;
  padding: 120px;
}

.age-hero-copy h3 {
  color: var(--ms-color-brand);
  font-family: var(--ms-font-heading);
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  margin: 0 0 8px;
}

.age-hero-copy p {
  color: var(--ms-color-text-secondary);
  font-size: 1rem;
  line-height: 1.7;
  margin: 0;
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
  background: var(--ms-color-surface-subtle);
  border: 1px solid var(--ms-color-border-soft);
  border-radius: 26px;
  display: grid;
  grid-template-columns: auto auto auto; 
  justify-content: center;              
  justify-items: center;
  column-gap: 56px;
  min-height: 330px;
  padding: 42px 46px;
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
  gap: 34px;
  justify-content: flex-start;
}

.age-hero-card :deep(.picto-icon) {
  height: 190px;
  width: 94px;
}

.age-hero-card :deep(.picto-icon__fg) {
  width: 94px;
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

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>