<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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

const yearData = computed(() =>
  props.mapData.filter((row) => Number(row.year) === Number(props.selectedYear)),
)

const maxReportCount = computed(() =>
  Math.max(...yearData.value.map((row) => Number(row.report_count || 0)), 1),
)

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
  const scale = d3
    .scaleSqrt()
    .domain([0, maxReportCount.value])
    .range([4, 24])

  return scale(Number(value || 0))
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString()
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`
}

function renderD3Layer() {
  if (!map || !g) return

  const points = yearData.value
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
${formatMoney(d.total_loss)} total loss`,
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
  <div class="leaflet-d3-map-shell">
    <div ref="mapEl" class="leaflet-d3-map"></div>

    <div class="leaflet-d3-legend">
      <strong>Report count</strong>
      <div class="legend-row">
        <span class="legend-circle legend-circle--small"></span>
        <span>Low</span>
      </div>
      <div class="legend-row">
        <span class="legend-circle legend-circle--large"></span>
        <span>High</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.leaflet-d3-map-shell {
  position: relative;
}

.leaflet-d3-map {
  border: 1px solid var(--ms-color-border-default);
  border-radius: 20px;
  height: 520px;
  overflow: hidden;
  width: 100%;
}

.leaflet-d3-legend {
  background: var(--ms-color-surface-panel);
  border: 1px solid var(--ms-color-border-default);
  border-radius: 16px;
  bottom: 18px;
  box-shadow: 0 12px 30px rgba(44, 62, 140, 0.12);
  color: var(--ms-color-text-primary);
  display: grid;
  gap: 8px;
  left: 18px;
  padding: 12px 14px;
  position: absolute;
  z-index: 500;
}

.leaflet-d3-legend strong {
  color: var(--ms-color-brand);
  font-size: 0.85rem;
}

.legend-row {
  align-items: center;
  display: flex;
  gap: 8px;
  font-size: 0.8rem;
}

.legend-circle {
  background: rgba(233, 181, 34, 0.68);
  border: 2px solid rgba(205, 136, 17, 0.9);
  border-radius: 999px;
  display: inline-block;
}

.legend-circle--small {
  height: 10px;
  width: 10px;
}

.legend-circle--large {
  height: 24px;
  width: 24px;
}

:global(.scam-bubble) {
  fill: rgba(233, 181, 34, 0.62);
  stroke: rgba(205, 136, 17, 0.95);
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
</style>