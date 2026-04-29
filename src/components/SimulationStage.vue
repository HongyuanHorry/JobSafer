<template>
  <div class="simulation-stage">
    <header class="stage-header">
      <p class="stage-kicker">Stage {{ index }} / {{ total }}</p>
      <h3>{{ stage.title }}</h3>
      <p class="stage-subtitle">Pick Alex's response and see what the scammer does next.</p>
      <p class="stage-description">{{ stage.description }}</p>
    </header>

    <figure v-if="stage.illustration" class="stage-visual">
      <img :src="stage.illustration" :alt="stage.illustrationAlt || stage.title" />
    </figure>

    <section class="stage-conversation">
      <div
        v-for="(line, i) in stage.conversation"
        :key="i"
        class="bubble"
        :class="`bubble--${line.role}`"
      >
        <span class="bubble-role">{{ line.role === 'recruiter' ? 'Recruiter' : 'Alex' }}</span>
        <p>{{ line.text }}</p>
      </div>
    </section>

    <footer class="stage-actions" :class="{ 'stage-actions--locked': locked }">
      <button
        v-for="(opt, i) in stage.options"
        :key="i"
        class="choice"
        type="button"
        :disabled="locked"
        @click="choose(opt)"
      >
        {{ opt.label }}
      </button>
    </footer>

    <section v-if="locked" class="stage-details">
      <div class="detail-block">
        <h4>Why this works on people</h4>
        <p class="detail-hint">These tactics pressure you to act fast.</p>
        <ul v-if="stage.tactics?.length">
          <li v-for="(t, i) in stage.tactics" :key="i">
            <strong>{{ t.title }}:</strong> {{ t.detail }}
          </li>
        </ul>
        <p v-else class="detail-empty">No manipulation tactics available for this scam type.</p>
      </div>
      <div class="detail-block">
        <h4>How it sounds in real life</h4>
        <p class="detail-hint">Short samples show the tone scammers use.</p>
        <ul v-if="stage.examples?.length">
          <li v-for="(ex, i) in stage.examples" :key="i">{{ ex }}</li>
        </ul>
        <p v-else class="detail-empty">No example messages available for this scam type.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
const props = defineProps({
  stage: { type: Object, required: true },
  index: { type: Number, required: true },
  total: { type: Number, required: true },
  locked: { type: Boolean, default: false },
})
const emit = defineEmits(['next'])

function choose(opt) {
  // opt may contain commentary and tags to show in FutureAlex
  emit('next', { commentary: opt.commentary, tags: opt.tags })
}
</script>

<style scoped>
.simulation-stage {
  background: #fffbf7;
  border-radius: 18px;
  border: 1px solid rgba(27, 46, 94, 0.12);
  box-shadow: 0 12px 24px rgba(27, 46, 94, 0.08);
  padding: 20px;
  display: grid;
  gap: 18px;
}

.stage-header h3 {
  margin: 6px 0 8px;
  font-size: 1.25rem;
  color: #1b2e5e;
}

.stage-kicker {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.72rem;
  font-weight: 700;
  color: #0d9488;
}

.stage-subtitle {
  margin: 0;
  color: #6b7280;
}

.stage-description {
  margin: 10px 0 0;
  color: #4b5563;
}

.stage-visual {
  margin: 0;
}

.stage-visual img {
  display: block;
  width: 100%;
  border-radius: 16px;
  aspect-ratio: 16 / 8.5;
  object-fit: cover;
  border: 1px solid rgba(27, 46, 94, 0.08);
}

.stage-conversation {
  display: grid;
  gap: 12px;
}

.bubble {
  padding: 14px 16px;
  border-radius: 16px;
  display: grid;
  gap: 6px;
  line-height: 1.5;
  animation: bubbleIn 0.3s ease;
  position: relative;
}

.bubble--recruiter {
  background: #f7efe5;
  color: #1b2e5e;
  justify-self: start;
  max-width: 88%;
}

.bubble--recruiter::after {
  content: '';
  position: absolute;
  left: -6px;
  bottom: 8px;
  width: 12px;
  height: 12px;
  background: #f7efe5;
  border-radius: 0 0 10px 0;
  transform: rotate(45deg);
}

.bubble--alex {
  background: linear-gradient(135deg, #fff4dc 0%, #f7efe5 100%);
  color: #1b2e5e;
  justify-self: end;
  max-width: 88%;
}

.bubble--alex::after {
  content: '';
  position: absolute;
  right: -6px;
  bottom: 8px;
  width: 12px;
  height: 12px;
  background: #f7efe5;
  border-radius: 0 0 0 10px;
  transform: rotate(45deg);
}

.bubble-role {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #0d9488;
}

.stage-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.stage-actions--locked {
  opacity: 0.6;
}

.stage-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.detail-block {
  background: #f7efe5;
  border-radius: 14px;
  padding: 12px 14px;
  border: 1px solid rgba(27, 46, 94, 0.08);
}

.detail-block h4 {
  margin: 0 0 8px;
  color: #1b2e5e;
  font-size: 0.95rem;
}

.detail-hint {
  margin: -2px 0 8px;
  color: #6b7280;
  font-size: 0.82rem;
}

.detail-block ul {
  margin: 0;
  padding-left: 18px;
  color: #4b5563;
}

.detail-empty {
  margin: 0;
  color: #6b7280;
  font-style: italic;
}

.choice {
  background: #1b2e5e;
  border: 0;
  border-radius: 14px;
  color: #ffffff;
  cursor: pointer;
  font-weight: 600;
  padding: 12px 14px;
  text-align: left;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
  position: relative;
  overflow: hidden;
}

.choice::after {
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

.choice:hover,
.choice:focus-visible {
  background: #13244a;
  box-shadow: 0 10px 22px rgba(27, 46, 94, 0.2);
}

.choice:hover::after,
.choice:focus-visible::after {
  transform: translateX(0);
}

.choice:active {
  box-shadow: 0 6px 12px rgba(27, 46, 94, 0.2);
}

.choice:disabled {
  opacity: 0.5;
  cursor: default;
  box-shadow: none;
}

@keyframes bubbleIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .bubble {
    animation: none;
  }
}
</style>
