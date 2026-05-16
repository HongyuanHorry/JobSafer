<template>
  <div class="post-guidance">
    <header class="guidance-header">
      <p class="guidance-kicker">Post-simulation guidance</p>
      <h2>Here is what happens next in the real world</h2>
      <p class="guidance-copy">
        Review the two biggest risks and the warning signs that should end the conversation.
      </p>
    </header>

    <section class="risks">
      <article v-if="!risks?.length" class="risk risk--empty">
        No risk guidance available for this scam type.
      </article>
      <article v-for="(risk, i) in risks" :key="i" class="risk">
        <h4>{{ risk.title }}</h4>
        <p>{{ risk.detail }}</p>
      </article>
    </section>

    <section class="warnings">
      <h3>Warning signs to remember</h3>
      <div class="warning-grid">
        <div v-if="!warnings?.length" class="warning-card warning-card--empty">
          No warning signs available for this scam type.
        </div>
        <button
          v-for="(w, i) in warnings"
          :key="i"
          class="warning-card"
          type="button"
          @click="reveal(i)"
        >
          <div>
            <p class="warning-label">{{ w.label }}</p>
            <p v-if="w.revealed" class="warning-explain">{{ w.explain }}</p>
          </div>
          <span class="warning-toggle">{{ w.revealed ? 'Hide' : 'Reveal' }}</span>
        </button>
      </div>
    </section>

    <button class="complete" @click="$emit('complete')">Finish and record completion</button>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { trackEvent } from '../services/simulationTracker'
const emit = defineEmits(['complete'])

const props = defineProps({
  risks: { type: Array, default: () => [] },
  warnings: { type: Array, default: () => [] },
})

const warnings = ref([])

watch(
  () => props.warnings,
  (val) => {
    warnings.value = (val || []).map((w) => ({ ...w, revealed: false }))
  },
  { immediate: true },
)

onMounted(() => {
  try {
    trackEvent({ event: 'guidance_viewed' })
  } catch (e) {}
})

function reveal(i) {
  warnings.value[i].revealed = !warnings.value[i].revealed
}
</script>

<style scoped>
.post-guidance {
  background: #fffbf7;
  border-radius: 18px;
  border: 1px solid rgba(27, 46, 94, 0.12);
  box-shadow: 0 12px 26px rgba(27, 46, 94, 0.08);
  padding: 22px;
  display: grid;
  gap: 18px;
}

.guidance-header h2 {
  margin: 8px 0 6px;
  color: #1b2e5e;
}

.guidance-kicker {
  margin: 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #0d9488;
  font-weight: 700;
}

.guidance-copy {
  margin: 0;
  color: #6b7280;
}

.risks {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.risk {
  background: #f7efe5;
  border-radius: 14px;
  padding: 14px;
}

.risk--empty {
  color: #6b7280;
  font-style: italic;
}

.warnings h3 {
  margin: 0 0 12px;
  color: #1b2e5e;
}

.warning-grid {
  display: grid;
  gap: 10px;
}

.warning-card {
  background: #fff1ed;
  border: 0;
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  text-align: left;
  cursor: pointer;
  gap: 12px;
}

.warning-card--empty {
  cursor: default;
  color: #6b7280;
  font-style: italic;
}

.warning-label {
  margin: 0;
  font-weight: 600;
  color: #1b2e5e;
}

.warning-explain {
  margin: 6px 0 0;
  color: #6b7280;
}

.warning-toggle {
  font-size: 0.78rem;
  color: #e8412a;
  font-weight: 600;
}

.complete {
  background: #1b2e5e;
  color: #ffffff;
  border: 0;
  border-radius: 14px;
  padding: 12px 16px;
  font-weight: 700;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.complete::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(27, 46, 94, 0) 0%,
    rgba(27, 46, 94, 0.28) 50%,
    rgba(232, 65, 42, 0.32) 100%
  );
  transform: translateX(-100%);
  transition: transform 0.35s ease;
}

.complete:hover::after,
.complete:focus-visible::after {
  transform: translateX(0);
}
</style>
