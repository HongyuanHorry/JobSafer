<template>
  <div class="future-alex">
    <section class="card">
      <p class="future-kicker">Future Alex</p>
      <h4>What this choice triggered</h4>
      <p class="commentary">{{ commentary }}</p>
      <div class="tags">
        <span v-for="(t, i) in tags" :key="i" class="tag">{{ t }}</span>
      </div>
      <button class="continue" @click="$emit('continue')">Continue</button>
    </section>
  </div>
</template>

<script setup>
const props = defineProps({
  commentary: { type: String, default: '' },
  tags: { type: Array, default: () => [] },
})
</script>

<style scoped>
.card {
  background: #fffbf7;
  border-radius: 18px;
  padding: 18px;
  color: #1b2e5e;
  box-shadow: 0 16px 32px rgba(27, 46, 94, 0.08);
  display: grid;
  gap: 10px;
  border: 1px solid rgba(27, 46, 94, 0.12);
}

.future-kicker {
  margin: 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #0d9488;
  font-weight: 700;
}

h4 {
  margin: 0;
  font-size: 1.05rem;
}

.commentary {
  margin: 0;
  line-height: 1.5;
  color: #4b5563;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-block;
  background: #f7efe5;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  color: #1b2e5e;
}

.continue {
  margin-top: 6px;
  background: #1b2e5e;
  color: #ffffff;
  border: 0;
  border-radius: 12px;
  font-weight: 700;
  padding: 10px 14px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

.continue::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(27, 46, 94, 0) 0%,
    rgba(27, 46, 94, 0.22) 50%,
    rgba(232, 65, 42, 0.32) 100%
  );
  transform: translateX(-100%);
  transition: transform 0.35s ease;
}

.continue:hover,
.continue:focus-visible {
  box-shadow: 0 10px 20px rgba(27, 46, 94, 0.18);
}

.continue:hover::after,
.continue:focus-visible::after {
  transform: translateX(0);
}
</style>
