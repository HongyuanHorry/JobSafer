<script setup>
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { computed } from 'vue'
import { formatMoney, formatNumber } from '../utils/chartFormatters.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title)

const props = defineProps({
  scamType: {
    type: String,
    default: '',
  },
  trendData: {
    type: Array,
    default: () => [],
  },
  timePeriod: {
    type: String,
    default: '',
  },
})

const chartData = computed(() => ({
  labels: props.trendData.map((row) => row.year),
  datasets: [
    {
      label: 'Report count',
      data: props.trendData.map((row) => row.report_count),
      yAxisID: 'yReports',
      borderColor: '#1f2d6b',
      backgroundColor: 'rgba(31, 45, 107, 0.12)',
      pointBackgroundColor: '#1f2d6b',
      pointBorderColor: '#1f2d6b',
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 3,
      tension: 0.35,
    },
    {
      label: 'Total financial loss',
      data: props.trendData.map((row) => row.total_loss),
      yAxisID: 'yLoss',
      borderColor: '#d0312d',
      backgroundColor: 'rgba(208, 49, 45, 0.12)',
      pointBackgroundColor: '#d0312d',
      pointBorderColor: '#d0312d',
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 3,
      tension: 0.35,
    },
  ],
}))

const reportValues = computed(() => props.trendData.map((row) => Number(row.report_count || 0)))

const lossValues = computed(() => props.trendData.map((row) => Number(row.total_loss || 0)))

function roundDown(value, step) {
  return Math.floor(value / step) * step
}

function roundUp(value, step) {
  return Math.ceil(value / step) * step
}

function getRoundedReportRange(values) {
  const cleanValues = values.filter(Number.isFinite)

  if (!cleanValues.length) {
    return { min: 0, max: 1 }
  }

  const minValue = Math.min(...cleanValues)
  const maxValue = Math.max(...cleanValues)

  return {
    min: Math.max(0, roundDown(minValue - 1000, 1000)),
    max: roundUp(maxValue + 1000, 1000),
  }
}

function getRoundedLossRange(values) {
  const cleanValues = values.filter(Number.isFinite)

  if (!cleanValues.length) {
    return { min: 0, max: 1 }
  }

  const minValue = Math.min(...cleanValues)
  const maxValue = Math.max(...cleanValues)

  return {
    min: Math.max(0, roundDown(minValue - 1000000, 1000000)),
    max: roundUp(maxValue + 1000000, 1000000),
  }
}

const reportAxisRange = computed(() => getRoundedReportRange(reportValues.value))
const lossAxisRange = computed(() => getRoundedLossRange(lossValues.value))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    animation: {
      duration: 900,
      easing: 'easeOutCubic',
    },
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        boxWidth: 10,
        color: '#1a1a2a',
        font: {
          family: 'Plus Jakarta Sans',
          weight: '700',
        },
      },
    },
    tooltip: {
      callbacks: {
        label(context) {
          if (context.dataset.yAxisID === 'yLoss') {
            return `Total financial loss: ${formatMoney(context.raw)}`
          }

          return `Report count: ${formatNumber(context.raw)}`
        },
      },
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Year',
        color: '#1a1a2a',
        font: {
          family: 'Plus Jakarta Sans',
          weight: '800',
        },
      },
      ticks: {
        color: '#6b7280',
        font: {
          family: 'Plus Jakarta Sans',
          weight: '700',
        },
      },
      grid: {
        color: '#e5e2dc',
      },
    },
    yReports: {
      type: 'linear',
      position: 'left',
      min: reportAxisRange.value.min,
      max: reportAxisRange.value.max,
      title: {
        display: true,
        text: 'Report count',
        color: '#1f2d6b',
        font: {
          family: 'Plus Jakarta Sans',
          weight: '800',
        },
      },
      ticks: {
        color: '#1f2d6b',
        callback(value) {
          return formatNumber(value)
        },
      },
      grid: {
        color: '#e5e2dc',
      },
    },
    yLoss: {
      type: 'linear',
      position: 'right',
      min: lossAxisRange.value.min,
      max: lossAxisRange.value.max,
      title: {
        display: true,
        text: 'Total financial loss',
        color: '#d0312d',
        font: {
          family: 'Plus Jakarta Sans',
          weight: '800',
        },
      },
      ticks: {
        color: '#d0312d',
        callback(value) {
          if (value >= 1000000) return `$${value / 1000000}M`
          if (value >= 1000) return `$${value / 1000}K`
          return `$${value}`
        },
      },
      grid: {
        drawOnChartArea: false,
      },
    },
  },
}))
</script>

<template>
  <section class="dual-trend-card" :key="`${scamType}-${trendData.length}`">
    <div class="dual-trend-card__header">
      <div>
        <h3>Time-series trend chart</h3>
        <p>Report count and total financial loss for {{ scamType }} across available years.</p>
      </div>

      <span v-if="timePeriod" class="dual-trend-card__period">
        {{ timePeriod }}
      </span>
    </div>

    <div v-if="!trendData.length" class="empty-state">
      No trend data available for this scam type
    </div>

    <div v-else class="dual-trend-chart dual-trend-chart--animated">
      <Line :data="chartData" :options="chartOptions" />
    </div>

    <p class="dual-trend-card__helper">
      This helps users see whether this scam type is becoming more common and whether losses are
      increasing over time.
    </p>
  </section>
</template>

<style scoped>
.dual-trend-card {
  display: grid;
  gap: 18px;
}

.dual-trend-card__header {
  align-items: start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.dual-trend-card h3 {
  color: var(--ms-color-brand);
  font-family: var(--ms-font-heading);
  font-size: clamp(1.35rem, 2.5vw, 1.8rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0 0 6px;
}

.dual-trend-card p {
  color: var(--ms-color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

.dual-trend-card__period {
  background: var(--ms-color-success-soft);
  border: 1px solid var(--ms-color-border-soft);
  border-radius: 999px;
  color: var(--ms-color-brand);
  flex: 0 0 auto;
  font-size: 0.85rem;
  font-weight: 800;
  padding: 8px 12px;
}

.dual-trend-chart {
  background: #ffffff;
  border: 1px solid #e5e2dc;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(26, 26, 42, 0.06);
  height: 380px;
  padding: 14px;
}

.dual-trend-chart--animated {
  animation: trendChartIn 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.dual-trend-card__helper {
  background: var(--ms-color-surface-subtle);
  border: 1px solid var(--ms-color-border-soft);
  border-left: 5px solid var(--ms-color-brand);
  border-radius: 18px;
  color: var(--ms-color-text-primary);
  font-weight: 700;
  padding: 14px 16px;
}

.empty-state {
  background: var(--ms-color-surface-subtle);
  border: 1px solid var(--ms-color-border-soft);
  border-radius: 18px;
  color: var(--ms-color-text-secondary);
  padding: 18px;
}

@media (max-width: 760px) {
  .dual-trend-card__header {
    display: grid;
  }

  .dual-trend-chart {
    height: 360px;
  }
}

@keyframes trendChartIn {
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
  .dual-trend-chart--animated {
    animation: none !important;
  }
}
</style>
