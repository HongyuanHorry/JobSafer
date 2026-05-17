<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { formatMoney, formatNumber } from '../utils/chartFormatters.js'
import L from 'leaflet'
import * as d3 from 'd3'

const props = defineProps({
  mapData: {
    type: Array,
    default: () => [],
  },
  selectedYear: {
    type: Number,
    required: true,
  },
})

const mapEl = ref(null)

let map = null
let svgLayer = null
let g = null

const stateCoordinates = {
  WA: [-25.0, 122.0],
  NT: [-19.5, 133.0],
  SA: [-30.0, 135.0],
  QLD: [-22.5, 145.0],
  NSW: [-32.5, 147.0],
  VIC: [-37.0, 144.0],
  TAS: [-42.0, 147.0],
  ACT: [-35.3, 149.1],
}

const rankingMetric = ref('reports')

const yearData = computed(() =>
  props.mapData.filter((row) => Number(row.year) === Number(props.selectedYear)),
)

const reportCountExtent = computed(() => {
  const counts = yearData.value
    .map((row) => Number(row.report_count || 0))
    .filter((value) => Number.isFinite(value) && value > 0)

  if (!counts.length) {
    return [0, 1]
  }

  const [minValue, maxValue] = d3.extent(counts)

  return [Number(minValue || 0), Number(maxValue || 1)]
})

const rankedStates = computed(() => {
  const isLossRanking = rankingMetric.value === 'losses'

  return [...yearData.value]
    .filter((row) => stateCoordinates[row.location])
    .map((row) => {
      const reportCount = Number(row.report_count || 0)
      const totalLoss = Number(row.total_loss || 0)

      return {
        ...row,
        reportCount,
        totalLoss,
        lossPerReport: getLossPerReport(row),
        riskLevel: getRiskLevel(row),
      }
    })
    .sort((a, b) => {
      if (isLossRanking) {
        return b.totalLoss - a.totalLoss || b.reportCount - a.reportCount
      }

      return b.reportCount - a.reportCount || b.totalLoss - a.totalLoss
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }))
})

const topRankedState = computed(() => rankedStates.value[0] || null)

function getLossPerReport(row) {
  const reports = Number(row.report_count || 0)
  const loss = Number(row.total_loss || 0)

  return reports > 0 ? loss / reports : 0
}

function getRiskLevel(row) {
  const lossPerReport = getLossPerReport(row)

  if (lossPerReport >= 1050) return 'High'
  if (lossPerReport >= 950) return 'Medium'
  return 'Low'
}

function getRiskColor(row) {
  const level = getRiskLevel(row)

  if (level === 'High') {
    return {
      fill: 'rgba(208, 49, 45, 0.68)',
      stroke: 'rgba(176, 29, 25, 0.95)',
    }
  }

  if (level === 'Medium') {
    return {
      fill: 'rgba(241, 179, 64, 0.7)',
      stroke: 'rgba(201, 138, 27, 0.95)',
    }
  }

  return {
    fill: 'rgba(95, 143, 83, 0.68)',
    stroke: 'rgba(70, 116, 59, 0.95)',
  }
}

function getPoint(row) {
  const coords = stateCoordinates[row.location]

  if (!coords) return null

  const [lat, lng] = coords
  const point = map.latLngToLayerPoint([lat, lng])

  return {
    ...row,
    lat,
    lng,
    x: point.x,
    y: point.y,
  }
}

function getRadius(value) {
  const numericValue = Number(value || 0)

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0
  }

  const [minValue, maxValue] = reportCountExtent.value

  if (minValue === maxValue) {
    return 18
  }

  const scale = d3
    .scaleSqrt()
    .domain([minValue, maxValue])
    .range([8, 30])
    .clamp(true)

  return scale(numericValue)
}

function formatRankingValue(state) {
  if (rankingMetric.value === 'losses') {
    return `${formatMoney(state.totalLoss)} total loss`
  }

  return `${formatNumber(state.reportCount)} reports`
}

function formatRankingSecondaryValue(state) {
  if (rankingMetric.value === 'losses') {
    return `${formatNumber(state.reportCount)} reports`
  }

  return `${formatMoney(state.totalLoss)} total loss`
}

function renderD3Layer() {
  if (!map || !g) return

  const points = rankedStates.value
    .map(getPoint)
    .filter(Boolean)

  const circles = g
    .selectAll('circle.scam-bubble')
    .data(points, (d) => d.location)

  circles.exit().remove()

  circles
    .enter()
    .append('circle')
    .attr('class', 'scam-bubble')
    .attr('r', 0)
    .merge(circles)
    .transition()
    .duration(350)
    .attr('cx', (d) => d.x)
    .attr('cy', (d) => d.y)
    .attr('r', (d) => getRadius(d.report_count))
    .attr('fill', (d) => getRiskColor(d).fill)
    .attr('stroke', (d) => getRiskColor(d).stroke)

  const labels = g
    .selectAll('text.scam-map-label')
    .data(points, (d) => d.location)

  labels.exit().remove()

  labels
    .enter()
    .append('text')
    .attr('class', 'scam-map-label')
    .attr('text-anchor', 'middle')
    .merge(labels)
    .transition()
    .duration(350)
    .attr('x', (d) => d.x)
    .attr('y', (d) => d.y + getRadius(d.report_count) + 14)
    .text((d) => d.location)

  const tooltips = g
    .selectAll('title')
    .data(points, (d) => d.location)

  tooltips.exit().remove()

  tooltips
    .enter()
    .append('title')
    .merge(tooltips)
    .text(
      (d) =>
        `${d.location}
${formatNumber(d.report_count)} reports
${formatMoney(d.total_loss)} total loss
${formatMoney(getLossPerReport(d))} average loss per report
Risk level: ${getRiskLevel(d)}`,
    )
}

function initializeMap() {
  if (!mapEl.value || map) return

  map = L.map(mapEl.value, {
    center: [-29.5, 134.5],
    zoom: 4,
    minZoom: 3,
    maxZoom: 7,
    scrollWheelZoom: false,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  svgLayer = d3.select(map.getPanes().overlayPane).append('svg')
  g = svgLayer.append('g').attr('class', 'leaflet-zoom-hide')

  function resetOverlay() {
    const bounds = map.getBounds()
    const topLeft = map.latLngToLayerPoint(bounds.getNorthWest())
    const bottomRight = map.latLngToLayerPoint(bounds.getSouthEast())

    svgLayer
      .attr('width', bottomRight.x - topLeft.x)
      .attr('height', bottomRight.y - topLeft.y)
      .style('left', `${topLeft.x}px`)
      .style('top', `${topLeft.y}px`)

    g.attr('transform', `translate(${-topLeft.x},${-topLeft.y})`)

    renderD3Layer()
  }

  map.on('zoomend moveend viewreset', resetOverlay)

  nextTick(() => {
    map.invalidateSize()
    resetOverlay()
  })
}

onMounted(() => {
  initializeMap()
})

watch(
  () => [props.mapData, props.selectedYear],
  () => {
    nextTick(() => {
      if (map) {
        map.invalidateSize()
        renderD3Layer()
      }
    })
  },
  { deep: true },
)

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div class="leaflet-d3-map-layout">
    <section class="leaflet-d3-map-panel">
      <div class="leaflet-d3-map-panel__header">
        <div>
          <strong>State risk map</strong>
          <p>Bubble size compares report volume, while color shows average loss per report.</p>
        </div>

        <div class="leaflet-d3-map-panel__meta">
          <span class="map-meta-chip">{{ props.selectedYear }}</span>
          <span class="map-meta-chip">{{ rankedStates.length }} states</span>
        </div>
      </div>

      <div class="leaflet-d3-map-shell">
        <div ref="mapEl" class="leaflet-d3-map"></div>
      </div>

      <div class="leaflet-d3-map-footer">
        <div class="leaflet-d3-legend">
          <strong>Risk level</strong>

          <div class="legend-row">
            <span class="legend-dot legend-dot--high"></span>
            <span>High loss per report</span>
          </div>

          <div class="legend-row">
            <span class="legend-dot legend-dot--medium"></span>
            <span>Medium loss per report</span>
          </div>

          <div class="legend-row">
            <span class="legend-dot legend-dot--low"></span>
            <span>Low loss per report</span>
          </div>

          <small>Circle size shows report count.</small>
        </div>

        <div v-if="topRankedState" class="map-highlight-card">
          <span class="map-highlight-card__eyebrow">Top ranked state</span>
          <strong>{{ topRankedState.location }}</strong>
          <small>{{ formatRankingValue(topRankedState) }}</small>
          <small>{{ formatRankingSecondaryValue(topRankedState) }}</small>
        </div>
      </div>
    </section>

    <aside class="state-ranking-card">
      <div class="state-ranking-card__header">
        <div>
          <strong>State ranking</strong>
          <span>{{ props.selectedYear }}</span>
        </div>

        <div class="state-ranking-toggle" aria-label="Rank states by">
          <button
            type="button"
            class="state-ranking-toggle__button"
            :class="{ 'state-ranking-toggle__button--active': rankingMetric === 'reports' }"
            :aria-pressed="rankingMetric === 'reports'"
            @click="rankingMetric = 'reports'"
          >
            Reports
          </button>

          <button
            type="button"
            class="state-ranking-toggle__button"
            :class="{ 'state-ranking-toggle__button--active': rankingMetric === 'losses' }"
            :aria-pressed="rankingMetric === 'losses'"
            @click="rankingMetric = 'losses'"
          >
            Losses
          </button>
        </div>
      </div>

      <ol v-if="rankedStates.length" class="state-ranking-list">
        <li
          v-for="state in rankedStates"
          :key="state.location"
          class="state-ranking-item"
        >
          <span class="state-ranking-item__rank">#{{ state.rank }}</span>

          <div class="state-ranking-item__meta">
            <strong>{{ state.location }}</strong>
            <small>{{ formatRankingValue(state) }}</small>
            <small class="state-ranking-item__secondary">
              {{ formatRankingSecondaryValue(state) }}
            </small>
          </div>

          <span
            class="risk-pill"
            :class="`risk-pill--${state.riskLevel.toLowerCase()}`"
          >
            {{ state.riskLevel }}
          </span>
        </li>
      </ol>

      <div v-else class="state-ranking-empty">
        No ranked state data available for this year.
      </div>
    </aside>
  </div>
</template>

<style scoped>
.leaflet-d3-map-layout {
  align-items: start;
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1.35fr) 320px;
}

.leaflet-d3-map-panel {
  display: grid;
  gap: 16px;
}

.leaflet-d3-map-panel__header {
  align-items: start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.leaflet-d3-map-panel__header strong {
  color: var(--ms-color-brand);
  display: block;
  font-family: var(--ms-font-heading);
  font-size: 1.08rem;
  font-weight: 800;
  margin-bottom: 4px;
}

.leaflet-d3-map-panel__header p {
  color: var(--ms-color-text-secondary);
  line-height: 1.5;
  margin: 0;
  max-width: 48ch;
}

.leaflet-d3-map-panel__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.leaflet-d3-map-shell {
  background: var(--ms-color-surface-panel);
  border: 1px solid var(--ms-color-border-default);
  border-radius: 24px;
  box-shadow: 0 12px 30px rgba(44, 62, 140, 0.08);
  overflow: hidden;
  position: relative;
}

.leaflet-d3-map {
  height: 520px;
  width: 100%;
}

.leaflet-d3-map-footer {
  align-items: start;
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
}

.leaflet-d3-legend {
  background: var(--ms-color-surface-panel);
  border: 1px solid var(--ms-color-border-default);
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(44, 62, 140, 0.12);
  color: var(--ms-color-text-primary);
  display: grid;
  gap: 8px;
  padding: 12px 14px;
}

.leaflet-d3-legend strong {
  color: var(--ms-color-brand);
  font-size: 0.85rem;
}

.leaflet-d3-legend small {
  color: var(--ms-color-text-secondary);
  font-size: 0.76rem;
  line-height: 1.4;
}

.legend-row {
  align-items: center;
  display: flex;
  gap: 8px;
  font-size: 0.8rem;
}

.legend-dot {
  border-radius: 999px;
  display: inline-block;
  height: 12px;
  width: 12px;
}

.legend-dot--high {
  background: rgba(208, 49, 45, 0.68);
  border: 2px solid rgba(176, 29, 25, 0.95);
}

.legend-dot--medium {
  background: rgba(241, 179, 64, 0.7);
  border: 2px solid rgba(201, 138, 27, 0.95);
}

.legend-dot--low {
  background: rgba(95, 143, 83, 0.68);
  border: 2px solid rgba(70, 116, 59, 0.95);
}

.map-meta-chip {
  background: var(--ms-color-surface-subtle);
  border: 1px solid var(--ms-color-border-soft);
  border-radius: 999px;
  color: var(--ms-color-brand);
  display: inline-flex;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 8px 12px;
}

.map-highlight-card {
  background: linear-gradient(135deg, rgba(31, 45, 107, 0.06) 0%, rgba(255, 255, 255, 0.95) 100%);
  border: 1px solid var(--ms-color-border-default);
  border-radius: 18px;
  display: grid;
  gap: 4px;
  min-height: 100%;
  padding: 16px 18px;
}

.map-highlight-card__eyebrow {
  color: var(--ms-color-text-secondary);
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
}

.map-highlight-card strong {
  color: var(--ms-color-brand);
  font-family: var(--ms-font-heading);
  font-size: 1.3rem;
  font-weight: 800;
}

.map-highlight-card small {
  color: var(--ms-color-text-secondary);
  line-height: 1.45;
}

.state-ranking-card {
  align-self: start;
  background: linear-gradient(180deg, #ffffff 0%, #f9f7f4 100%);
  border: 1px solid var(--ms-color-border-default);
  border-radius: 20px;
  box-shadow: 0 12px 30px rgba(44, 62, 140, 0.08);
  display: grid;
  gap: 16px;
  grid-template-rows: auto minmax(0, 1fr);
  max-height: 735px;
  min-height: 0;
  overflow: hidden;
  padding: 18px;
  position: sticky;
  top: 24px;
}

.state-ranking-card__header {
  display: grid;
  gap: 12px;
}

.state-ranking-card__header strong {
  color: var(--ms-color-brand);
  display: block;
  font-family: var(--ms-font-heading);
  font-size: 1.05rem;
  font-weight: 800;
}

.state-ranking-card__header span {
  color: var(--ms-color-text-secondary);
  font-size: 0.82rem;
}

.state-ranking-toggle {
  background: var(--ms-color-surface-subtle);
  border: 1px solid var(--ms-color-border-soft);
  border-radius: 999px;
  display: inline-flex;
  padding: 4px;
}

.state-ranking-toggle__button {
  background: transparent;
  border: 0;
  border-radius: 999px;
  color: var(--ms-color-text-secondary);
  cursor: pointer;
  font-family: var(--ms-font-stack);
  font-size: 0.82rem;
  font-weight: 700;
  padding: 8px 12px;
}

.state-ranking-toggle__button--active {
  background: var(--ms-color-brand);
  color: white;
}

.state-ranking-list {
  display: grid;
  gap: 10px;
  list-style: none;
  margin: 0;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 0;
  padding-right: 6px;
}

.state-ranking-item {
  align-items: center;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid var(--ms-color-border-soft);
  border-radius: 16px;
  display: grid;
  gap: 12px;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  padding: 12px 14px;
}

.state-ranking-item__rank {
  color: var(--ms-color-brand);
  font-size: 0.88rem;
  font-weight: 800;
}

.state-ranking-item__meta {
  display: grid;
  gap: 2px;
}

.state-ranking-item__meta strong {
  color: var(--ms-color-text-primary);
  font-size: 0.95rem;
}

.state-ranking-item__meta small {
  color: var(--ms-color-text-secondary);
  line-height: 1.35;
}

.state-ranking-item__secondary {
  font-size: 0.76rem;
}

.risk-pill {
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 800;
  padding: 6px 10px;
}

.risk-pill--high {
  background: #fef2f2;
  color: #9f1d1a;
}

.risk-pill--medium {
  background: #fff7e8;
  color: #9a5b00;
}

.risk-pill--low {
  background: #eef7eb;
  color: #39622f;
}

.state-ranking-empty {
  background: var(--ms-color-surface-subtle);
  border: 1px dashed var(--ms-color-border-soft);
  border-radius: 16px;
  color: var(--ms-color-text-secondary);
  padding: 18px;
  text-align: center;
}

:global(.scam-bubble) {
  stroke-width: 2;
}

:global(.scam-map-label) {
  fill: var(--ms-color-text-primary);
  font-family: var(--ms-font-stack);
  font-size: 13px;
  font-weight: 800;
  paint-order: stroke;
  stroke: white;
  stroke-width: 3px;
}

@media (max-width: 980px) {
  .leaflet-d3-map-layout {
    grid-template-columns: 1fr;
  }

  .leaflet-d3-map-panel__header {
    flex-direction: column;
  }

  .leaflet-d3-map-footer {
    grid-template-columns: 1fr;
  }

  .state-ranking-card {
    order: 2;
    position: static;
  }
}

@media (max-width: 640px) {
  .leaflet-d3-map {
    height: 420px;
  }

  .leaflet-d3-map-panel__meta {
    width: 100%;
  }

  .map-meta-chip {
    justify-content: center;
  }

  .state-ranking-item {
    grid-template-columns: 40px minmax(0, 1fr);
  }

  .risk-pill {
    justify-self: start;
  }
}
</style>
