<script setup>
const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  note: {
    type: String,
    default: '',
  },
  items: {
    type: Array,
    default: () => [],
  },
  emptyMessage: {
    type: String,
    default: 'No data available.',
  },
  tone: {
    type: String,
    default: 'brand', // brand | loss | age
  },
})

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function getIconFills(percent, iconCount = 5) {
  const safePercent = clamp(Number(percent || 0), 0, 100)
  const bucket = 100 / iconCount

  return Array.from({ length: iconCount }, (_, index) => {
    const start = index * bucket
    const fill = clamp((safePercent - start) / bucket, 0, 1)
    return fill
  })
}

function formatPercent(percent) {
  return `${Math.round(Number(percent || 0))}%`
}
</script>

<template>
  <section class="picto-card" :class="`picto-card--${tone}`">
    <svg width="0" height="0" aria-hidden="true" class="picto-defs">
      <defs>
        <symbol id="person-icon" viewBox="0 0 24 48">
          <circle cx="12" cy="5" r="4" />
          <rect x="6" y="11" width="12" height="16" rx="4" />
          <rect x="2" y="13" width="3.5" height="14" rx="1.75" />
          <rect x="18.5" y="13" width="3.5" height="14" rx="1.75" />
          <rect x="7" y="27" width="4" height="18" rx="2" />
          <rect x="13" y="27" width="4" height="18" rx="2" />
        </symbol>
      </defs>
    </svg>

    <h3>{{ title }}</h3>
    <p v-if="note" class="picto-note">{{ note }}</p>

    <div v-if="!items.length" class="empty-state">
      {{ emptyMessage }}
    </div>

    <div v-else class="picto-list">
      <article
        v-for="item in items"
        :key="item.label"
        class="picto-row"
      >
        <div class="picto-row__meta">
          <strong>{{ item.label }}</strong>
          <span>{{ item.displayValue }}</span>
          <small v-if="item.helper">{{ item.helper }}</small>
        </div>

        <div class="picto-row__visual">
          <div class="picto-icons">
            <div
              v-for="(fill, index) in getIconFills(item.percent)"
              :key="`${item.label}-${index}`"
              class="picto-icon"
            >
              <svg class="picto-icon__bg" viewBox="0 0 24 48" aria-hidden="true">
                <use href="#person-icon" />
              </svg>

              <div
                class="picto-icon__fillwrap"
                :style="{ width: `${fill * 100}%` }"
              >
                <svg class="picto-icon__fg" viewBox="0 0 24 48" aria-hidden="true">
                  <use href="#person-icon" />
                </svg>
              </div>
            </div>
          </div>

          <div class="picto-percent">
            {{ formatPercent(item.percent) }}
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.picto-card {
  display: grid;
  gap: 16px;
}

.picto-card h3 {
  color: var(--ms-color-brand);
  font-family: var(--ms-font-heading);
  font-size: clamp(1.35rem, 2.5vw, 1.8rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0;
}

.picto-note {
  color: var(--ms-color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

.picto-list {
  display: grid;
  gap: 18px;
}

.picto-row {
  align-items: center;
  background: var(--ms-color-surface-subtle);
  border: 1px solid var(--ms-color-border-soft);
  border-radius: 24px;
  display: grid;
  gap: 28px;
  grid-template-columns: 190px minmax(360px, 1fr) 80px;
  padding: 28px 32px;
}

.picto-row__meta {
  display: grid;
  gap: 4px;
}

.picto-row__meta strong {
  color: var(--ms-color-brand);
  font-size: 1rem;
  font-weight: 800;
}

.picto-row__meta span {
  color: var(--ms-color-text-primary);
  font-weight: 700;
}

.picto-row__meta small {
  color: var(--ms-color-text-secondary);
  line-height: 1.4;
}

.picto-row__visual {
  align-items: center;
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(360px, 1fr) 70px;
}

.picto-icons {
  display: flex;
  gap: 18px;
  justify-content: flex-start;
}

.picto-icon {
  height: 220px;
  position: relative;
  width: 110px;
}

.picto-icon__bg,
.picto-icon__fg {
  display: block;
  height: 100%;
  width: 100%;
}

.picto-icon__bg use {
  fill: #d9d9dd;
}

.picto-icon__fillwrap {
  height: 100%;
  left: 0;
  overflow: hidden;
  position: absolute;
  top: 0;
}

.picto-icon__fg {
  height: 100%;
  width: 110px;
}

.picto-card--brand .picto-icon__fg use {
  fill: var(--ms-color-brand);
}

.picto-card--loss .picto-icon__fg use {
  fill: var(--ms-color-danger);
}

.picto-card--age .picto-icon__fg use {
  fill: #6b8f53;
}

.picto-percent {
  color: var(--ms-color-text-primary);
  font-size: 1.1rem;
  font-weight: 800;
  min-width: 54px;
  text-align: right;
}

.picto-defs {
  position: absolute;
}

@media (max-width: 760px) {
  .picto-row {
    grid-template-columns: 1fr;
  }

  .picto-row__visual {
    align-items: flex-start;
    flex-direction: column;
  }

  .picto-percent {
    text-align: left;
  }

  .picto-icons {
    flex-wrap: wrap;
  }
}
</style>