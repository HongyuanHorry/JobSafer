<template>
  <section class="sim" :class="{ 'sim--fullscreen': isFullscreen }" aria-live="polite" ref="simRef">
    <Transition name="fs-overlay">
      <div v-if="isTransitioning" class="fs-transition-overlay" aria-hidden="true">
        <span class="fs-transition-dot"></span>
        <span class="fs-transition-dot"></span>
        <span class="fs-transition-dot"></span>
      </div>
    </Transition>
    <div v-if="isFullscreen" class="fullscreen-bar">
      <span class="fullscreen-bar__label">Fullscreen mode - press Esc to exit</span>
      <button class="fullscreen-bar__exit" type="button" @click="exitFullscreen">Exit</button>
    </div>
    <div class="sim-wrapper">
      <Transition name="sim-shell-fade" mode="out-in">
        <article
          :key="`stage-${stage}`"
          class="sim-card"
          :class="{
            'sim-card--split-thirds': stage === 0,
            'sim-card--intro': stage === 0,
            'sim-card--walkthrough': stage >= 1 && stage <= 5,
            'sim-card--finale': stage > 5,
          }"
        >
          <template v-if="stage === 0">
            <div class="sim-visual intro-visual">
              <div class="scene-image-wrap">
                <img class="sim-image" src="/icons/image1.png" alt="Alex base character" />
              </div>
            </div>

            <div class="sim-copy sim-copy--intro">
              <p class="sim-meta">
                {{ scenario.title }}
                <span class="sim-meta__sep"> - </span>
                <span v-if="stage === 0">Introduction</span>
                <span v-else>Stage {{ stageLabel }} of 5</span>
              </p>
              <div
                class="progress-line"
                role="progressbar"
                :aria-valuenow="progressAriaNow"
                aria-valuemin="0"
                aria-valuemax="5"
                aria-label="Scenario progress"
              >
                <div
                  class="progress-line__fill"
                  :style="{ width: `${stageProgressPercent}%` }"
                ></div>
              </div>
              <div class="intro-meet-head">
                <figure class="intro-meet-head__art" aria-hidden="true">
                  <img class="intro-meet-head__img" src="/icons/image1.png" alt="" />
                </figure>
                <h4 class="intro-meet-head__title">Meet Alex</h4>
              </div>

              <p class="lead intro-lead">
                <span class="intro-lead__full"
                  >You'll step into Alex's shoes through a realistic job scam scenario. Watch how
                  pressure and urgency build, then discover the red flags that save the day.</span
                >
                <span class="intro-lead__short"
                  >Step into the scam. Learn how to spot the red flags.</span
                >
              </p>

              <div class="thinking-card" aria-label="Alex says">
                <p class="thinking-card__label">Alex says</p>
                <p
                  v-for="(line, idx) in introThinkingLines"
                  :key="`intro-think-${idx}`"
                  class="thinking-card__line thinking-card__line--desktop"
                >
                  {{ line }}
                </p>
                <p class="thinking-card__line thinking-card__line--mobile">
                  {{ introMobileSpeech }}
                </p>
              </div>

              <div class="actions">
                <button class="primary" type="button" @click="openFullscreenPrompt">
                  Start scenario ->
                </button>
                <button class="secondary" type="button" @click="$emit('exit')">
                  Back to choose another scam type
                </button>
              </div>

            </div>
          </template>

          <template v-else-if="stage <= 5">
            <div class="sim-visual sim-visual--walkthrough">
              <article class="scene-card scene-card--walkthrough" aria-label="Scam scene">
                <section class="wt-block wt-block--scene" aria-label="Scene illustration">
                  <p class="wt-label">Scene</p>
                  <div class="scene-image-wrap scene-image-wrap--walkthrough">
                    <img class="sim-image" :src="stageImage" :alt="`Alex stage ${stage}`" />
                    <div
                      class="scene-image-fade scene-image-fade--walkthrough"
                      aria-hidden="true"
                    ></div>
                  </div>
                </section>

                <section class="wt-block wt-block--conversation" aria-label="Conversation sample">
                  <p class="wt-label">Conversation</p>
                  <div class="wt-conversation-card">
                    <div class="phone-thread phone-thread--walkthrough">
                      <template
                        v-for="(line, idx) in stageThreadDesktopLines"
                        :key="`wt-d-${stage}-${idx}`"
                      >
                        <p
                          :class="[
                            'bubble',
                            'bubble--wt-desktop',
                            line.role === 'alex' ? 'bubble--alex' : 'bubble--scammer',
                          ]"
                        >
                          {{ line.text }}
                        </p>
                      </template>
                      <template
                        v-for="(line, idx) in stageThreadMobileLines"
                        :key="`wt-m-${stage}-${idx}`"
                      >
                        <p
                          :class="[
                            'bubble',
                            'bubble--wt-mobile',
                            line.role === 'alex' ? 'bubble--alex' : 'bubble--scammer',
                          ]"
                        >
                          {{ line.text }}
                        </p>
                      </template>
                    </div>
                  </div>
                </section>
              </article>
            </div>

            <div
              class="sim-copy sim-copy--scene"
              :class="{ 'sim-copy--danger': picked === 'risk' }"
            >
              <div class="wt-stage-mobile-stack">
                <header class="scene-head scene-head--mobile">
                  <p class="sim-meta">{{ scenario.title }} - Stage {{ stageLabel }} of 5</p>
                  <div
                    class="progress-line"
                    role="progressbar"
                    :aria-valuenow="progressAriaNow"
                    aria-valuemin="0"
                    aria-valuemax="5"
                    aria-label="Scenario progress"
                  >
                    <div
                      class="progress-line__fill"
                      :style="{ width: `${stageProgressPercent}%` }"
                    ></div>
                  </div>
                </header>
                <h4 class="scene-stage-title scene-stage-title--mobile">
                  {{ scenario.stages[stage - 1].title }}
                </h4>
                <p class="scene-stage-lead scene-stage-lead--mobile wt-stage-lead--stack">
                  {{ stageLeadMobile }}
                </p>
                <figure class="wt-scene-mobile-figure">
                  <img
                    class="wt-scene-mobile-figure__img"
                    :src="stageImage"
                    :alt="`Alex stage ${stage}`"
                  />
                </figure>
              </div>

              <section class="wt-mobile-convo" aria-label="Conversation sample">
                <div class="wt-conversation-card wt-conversation-card--mobile">
                  <div class="phone-thread phone-thread--walkthrough phone-thread--compact">
                    <template
                      v-for="(line, idx) in stageThreadMobileLines"
                      :key="`wt-m-copy-${stage}-${idx}`"
                    >
                      <p
                        :class="[
                          'bubble',
                          line.role === 'alex' ? 'bubble--alex' : 'bubble--scammer',
                        ]"
                      >
                        {{ line.text }}
                      </p>
                    </template>
                  </div>
                </div>
              </section>

              <header class="scene-head scene-head--desktop">
                <p class="sim-meta">{{ scenario.title }} - Stage {{ stageLabel }} of 5</p>
                <div
                  class="progress-line"
                  role="progressbar"
                  :aria-valuenow="progressAriaNow"
                  aria-valuemin="0"
                  aria-valuemax="5"
                  aria-label="Scenario progress"
                >
                  <div
                    class="progress-line__fill"
                    :style="{ width: `${stageProgressPercent}%` }"
                  ></div>
                </div>
              </header>

              <h4 class="scene-stage-title scene-stage-title--desktop">
                {{ scenario.stages[stage - 1].title }}
              </h4>
              <p class="scene-stage-lead scene-stage-lead--desktop">{{ currentStage.text }}</p>

              <div v-if="!picked" class="wt-stage-context wt-stage-context--desktop">
                <div class="risk-signal risk-signal--editorial">
                  <p class="risk-signal__kicker">Risk signal</p>
                  <p class="risk-signal__tag risk-signal__tag--desktop">
                    <span class="risk-signal__glyph" aria-hidden="true">!</span>
                    Risk signal - {{ currentStage.riskTag }}
                  </p>
                  <p class="risk-signal__tag risk-signal__tag--mobile">
                    <span class="risk-signal__glyph" aria-hidden="true">!</span>
                    {{ currentStage.riskTag }}
                  </p>
                  <p class="risk-signal__reason risk-signal__reason--desktop">
                    {{ currentStage.riskReason }}
                  </p>
                  <p class="risk-signal__reason risk-signal__reason--mobile">
                    {{ stageRiskReasonMobile }}
                  </p>
                </div>
                <div class="thinking-strip">
                  <p class="thinking-strip__label">Alex is thinking</p>
                  <p class="thinking-strip__line thinking-strip__line--desktop">
                    {{ thoughtLines[0] }}
                  </p>
                  <p class="thinking-strip__line thinking-strip__line--mobile">
                    {{ stageAlexThinkMobile }}
                  </p>
                </div>
              </div>

              <details
                v-if="!picked"
                class="stage-context-panel wt-stage-context wt-stage-context--mobile"
              >
                <summary class="stage-context-panel__summary disclosure-summary">
                  <span class="disclosure-summary__text">
                    <span class="stage-context-panel__glyph" aria-hidden="true">!</span>
                    Context - {{ currentStage.riskTag }}
                  </span>
                  <span class="disclosure-chevron" aria-hidden="true"></span>
                </summary>
                <div class="stage-context-panel__body">
                  <div class="risk-signal risk-signal--editorial">
                    <p class="risk-signal__kicker">Risk signal</p>
                    <p class="risk-signal__tag risk-signal__tag--mobile">
                      <span class="risk-signal__glyph" aria-hidden="true">!</span>
                      {{ currentStage.riskTag }}
                    </p>
                    <p class="risk-signal__reason risk-signal__reason--mobile">
                      {{ stageRiskReasonMobile }}
                    </p>
                  </div>
                  <div class="thinking-strip">
                    <p class="thinking-strip__label">Alex is thinking</p>
                    <p class="thinking-strip__line thinking-strip__line--mobile">
                      {{ stageAlexThinkMobile }}
                    </p>
                  </div>
                </div>
              </details>

              <p class="choices-prompt">What should Alex do?</p>

              <div class="choices choices--scene" aria-label="Decision options">
                <button
                  class="choice"
                  :class="optionStateClass('safe')"
                  type="button"
                  :disabled="Boolean(picked)"
                  @click="pick('safe')"
                >
                  <span class="choice-title">{{ scenario.stages[stage - 1].safeOption }}</span>
                </button>
                <button
                  class="choice"
                  :class="optionStateClass('risk')"
                  type="button"
                  :disabled="Boolean(picked)"
                  @click="pick('risk')"
                >
                  <span class="choice-title">{{ scenario.stages[stage - 1].riskOption }}</span>
                </button>
              </div>

              <div
                v-if="picked && choiceFeedback"
                class="coach-note coach-note--compact"
                :class="picked === 'risk' ? 'coach-note--risk' : 'coach-note--safe'"
                role="status"
                aria-live="polite"
              >
                <p class="coach-note__judgment">{{ choiceFeedback.judgment }}</p>
                <details class="coach-note__more">
                  <summary class="disclosure-summary">
                    <span class="disclosure-summary__text">Why this matters</span>
                    <span class="disclosure-chevron" aria-hidden="true"></span>
                  </summary>
                  <p class="coach-note__explain">{{ choiceFeedback.explain }}</p>
                  <p class="coach-note__action">
                    <span class="coach-note__action-label">{{ choiceFeedback.actionLabel }}</span>
                    {{ choiceFeedback.action }}
                  </p>
                </details>

                <div class="actions actions--compact">
                  <button class="primary" type="button" @click="nextStage">Continue -></button>
                  <button class="secondary" type="button" @click="$emit('exit')">
                    Back to choose another scam type
                  </button>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="sim-copy sim-copy--final">
              <section class="finale-celebration" aria-label="Scenario complete">
                <figure class="finale-celebration__art">
                  <img
                    class="finale-celebration__img"
                    :src="finalOutcomeImage"
                    :alt="finalOutcomeAlt"
                  />
                </figure>
                <div class="finale-celebration__copy">
                  <p class="finale-celebration__eyebrow">{{ finaleCelebrationEyebrow }}</p>
                  <h4 class="final-outcome-heading">{{ finalOutcomeTitle }}</h4>
                  <p v-if="finalOutcomeMessage" class="finale-celebration__message">
                    {{ finalOutcomeMessage }}
                  </p>
                  <div class="finale-outcome-tags" aria-label="Outcome highlights">
                    <span
                      class="finale-outcome-tag"
                      :class="
                        isHighPressureOutcome
                          ? 'finale-outcome-tag--warn'
                          : 'finale-outcome-tag--calm'
                      "
                    >
                      {{ isHighPressureOutcome ? 'High pressure run' : 'Low pressure run' }}
                    </span>
                    <span class="finale-outcome-tag finale-outcome-tag--neutral"
                      >Scenario complete</span
                    >
                  </div>
                </div>
              </section>
              <section
                class="outcome-section outcome-section--coach"
                v-if="showPersonalSummary"
                aria-label="Learning report and AI coach"
              >
                <details class="finale-coach-panel" open aria-label="Learning and AI coach">
                  <summary class="finale-coach-panel__summary disclosure-summary">
                    <span class="disclosure-summary__text">
                      <span class="ai-sparkle" aria-hidden="true">AI</span>
                      Learning &amp; AI coach
                      <span v-if="coachLoading" class="ai-badge ai-badge--loading" aria-live="polite"
                        >...</span
                      >
                      <span v-else-if="coachSource === 'ai'" class="ai-badge ai-badge--ok">
                        Gemini
                      </span>
                    </span>
                    <span class="disclosure-chevron" aria-hidden="true"></span>
                  </summary>
                  <div class="summary-body summary-body--ai-open">
                    <div class="coach-unified-stack coach-unified-stack--ai-only">
                      <section
                        v-if="harmFocusBullets.length"
                        class="coach-panel coach-panel--stakes"
                        :class="{ 'coach-panel--stakes-high': isHighPressureOutcome }"
                        aria-label="Harm patterns"
                      >
                        <p class="coach-panel__heading">Why it works</p>
                        <p v-if="isHighPressureOutcome" class="coach-stakes-meta">
                          Signals | ABC News Jul 2025 | Scamwatch
                        </p>
                        <ul class="coach-stakes-bullets">
                          <li v-for="(bullet, hb) in harmFocusBullets" :key="`coach-h-${hb}`">
                            {{ bullet }}
                          </li>
                        </ul>
                      </section>

                      <section class="coach-panel coach-panel--synthesis" aria-label="Coach">
                        <p class="coach-panel__heading coach-panel__heading--secondary">
                          Coach note
                        </p>

                        <details v-if="coachError" class="coach-livefail">
                          <summary class="coach-livefail__summary">
                            Could not reach the live Gemini model - offline coach fills in below.
                          </summary>
                          <p class="coach-livefail__detail">{{ coachError }}</p>
                        </details>

                        <div v-if="coachLoading" class="ai-coach-skeleton">
                          <span class="ai-coach-line ai-coach-line--wide"></span>
                          <span class="ai-coach-line"></span>
                          <span class="ai-coach-line ai-coach-line--mid"></span>
                        </div>
                        <div v-else class="ai-coach-compact">
                          <p v-if="coachParagraphDisplay" class="ai-coach-compact__para">
                            {{ coachParagraphDisplay }}
                          </p>
                          <p v-if="coachTopRiskDisplay" class="ai-coach-compact__riskline">
                            <span>Pattern:</span> {{ coachTopRiskDisplay }}
                          </p>
                          <div
                            v-if="coachChecklistRows.length"
                            class="ai-coach-checklist"
                            aria-label="Action checklist"
                          >
                            <p class="ai-coach-checklist__label">Next step checklist</p>
                            <div class="ai-coach-checklist__items">
                              <button
                                v-for="row in coachChecklistRows"
                                :key="row.id"
                                type="button"
                                class="ai-coach-checklist__item"
                                :class="{
                                  'ai-coach-checklist__item--on': nextStepChecksModel[row.id],
                                }"
                                :aria-pressed="Boolean(nextStepChecksModel[row.id])"
                                @click="nextStepChecksModel[row.id] = !nextStepChecksModel[row.id]"
                              >
                                <span class="ai-coach-checklist__box" aria-hidden="true"></span>
                                <span v-if="row.tag" class="ai-coach-checklist__tag">{{
                                  row.tag
                                }}</span>
                                <span>{{ row.label }}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                </details>

                <section class="finale-insights-report" aria-label="Scam insights report">
                  <div class="finale-insights-report__head">
                    <p class="finale-insights-report__kicker">Scam insights report</p>
                    <h5 class="finale-insights-report__title">Data facts for {{ activeInsightReport.typeLabel }}</h5>
                    <p class="finale-insights-report__summary">
                      For {{ activeInsightReport.typeLabel }}, here are data facts that can help you
                      make better decisions.
                    </p>
                  </div>

                  <div class="finale-insights-type-tabs" role="tablist" aria-label="Insight modules">
                    <button
                      v-for="option in insightViewOptions"
                      :key="option.key"
                      type="button"
                      class="finale-insights-type-tab"
                      :class="{ 'finale-insights-type-tab--active': selectedInsightView === option.key }"
                      :aria-selected="selectedInsightView === option.key"
                      role="tab"
                      @click="selectedInsightView = option.key"
                    >
                      {{ option.label }}
                    </button>
                  </div>

                  <article class="finale-insights-type-card">
                    <section v-if="selectedInsightView === 'trend'" class="finale-insights-block">
                      <p class="finale-insights-block__title">Trend &amp; loss</p>
                      <DualAxisTrendChart
                        :scam-type="activeInsightReport.typeLabel"
                        :trend-data="activeInsightReport.trendData"
                        :time-period="insightTimePeriod"
                      />
                    </section>

                    <section v-else-if="selectedInsightView === 'age'" class="finale-insights-block">
                      <p class="finale-insights-block__title">Age groups</p>
                      <div
                        v-if="activeInsightReport.agePictogramItems.length"
                        class="finale-age-chart--desktop"
                      >
                        <PersonPictogramChart
                          title=""
                          note=""
                          :items="activeInsightReport.agePictogramItems"
                          empty-message="No 18-24 age-group data available for this scam type"
                          tone="age"
                        />
                      </div>
                      <div v-if="activeAgeSpotlight" class="finale-age-spotlight finale-age-spotlight--mobile">
                        <p class="finale-age-spotlight__label">Primary risk cluster</p>
                        <div class="finale-age-spotlight__row">
                          <p class="finale-age-spotlight__group">{{ activeAgeSpotlight.label }}</p>
                          <div class="finale-age-spotlight__dots" aria-hidden="true">
                            <span
                              v-for="dot in 5"
                              :key="`age-dot-${dot}`"
                              class="finale-age-spotlight__dot"
                              :class="{ 'finale-age-spotlight__dot--on': dot <= activeAgeDotCount }"
                            ></span>
                          </div>
                          <p class="finale-age-spotlight__stat">{{ activeAgeSpotlight.statLabel }}</p>
                        </div>
                        <p class="finale-age-spotlight__caption">{{ activeAgeSpotlight.statCaption }}</p>
                      </div>
                      <div v-else class="finale-insights-empty">
                        No 18-24 age-group data available for this scam type.
                      </div>
                    </section>

                    <section v-else-if="selectedInsightView === 'location'" class="finale-insights-block">
                      <p class="finale-insights-block__title">Location map</p>
                      <div v-if="!activeYearLocationData.length" class="finale-insights-empty">
                        No location trend data available for this scam type.
                      </div>
                      <div v-else class="finale-map-layout">
                        <div class="finale-map-controls">
                          <div class="finale-map-toolbar">
                            <button
                              type="button"
                              class="finale-map-button"
                              @click="startInsightMapPlayback"
                            >
                              <span aria-hidden="true">&#9654;</span>
                              <span>Play</span>
                            </button>
                            <button type="button" class="finale-map-button" @click="stopInsightMapPlayback">
                              <span aria-hidden="true">&#9208;</span>
                              <span>Pause</span>
                            </button>
                            <p class="finale-map-year"><strong>Year: {{ selectedInsightYear }}</strong></p>
                          </div>
                          <div class="finale-map-slider-group">
                            <input
                              v-model.number="selectedInsightYear"
                              class="finale-map-slider"
                              type="range"
                              :min="activeInsightYears[0]"
                              :max="activeInsightYears[activeInsightYears.length - 1]"
                              step="1"
                              @input="stopInsightMapPlayback"
                            />
                            <div class="finale-map-year-labels" aria-label="Map year scale">
                              <span
                                v-for="year in activeInsightYears"
                                :key="`sim-map-year-${year}`"
                                :class="{
                                  'finale-map-year-labels__year--active':
                                    Number(year) === Number(selectedInsightYear),
                                }"
                                >{{ year }}</span
                              >
                            </div>
                          </div>
                        </div>
                        <LeafletD3Map
                          :map-data="activeInsightReport.locationTrendData"
                          :selected-year="Number(selectedInsightYear)"
                        />
                      </div>
                    </section>

                    <section v-else class="finale-insights-block finale-insights-block--summary">
                      <p class="finale-insights-block__title">Dataset summary</p>
                      <p class="finale-insights-summary-period">Time period: {{ insightTimePeriod }}</p>
                      <div class="finale-summary-dual-box">
                        <div class="finale-summary-dual-box__half">
                          <strong class="finale-summary-dual-box__value">{{
                            formatNumber(activeInsightReport.typeTotalReports)
                          }}</strong>
                          <span class="finale-summary-dual-box__label">Total reported cases</span>
                        </div>
                        <div class="finale-summary-dual-box__divider" aria-hidden="true"></div>
                        <div class="finale-summary-dual-box__half">
                          <strong class="finale-summary-dual-box__value">{{
                            formatMoney(activeInsightReport.typeTotalLoss)
                          }}</strong>
                          <span class="finale-summary-dual-box__label"
                            >Total combined financial loss</span
                          >
                        </div>
                      </div>
                      <div class="finale-summary-grid">
                        <div class="finale-summary-tile">
                          <strong v-if="activeInsightReport.rankInfo">
                            #{{ activeInsightReport.rankInfo.rank }} /
                            {{ activeInsightReport.rankInfo.totalTypes }}
                          </strong>
                          <strong v-else>N/A</strong>
                          <span>Rank by report count</span>
                        </div>
                      </div>
                      <p class="finale-summary-meaning">{{ insightMeaningLine }}</p>
                    </section>
                  </article>
                </section>
              </section>

              <div class="actions actions--finale">
                <a
                  class="primary"
                  href="https://www.scamwatch.gov.au/report-a-scam"
                  target="_blank"
                  rel="noopener noreferrer"
                  >Report to Scamwatch -></a
                >
                <button class="secondary" type="button" @click="$emit('restart')">
                  Try another scenario
                </button>
              </div>
            </div>
          </template>
        </article>
      </Transition>
    </div>

    <Teleport to="body">
      <div
        v-if="showFullscreenPrompt"
        class="sim-fs-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Fullscreen choice"
      >
        <button
          type="button"
          class="sim-fs-modal__backdrop"
          aria-label="Close fullscreen choice"
          @click="confirmFullscreenChoice(false)"
        ></button>
        <div class="sim-fs-modal__panel">
          <p class="sim-fs-modal__title">Enter fullscreen mode?</p>
          <p class="sim-fs-modal__copy">Fullscreen helps focus during the simulation.</p>
          <p class="sim-fs-modal__tip">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 9v6h4l5 4V5L8 9H4zm12.5-1.5a1 1 0 0 1 1.4 0 6.5 6.5 0 0 1 0 9.2 1 1 0 0 1-1.4-1.4 4.5 4.5 0 0 0 0-6.4 1 1 0 0 1 0-1.4zm3.2-3.2a1 1 0 0 1 1.4 0 11 11 0 0 1 0 15.6 1 1 0 0 1-1.4-1.4 9 9 0 0 0 0-12.8 1 1 0 0 1 0-1.4z"
              />
            </svg>
            <span>Tip: the simulator includes sound effects.</span>
          </p>
          <div class="sim-fs-modal__actions">
            <button
              class="sim-fs-modal__btn sim-fs-modal__btn--primary"
              type="button"
              @click="confirmFullscreenChoice(true)"
            >
              Enter fullscreen
            </button>
            <button
              class="sim-fs-modal__btn sim-fs-modal__btn--secondary"
              type="button"
              @click="confirmFullscreenChoice(false)"
            >
              Continue windowed
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue'
import DualAxisTrendChart from './DualAxisTrendChart.vue'
import PersonPictogramChart from './PersonPictogramChart.vue'
import LeafletD3Map from './LeafletD3Map.vue'
import { SCAM_SIMULATION_SCENARIOS } from '../constants/scamSimulationScenarios'
import { formatMoney, formatNumber } from '../utils/chartFormatters.js'
import {
  getAgeDistribution,
  getAvailableYears,
  getLocationTrendByScamType,
  getScamTypeLabel,
  getScamTypeOptions,
  getScamTypeRank,
  getTimePeriod,
  getTrendByScamType,
} from '../services/scamInsightsService'
import {
  persistWalkthroughSession,
  appendWalkthroughEvent,
} from '../services/walkthroughTimingService'

const props = defineProps({
  scenarioType: { type: String, default: 'task_based' },
  detectedLabel: { type: String, default: '' },
  detectedTone: { type: String, default: '' },
  showDetectedResult: { type: Boolean, default: false },
  coachParagraph: { type: String, default: '' },
  coachTopRisk: { type: String, default: '' },
  coachNextAction: { type: String, default: '' },
  coachTone: { type: String, default: '' },
  coachHesitationInsight: { type: String, default: '' },
  coachSource: { type: String, default: 'idle' }, // idle | ai | fallback
  coachLoading: { type: Boolean, default: false },
  coachError: { type: String, default: '' },
})

const emit = defineEmits(['restart', 'exit', 'completed'])

function shortenToWords(text, maxWords = 22) {
  const clean = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!clean) return ''
  const words = clean.split(' ')
  if (words.length <= maxWords) return clean
  return `${words.slice(0, maxWords).join(' ')}...`
}

const stage = ref(0)
const picked = ref('')
const riskCount = ref(0)
const feedbackHistory = ref([])
const showPersonalSummary = ref(false)
const showFullscreenPrompt = ref(false)
const simRef = ref(null)
const isFullscreen = ref(false)
const isTransitioning = ref(false)
let savedScrollY = 0
const interactionTiming = ref([])
const stageEnteredAt = ref(0)

const scenario = computed(
  () => SCAM_SIMULATION_SCENARIOS[props.scenarioType] || SCAM_SIMULATION_SCENARIOS.task_based,
)
const stageLabel = computed(() => Math.min(5, Math.max(1, stage.value)))

/** Single thin progress bar: stage 1-5 advances fill; intro 0 empty; finale (>5) treated as full in template. */
const stageProgressPercent = computed(() => {
  const s = stage.value
  if (s <= 0) return 0
  if (s > 5) return 100
  return Math.round((s / 5) * 100)
})

const progressAriaNow = computed(() => {
  const s = stage.value
  if (s <= 0) return 0
  if (s > 5) return 5
  return Math.min(5, s)
})

const currentStage = computed(() => scenario.value.stages[Math.max(0, stage.value - 1)] || {})

function buildStageThreadLines(stage, useMobile) {
  const mobile = stage?.mobile
  if (useMobile && Array.isArray(mobile?.thread) && mobile.thread.length) {
    return mobile.thread.slice(0, 3).map((item) => {
      if (typeof item === 'string') return { role: 'scammer', text: item }
      return { role: item.role === 'alex' ? 'alex' : 'scammer', text: item.text }
    })
  }
  const base = stage?.scammerThread || (stage?.scammerLine ? [stage.scammerLine] : [])
  const lines = base.map((text) => ({ role: 'scammer', text }))
  if (stage?.phoneReply) lines.push({ role: 'alex', text: stage.phoneReply })
  return lines
}

const stageThreadDesktopLines = computed(() => buildStageThreadLines(currentStage.value, false))
const stageThreadMobileLines = computed(() => buildStageThreadLines(currentStage.value, true))
const stageLeadMobile = computed(
  () => currentStage.value.mobile?.text || currentStage.value.text || '',
)
const stageRiskReasonMobile = computed(
  () => currentStage.value.mobile?.riskReason || currentStage.value.riskReason || '',
)
const stageAlexThinkMobile = computed(
  () => currentStage.value.mobile?.alexThink || (currentStage.value.alexTalk || [])[0] || '',
)

const thoughtLines = computed(() => (currentStage.value.alexTalk || []).slice(0, 2))
const introThinkingLines = computed(() => (scenario.value.introAlex || []).slice(0, 2))
const introMobileSpeech = computed(() => {
  const brief = scenario.value.introAlexMobile
  if (typeof brief === 'string' && brief.trim()) return brief.trim()
  if (Array.isArray(brief) && brief.length) return brief.join(' ')
  return introThinkingLines.value.join(' ')
})

const localSummaryPoints = computed(() => buildLocalSummaryPoints())
const localSummaryText = computed(() => localSummaryPoints.value.join(' '))

const coachParagraphDisplay = computed(() => props.coachParagraph.trim())
const coachTopRiskDisplay = computed(() => props.coachTopRisk.trim())
const insightTypeOptions = getScamTypeOptions()
const insightViewOptions = [
  { key: 'trend', label: 'Trend & loss' },
  { key: 'age', label: 'Age groups' },
  { key: 'location', label: 'Location map' },
  { key: 'summary', label: 'Dataset summary' },
]
const insightTimePeriod = computed(() => getTimePeriod())
const insightFallbackYear =
  [...getAvailableYears()].sort((a, b) => a - b).at(-1) ?? new Date().getFullYear()
const selectedInsightView = ref('trend')
const selectedInsightYear = ref(insightFallbackYear)
const isInsightMapPlaying = ref(false)
let insightMapTimer = null

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

function buildAgePictogramItems(ageData) {
  const totalAgeReports = ageData.reduce((sum, row) => sum + Number(row.value || 0), 0)
  const youthAgeGroup = ageData.find((row) => row.label === '18-24')

  if (!youthAgeGroup) return []

  const share = totalAgeReports ? (Number(youthAgeGroup.value || 0) / totalAgeReports) * 100 : 0

  return [
    {
      label: '18-24',
      displayValue: `${formatNumber(youthAgeGroup.value)} reports`,
      helper: `${getRelatableShareLabel(share)} reports involved someone aged 18 to 24`,
      percent: share,
      statLabel: getRelatableShareLabel(share),
      statCaption: `${share.toFixed(1)}% of reports for this scam type came from 18 to 24 year olds`,
      highlighted: true,
      badge: 'Young job seekers',
    },
  ]
}

const activeInsightTypeKey = computed(
  () => props.scenarioType || insightTypeOptions[0]?.value || '',
)

const activeInsightTypeOption = computed(
  () =>
    insightTypeOptions.find((option) => option.value === activeInsightTypeKey.value) ||
    insightTypeOptions[0] ||
    null,
)

const activeInsightReport = computed(() => {
  const typeKey = activeInsightTypeOption.value?.value || activeInsightTypeKey.value
  const typeLabel =
    activeInsightTypeOption.value?.label || getScamTypeLabel(typeKey) || 'Selected scam type'
  const trendData = getTrendByScamType(typeKey)
  const ageData = getAgeDistribution(typeKey)
  const locationTrendData = getLocationTrendByScamType(typeKey)
  const rankInfo = getScamTypeRank(typeKey)
  const typeTotalReports = trendData.reduce((sum, row) => sum + Number(row.report_count || 0), 0)
  const typeTotalLoss = trendData.reduce((sum, row) => sum + Number(row.total_loss || 0), 0)

  return {
    typeKey,
    typeLabel,
    trendData,
    agePictogramItems: buildAgePictogramItems(ageData),
    locationTrendData,
    rankInfo,
    typeTotalReports,
    typeTotalLoss,
  }
})

const activeAgeSpotlight = computed(() => activeInsightReport.value.agePictogramItems[0] || null)

const activeAgeDotCount = computed(() => {
  const percent = Number(activeAgeSpotlight.value?.percent || 0)
  const scaled = Math.round((Math.max(0, Math.min(100, percent)) / 100) * 5)
  return Math.max(0, Math.min(5, scaled))
})

const activeInsightYears = computed(() =>
  [
    ...new Set(
      activeInsightReport.value.locationTrendData
        .map((row) => Number(row.year))
        .filter(Number.isFinite),
    ),
  ].sort((a, b) => a - b),
)

const activeYearLocationData = computed(() =>
  activeInsightReport.value.locationTrendData.filter(
    (row) => Number(row.year) === Number(selectedInsightYear.value),
  ),
)

function stopInsightMapPlayback() {
  isInsightMapPlaying.value = false
  if (insightMapTimer) {
    clearInterval(insightMapTimer)
    insightMapTimer = null
  }
}

function startInsightMapPlayback() {
  if (isInsightMapPlaying.value) return
  if (activeInsightYears.value.length <= 1) return

  isInsightMapPlaying.value = true
  insightMapTimer = setInterval(() => {
    const years = activeInsightYears.value
    if (!years.length) return
    const currentIndex = years.indexOf(Number(selectedInsightYear.value))
    const nextIndex = currentIndex >= years.length - 1 ? 0 : currentIndex + 1
    selectedInsightYear.value = years[nextIndex]
  }, 1200)
}

watch(
  activeInsightYears,
  (years) => {
    stopInsightMapPlayback()
    selectedInsightYear.value = years[0] ?? insightFallbackYear
  },
  { immediate: true },
)

watch(selectedInsightView, (view) => {
  if (view !== 'location') stopInsightMapPlayback()
})

const choiceFeedback = computed(() => {
  if (!picked.value) return null
  const st = currentStage.value
  const isRisk = picked.value === 'risk'

  if (isRisk) {
    return {
      judgment: `Higher risk - ${st.riskTag || 'pressure signal'}`,
      explain: shortenToWords(st.learningPoint || st.riskReason, 20),
      action: shortenToWords(st.safeAction, 22),
      actionLabel: 'Try instead:',
    }
  }

  return {
    judgment: 'Lower risk - good pause',
    explain: shortenToWords(st.safeNote || st.learningPoint, 20),
    action: shortenToWords(st.safeAction || st.learningPoint, 22),
    actionLabel: 'Keep doing:',
  }
})

const isHighPressureOutcome = computed(() => riskCount.value >= 1)
const finalOutcomeImage = computed(() =>
  isHighPressureOutcome.value ? '/icons/Image6.png' : '/icons/Image7.png',
)
const finalOutcomeAlt = computed(() =>
  isHighPressureOutcome.value
    ? 'Alex points out fake balance and pressure tactics clearly'
    : 'Alex celebrates regaining control with confidence',
)
const finalOutcomeTitle = computed(() =>
  isHighPressureOutcome.value
    ? 'High-pressure path - coercion + fake balance surfaced.'
    : 'Low-pressure path - script stalled early.',
)
const finalOutcomeMessage = computed(() =>
  isHighPressureOutcome.value
    ? ''
    : 'You kept the scam from escalating - that is the outcome we are training for.',
)

const finaleCelebrationEyebrow = computed(() =>
  isHighPressureOutcome.value ? 'Tough run - you finished' : 'Well done',
)

const HIGH_PRESSURE_FOCUS_BULLETS = [
  'Fake dashboards and first unlock fees train you to self-fund wages, then demands stack fast.',
  'After cash moves, ID grabs keep the damage going - urgency is tuned to mute your checks.',
]

const harmFocusBullets = computed(() => {
  if (isHighPressureOutcome.value) return HIGH_PRESSURE_FOCUS_BULLETS.slice(0, 1)
  const low = scenario.value.lowRiskHarmBullets
  return Array.isArray(low) && low.length ? low.slice(0, 1) : []
})

function normalizeWords(text) {
  return String(text || '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function countWords(text) {
  const clean = normalizeWords(text)
  return clean ? clean.split(' ').length : 0
}

function toChecklistLine(text, fallback) {
  const clean = normalizeWords(text)
  if (!clean) return fallback
  if (countWords(clean) <= 10) return clean
  return fallback
}

const coachChecklistRows = computed(() => {
  const aiNext = toChecklistLine(
    props.coachNextAction,
    'Verify using official channels before any payment action.',
  )
  const topRisk = toChecklistLine(
    props.coachTopRisk,
    'Urgency plus fees often signals a scripted recruitment scam.',
  )

  return [
    {
      id: 'ai-step',
      tag: 'Next',
      label: aiNext,
    },
    {
      id: 'coach-note',
      tag: 'Note',
      label: topRisk,
    },
    {
      id: 'no-pay',
      tag: 'Rule',
      label: 'Never pay upfront onboarding or payout release fees.',
    },
    {
      id: 'report',
      tag: 'Action',
      label: 'Save screenshots and report directly to Scamwatch.',
    },
  ]
})

const insightMeaningLine = computed(() => {
  const rankInfo = activeInsightReport.value.rankInfo
  if (!rankInfo) return 'Report volumes shift over time, but this pattern is still active.'
  if (rankInfo.rank <= 2) {
    return `${activeInsightReport.value.typeLabel} is among the most reported scam types right now.`
  }
  return `${activeInsightReport.value.typeLabel} is still active and worth preparing for before you respond.`
})

const nextStepChecksModel = reactive({})

watch(
  () => stage.value,
  (s) => {
    if (s >= 1 && s <= 5) {
      stageEnteredAt.value = Date.now()
    }
  },
)

watch(
  coachChecklistRows,
  (rows) => {
    rows.forEach((row) => {
      if (!(row.id in nextStepChecksModel)) nextStepChecksModel[row.id] = false
    })
    Object.keys(nextStepChecksModel).forEach((key) => {
      if (!rows.some((row) => row.id === key)) Reflect.deleteProperty(nextStepChecksModel, key)
    })
  },
  { immediate: true },
)

const stageImage = computed(() => {
  if (stage.value === 1) return '/icons/Image2.png'
  if (stage.value === 2) return '/icons/Image3.png'
  if (stage.value === 3) return '/icons/Image4.png'
  if (stage.value === 4) return '/icons/Image5.png'
  return '/icons/image1.png'
})

function pick(type) {
  if (picked.value) return

  const dwellMs =
    stage.value >= 1 && stage.value <= 5 && stageEnteredAt.value > 0
      ? Math.max(0, Date.now() - stageEnteredAt.value)
      : 0

  interactionTiming.value.push({
    stage: stage.value,
    dwellMs,
    choice: type,
  })

  appendWalkthroughEvent({
    type: 'sim_pick',
    scenarioType: props.scenarioType,
    stage: stage.value,
    dwellMs,
    choice: type,
  })

  picked.value = type

  const stageSnapshot = {
    stage: stage.value,
    choice: type,
    riskTag: currentStage.value.riskTag || 'Unknown risk signal',
    riskReason: currentStage.value.riskReason || 'No reason available.',
    safeAction: currentStage.value.safeAction || 'Pause and verify independently.',
    learningPoint: currentStage.value.learningPoint || 'Slow down before sharing data or paying.',
    summarySeed: currentStage.value.summarySeed || '',
    timestamp: Date.now(),
  }
  feedbackHistory.value.push(stageSnapshot)

  if (type === 'risk') {
    riskCount.value += 1
  }
  playTone(type)
}

function playTone(kind) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = kind === 'safe' ? 'sine' : 'triangle'
    osc.frequency.value = kind === 'safe' ? 620 : 240
    gain.gain.value = kind === 'safe' ? 0.09 : 0.12
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + (kind === 'safe' ? 0.1 : 0.14))
    osc.onended = () => {
      ctx.close().catch(() => {})
    }
  } catch {
    // silently ignore when audio is unavailable
  }
}

function openFullscreenPrompt() {
  if (showFullscreenPrompt.value) return
  showFullscreenPrompt.value = true
}

async function requestSimFullscreen() {
  const target = simRef.value
  if (!(target instanceof HTMLElement)) return
  if (!document.fullscreenEnabled) return

  isTransitioning.value = true
  try {
    await target.requestFullscreen()
  } catch {
    // ignore blocked fullscreen requests and continue in windowed mode
  } finally {
    window.setTimeout(() => {
      isTransitioning.value = false
    }, 220)
  }
}

async function confirmFullscreenChoice(shouldEnterFullscreen) {
  showFullscreenPrompt.value = false
  if (shouldEnterFullscreen) {
    await requestSimFullscreen()
  }
  nextStage()
}

function exitFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
}

function handleFullscreenChange() {
  const wasFullscreen = isFullscreen.value
  isFullscreen.value = !!document.fullscreenElement
  if (!wasFullscreen && isFullscreen.value) {
    savedScrollY = window.scrollY
  }
  if (wasFullscreen && !isFullscreen.value) {
    requestAnimationFrame(() => {
      const learnEl = document.getElementById('learn-section')
      const scrollTarget = learnEl
        ? learnEl.getBoundingClientRect().top + window.scrollY
        : savedScrollY
      window.scrollTo({ top: scrollTarget, behavior: 'instant' })
      window.dispatchEvent(new Event('resize'))
    })
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onBeforeUnmount(() => {
  stopInsightMapPlayback()
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
})

function nextStage() {
  picked.value = ''
  stage.value += 1

  if (stage.value === 6) {
    exitFullscreen()
    showPersonalSummary.value = true
    emit('completed', {
      scenarioType: props.scenarioType,
      highPressure: isHighPressureOutcome.value,
      riskCount: riskCount.value,
      feedbackHistory: feedbackHistory.value,
      localSummaryPoints: localSummaryPoints.value,
      localSummaryText: localSummaryText.value,
      interactionTiming: interactionTiming.value.slice(),
      scenarioMeta: {
        scenarioLabel: scenario.value.scenarioLabel,
        typeTone: scenario.value.typeTone,
        summarySeed: scenario.value.summarySeed,
        topRiskSeed: scenario.value.topRiskSeed,
        nextActionSeed: scenario.value.nextActionSeed,
        closingSeed: scenario.value.closingSeed,
      },
    })

    persistWalkthroughSession({
      scenarioType: props.scenarioType,
      highPressure: isHighPressureOutcome.value,
      riskCount: riskCount.value,
      stages: interactionTiming.value.slice(),
      completedAt: Date.now(),
    })
  }
}

function buildLocalSummaryPoints() {
  const risks = feedbackHistory.value
    .filter((h) => h.choice === 'risk')
    .sort((a, b) => a.stage - b.stage)
  if (!risks.length) {
    return ['No risky taps - keep verifying payouts and recruiters before sharing IDs or money.']
  }

  return risks.map((item) => `Stage ${item.stage}: ${item.riskTag}`)
}

function optionStateClass(type) {
  if (!picked.value) return 'choice--neutral'
  if (picked.value === type && type === 'safe') return 'choice--selected-correct'
  if (picked.value === type && type === 'risk') return 'choice--selected-wrong'
  return 'choice--not-selected'
}

watch(
  () => props.scenarioType,
  () => {
    stage.value = 0
    picked.value = ''
    riskCount.value = 0
    feedbackHistory.value = []
    stageEnteredAt.value = 0
    showPersonalSummary.value = false
    showFullscreenPrompt.value = false
    interactionTiming.value = []
    selectedInsightView.value = 'trend'
    selectedInsightYear.value = activeInsightYears.value[0] ?? insightFallbackYear
    stopInsightMapPlayback()
    Object.keys(nextStepChecksModel).forEach((key) => {
      nextStepChecksModel[key] = false
    })
  },
)
</script>

<style scoped>
.sim {
  width: 100%;
  max-width: min(1280px, 100%);
  margin: 0 auto;
  background: linear-gradient(180deg, #eef4f6 0%, #f7f8f6 100%);
  --bg-page: #eef4f6;
  --bg-panel: #ffffff;
  --bg-soft-blue: #eef4f6;
  --bg-warning: #fdedea;
  --navy: #1b2e5e;
  --coral: #d0312d;
  --teal: #7a9a82;
  --accent-bluegray: #3b6f8f;
  --cream-border: #e3d7c8;
  --text-main: #191827;
  --text-muted: #5f6473;
}

.sim-meta {
  margin: 0;
  color: var(--text-main);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.sim-meta__sep {
  font-weight: 600;
  color: var(--text-muted);
}

.scene-head {
  display: grid;
  gap: 8px;
  margin-bottom: 4px;
}

.progress-line {
  height: 4px;
  border-radius: 999px;
  background: var(--cream-border);
  overflow: hidden;
}

.progress-line__fill {
  height: 100%;
  background: var(--navy);
  border-radius: inherit;
  transition: width 0.28s ease;
}

.sim-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0;
  border: 1px solid var(--cream-border);
  border-radius: 14px;
  overflow: hidden;
  min-height: clamp(500px, 68vh, 700px);
  background: var(--bg-panel);
  box-shadow: 0 1px 4px rgba(27, 46, 94, 0.05);
  align-items: stretch;
}

.sim-card--walkthrough {
  grid-template-columns: minmax(0, 48fr) minmax(0, 52fr);
}

.sim-card--finale {
  grid-template-columns: minmax(0, 1fr);
  min-height: auto;
}

.sim--fullscreen .sim-card--walkthrough {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  min-width: 0;
  overflow: hidden;
}

.sim--fullscreen .sim-card--walkthrough > * {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.sim--fullscreen .sim-visual--walkthrough,
.sim--fullscreen .sim-copy--scene {
  box-sizing: border-box;
  max-width: 100%;
  min-width: 0;
  overflow-x: clip;
  overflow-y: auto;
}

.sim--fullscreen .sim-copy--scene {
  padding: 14px 16px;
}

.sim--fullscreen .sim-copy--scene .choices,
.sim--fullscreen .sim-copy--scene .choice,
.sim--fullscreen .sim-copy--scene .risk-signal,
.sim--fullscreen .sim-copy--scene .thinking-strip,
.sim--fullscreen .sim-copy--scene .wt-stage-context,
.sim--fullscreen .sim-copy--scene .stage-context-panel,
.sim--fullscreen .sim-copy--scene .coach-note,
.sim--fullscreen .wt-conversation-card,
.sim--fullscreen .scene-card--walkthrough {
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.sim--fullscreen .sim-copy--scene .bubble,
.sim--fullscreen .sim-copy--scene .choice-title {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.sim--fullscreen .sim-wrapper {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}
.sim-card--split-thirds {
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
}
.sim-visual {
  background: transparent;
  border-right: 1px solid var(--cream-border);
  padding: 0;
  display: flex;
  flex-direction: column;
  align-self: stretch;
}

.intro-visual {
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  padding: 0;
}

.scene-card {
  background: var(--bg-page);
  border: 0;
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.scene-card--walkthrough {
  background: var(--bg-panel);
}

.wt-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
}

.wt-block--scene {
  background: var(--bg-page);
  border-bottom: 1px solid var(--cream-border);
}

.wt-label {
  margin: 0;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.scene-image-wrap--walkthrough {
  min-height: clamp(288px, 46vh, 540px);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--cream-border);
  background: var(--bg-page);
}

.wt-block--conversation {
  background: var(--bg-panel);
  flex: 1 1 auto;
  min-height: 0;
}

.wt-conversation-card {
  border-radius: 12px;
  border: 1px solid var(--cream-border);
  background: var(--bg-panel);
  padding: 8px 9px;
}

.scene-image-fade--walkthrough {
  background: linear-gradient(to bottom, rgba(238, 244, 246, 0) 0%, var(--bg-page) 100%);
}

.scene-image-wrap {
  position: relative;
  background: var(--bg-page);
  flex: 1 1 auto;
  min-height: clamp(300px, 52vh, 580px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Intro image fills full left column */
.intro-visual .scene-image-wrap {
  flex: 1 1 auto;
  min-height: clamp(380px, 64vh, 760px);
  background: var(--bg-page);
}

.intro-visual .scene-image-wrap .sim-image {
  flex: 1 1 auto;
  max-height: min(720px, 78vh);
  max-width: 100%;
  object-fit: contain;
  transform-origin: center center;
}

@media (min-width: 900px) {
  .intro-visual .scene-image-wrap .sim-image {
    transform: scale(1.08);
  }
}

@media (max-width: 899px) {
  .intro-visual .scene-image-wrap .sim-image {
    transform: scale(1.04);
  }
}

.scene-image-fade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 72px;
  background: linear-gradient(to bottom, rgba(238, 244, 246, 0) 0%, var(--bg-page) 100%);
  pointer-events: none;
}

.scene-dialogue-wrap {
  background: var(--bg-panel);
  border-top: 1px solid var(--cream-border);
  flex: 0 1 auto;
  min-height: 112px;
  max-height: min(280px, 38vh);
  overflow-y: auto;
  padding: 10px 14px 12px;
}

.speaker-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  align-items: center;
}

.speaker-row::before {
  content: 'Conversation';
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 800;
  color: #6b7280;
  margin-right: 4px;
}

.speaker-chip {
  font-size: 0.74rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 4px 10px;
}

.speaker-chip--scammer {
  background: #1f2937;
  color: #fff;
}

.speaker-chip--alex {
  background: #eef4ff;
  color: #1b2e5e;
}

.sim-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.lead {
  margin: 0 0 8px;
  color: var(--text-muted);
}

.voice-note-stack {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}

.chat-thread {
  display: grid;
  gap: 7px;
  background: var(--bg-soft-blue);
  border: 1px solid var(--cream-border);
  border-radius: 14px;
  padding: 10px;
}

.chat-thread--intro {
  gap: 8px;
}

.bubble {
  margin: 0;
  border-radius: 12px;
  padding: 9px 11px;
  font-size: 0.82rem;
  line-height: 1.42;
  position: relative;
}

.bubble--scammer {
  background: #f7efe5;
  color: var(--navy);
  border: 1px solid var(--cream-border);
  max-width: 95%;
}

.bubble--alex {
  background: var(--bg-soft-blue);
  color: var(--navy);
  border: 1px solid var(--cream-border);
  justify-self: end;
  max-width: 96%;
}

.phone-thread {
  display: grid;
  gap: 9px;
  background: #ffffff;
  border: 1px solid #e5e2dc;
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 1px 4px rgba(26, 26, 42, 0.06);
}

.phone-thread.phone-thread--walkthrough {
  gap: 5px;
  background: transparent;
  border: none;
  padding: 0;
  box-shadow: none;
}

.phone-bubble {
  font-size: 0.79rem;
  line-height: 1.38;
}

.bubble-avatar {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  background: #93c5fd;
  color: #0f172a;
  font-size: 0.68rem;
  font-weight: 800;
}

.sim-copy {
  background: var(--bg-panel);
  padding: 16px 18px 14px;
  display: grid;
  align-content: start;
  gap: 12px;
  overflow-y: auto;
}

.sim-copy--scene {
  gap: 10px;
}

.scene-stage-title {
  margin: 2px 0 0;
  color: var(--navy);
  font-size: 1.08rem;
  line-height: 1.32;
}

.scene-stage-lead {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.84rem;
  line-height: 1.58;
}

.sim-copy--intro {
  gap: 12px;
}

.intro-meet-head {
  display: grid;
  gap: 0;
}

.intro-meet-head__art {
  display: none;
  margin: 0;
}

.intro-meet-head__title {
  margin: 0 0 8px;
  color: var(--navy);
  font-size: 1.22rem;
  line-height: 1.35;
}

.intro-lead__short {
  display: none;
}

.thinking-card__line--mobile {
  display: none;
}

.wt-stage-mobile-stack,
.wt-scene-mobile-figure,
.wt-mobile-convo {
  display: none;
}

.scene-head--mobile,
.scene-stage-title--mobile {
  display: none;
}

.sim-copy--final {
  background:
    radial-gradient(circle at 12% 4%, rgba(59, 111, 143, 0.08), rgba(238, 244, 246, 0) 42%),
    linear-gradient(180deg, #eef4f6 0%, #f7f8f6 100%);
  display: flex;
  flex-direction: column;
  padding: 16px 18px 18px;
  gap: 16px;
  overflow-x: hidden;
  overflow-y: auto;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.finale-celebration {
  align-items: center;
  background: linear-gradient(135deg, rgba(59, 111, 143, 0.08) 0%, rgba(247, 248, 246, 0.95) 70%);
  border-top: 2px solid rgba(27, 46, 94, 0.35);
  border-bottom: 1px solid var(--cream-border);
  border-radius: 0;
  display: flex;
  gap: 14px;
  margin: 0;
  padding: 14px 0 12px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.finale-celebration__art {
  flex: 0 0 auto;
  margin: 0;
}

.finale-celebration__img {
  display: block;
  height: auto;
  max-height: 112px;
  max-width: 112px;
  object-fit: contain;
  width: auto;
}

.finale-celebration__copy {
  display: grid;
  flex: 1 1 auto;
  gap: 4px;
  min-width: 0;
}

.finale-celebration__eyebrow {
  color: #3b6f8f;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  margin: 0;
  text-transform: uppercase;
}

.finale-celebration__message {
  color: var(--text-main);
  font-size: 0.86rem;
  line-height: 1.45;
  margin: 0;
}

.finale-outcome-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.finale-outcome-tag {
  border: 1px solid transparent;
  border-radius: 999px;
  display: inline-flex;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1.2;
  padding: 4px 8px;
  text-transform: uppercase;
}

.finale-outcome-tag--warn {
  background: rgba(208, 49, 45, 0.1);
  border-color: rgba(208, 49, 45, 0.32);
  color: #a91f1f;
}

.finale-outcome-tag--calm {
  background: rgba(122, 154, 130, 0.12);
  border-color: rgba(122, 154, 130, 0.34);
  color: #4c6e55;
}

.finale-outcome-tag--neutral {
  background: rgba(27, 46, 94, 0.08);
  border-color: rgba(27, 46, 94, 0.22);
  color: #1b2e5e;
}

.finale-recap-panel,
.finale-coach-panel {
  border: 0;
  border-top: 2px solid rgba(27, 46, 94, 0.24);
  border-radius: 0;
  background: transparent;
}

.finale-recap-panel__summary,
.finale-coach-panel__summary {
  align-items: center;
  cursor: pointer;
  display: flex;
  flex-wrap: wrap;
  font-size: 0.8rem;
  font-weight: 800;
  gap: 8px;
  justify-content: flex-start;
  list-style: none;
  padding: 10px 12px;
  color: var(--navy);
}

.finale-recap-panel__summary::-webkit-details-marker,
.finale-coach-panel__summary::-webkit-details-marker,
.stage-context-panel__summary::-webkit-details-marker,
.coach-note__more > .disclosure-summary::-webkit-details-marker,
.finale-recap-compact__more > .disclosure-summary::-webkit-details-marker {
  display: none;
}

.disclosure-summary {
  align-items: center;
  display: flex;
  gap: 10px;
  justify-content: flex-start;
  list-style: none;
}

.disclosure-summary__text {
  align-items: center;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.disclosure-summary--inline {
  display: inline-flex;
  font-size: inherit;
  gap: 6px;
}

.disclosure-chevron {
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  flex-shrink: 0;
  height: 7px;
  transform: rotate(45deg);
  transition: transform 0.2s ease;
  width: 7px;
}

details[open] > .disclosure-summary .disclosure-chevron {
  transform: rotate(-135deg);
}

.wt-stage-context {
  display: grid;
  gap: 10px;
}

.wt-stage-context--mobile {
  display: none;
}

.wt-stage-lead--stack {
  display: none;
}

.finale-recap-panel__count {
  background: rgba(27, 46, 94, 0.08);
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 2px 8px;
}

.finale-recap-compact {
  list-style: none;
  margin: 0;
  padding: 0 12px 10px;
  display: grid;
  gap: 8px;
}

.finale-recap-compact__decision {
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.35;
  margin: 0 0 4px;
  color: var(--navy);
}

.finale-recap-compact__more {
  font-size: 0.74rem;
}

.finale-recap-compact__more summary {
  color: #3b6f8f;
  cursor: pointer;
  font-weight: 700;
}

.finale-coach-panel .summary-body {
  padding: 0 0 2px;
}

.ai-coach-checklist {
  display: grid;
  gap: 8px;
}

.ai-coach-checklist__label {
  color: #1b2e5e;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.ai-coach-checklist__items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ai-coach-checklist__item {
  align-items: center;
  background: #fff;
  border: 1px solid rgba(27, 46, 94, 0.18);
  border-radius: 999px;
  color: var(--navy);
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  flex: 1 1 260px;
  font-size: 0.76rem;
  font-weight: 600;
  gap: 7px;
  line-height: 1.34;
  max-width: 100%;
  min-height: 38px;
  min-width: 0;
  overflow-wrap: normal;
  padding: 6px 12px;
  white-space: normal;
  word-break: normal;
  text-align: left;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.ai-coach-checklist__item:hover,
.ai-coach-checklist__item:focus-visible {
  box-shadow: 0 4px 12px rgba(27, 46, 94, 0.1);
  transform: translateY(-1px);
}

.ai-coach-checklist__box {
  border: 1px solid rgba(27, 46, 94, 0.45);
  border-radius: 3px;
  height: 12px;
  width: 12px;
}

.ai-coach-checklist__item--on {
  background: rgba(59, 111, 143, 0.12);
  border-color: rgba(59, 111, 143, 0.45);
}

.ai-coach-checklist__item--on .ai-coach-checklist__box {
  background: #1b2e5e;
  border-color: #1b2e5e;
}

.ai-coach-checklist__tag {
  background: rgba(27, 46, 94, 0.09);
  border-radius: 999px;
  color: #1b2e5e;
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  line-height: 1.1;
  padding: 3px 6px;
  text-transform: uppercase;
  white-space: nowrap;
}

.ai-coach-checklist__item > span:last-child {
  min-width: 0;
  overflow-wrap: normal;
  word-break: normal;
}

.stage-context-panel {
  border: 1px solid rgba(220, 38, 38, 0.16);
  border-radius: 10px;
  background: rgba(255, 251, 246, 0.9);
}

.stage-context-panel__summary {
  align-items: center;
  cursor: pointer;
  display: flex;
  font-size: 0.78rem;
  font-weight: 700;
  gap: 8px;
  list-style: none;
  padding: 8px 10px;
  color: var(--navy);
}

.stage-context-panel__glyph {
  color: var(--coral);
}

.stage-context-panel__body {
  padding: 0 10px 10px;
  display: grid;
  gap: 8px;
}

.stage-context-panel__think {
  font-size: 0.78rem;
  line-height: 1.45;
  margin: 0;
  color: var(--text-muted);
}

.stage-context-panel__think-label {
  display: block;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: 2px;
}

.thinking-card--compact {
  border: 1px solid var(--cream-border);
  border-radius: 10px;
  background: rgba(238, 244, 255, 0.5);
  padding: 0;
}

.thinking-card--compact .thinking-card__label {
  cursor: pointer;
  list-style: none;
  margin: 0;
  padding: 8px 10px;
}

.thinking-card--compact .thinking-card__line {
  margin: 0;
  padding: 0 10px 8px;
}

.finale-header {
  align-items: flex-start;
  border-bottom: 1px solid #e3d7c8;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  margin: 0 0 4px;
  padding-bottom: 12px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.finale-header__copy {
  display: grid;
  flex: 1 1 auto;
  gap: 8px;
  min-width: 0;
}

.finale-header__message {
  color: #2b2b2b;
  font-size: 0.9rem;
  line-height: 1.45;
  margin: 0;
}

.finale-header__art {
  flex: 0 0 auto;
  margin: 0;
  max-width: 200px;
}

.finale-header__img {
  display: block;
  height: auto;
  max-height: 180px;
  max-width: 200px;
  object-fit: contain;
  width: 100%;
}

.sim-copy--final .actions {
  margin-top: auto;
  padding-top: 10px;
}

.final-outcome-heading {
  margin: 4px 0 2px;
  color: var(--navy);
  font-size: 1.05rem;
  line-height: 1.3;
}

.outcome-section__kicker {
  margin: 0 0 8px;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #4b5563;
}

.outcome-section--next {
  margin-top: 14px;
}

.coach-unified-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.coach-panel {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(27, 46, 94, 0.1);
  border-radius: 8px;
  padding: 10px 11px;
}

.coach-panel--recap {
  background: rgba(248, 250, 252, 0.95);
}

.coach-panel--stakes {
  background: rgba(255, 251, 246, 0.9);
  border-color: rgba(220, 38, 38, 0.14);
}

.coach-panel--stakes-high {
  border-left: 3px solid var(--coral);
}

.coach-panel--synthesis {
  background: rgba(255, 255, 255, 0.95);
  border-left: 3px solid rgba(27, 46, 94, 0.46);
  border-color: rgba(99, 102, 241, 0.18);
}

.coach-panel__heading {
  margin: 0 0 6px;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #4b5563;
}

.coach-panel__heading--secondary {
  color: var(--accent-bluegray);
}

.ai-coach-compact__riskline {
  color: #374151;
  font-size: 0.79rem;
  line-height: 1.45;
  margin: 0;
}

.ai-coach-compact__riskline span {
  color: #8a1e1b;
  font-weight: 800;
}

.coach-risk-path-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.coach-risk-path-list__item {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.48;
  color: var(--text-main);
}

.coach-risk-path-stage {
  font-weight: 800;
  color: var(--navy);
}

.coach-risk-path-sep {
  color: var(--text-muted);
  font-weight: 600;
}

.coach-risk-path-clean {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.48;
  color: var(--text-muted);
}

.coach-stakes-meta {
  margin: 0 0 6px;
  font-size: 0.67rem;
  color: #6b7280;
}

.coach-stakes-bullets {
  margin: 0;
  padding-left: 1.05rem;
  font-size: 0.76rem;
  line-height: 1.45;
  color: #374151;
  display: grid;
  gap: 6px;
}

.coach-panel-rule {
  border: none;
  height: 1px;
  margin: 2px 0;
  background: rgba(27, 46, 94, 0.12);
}

.coach-livefail {
  margin: 0 0 10px;
  border-radius: 8px;
  border: 1px dashed rgba(194, 65, 12, 0.45);
  padding: 6px 9px;
  background: rgba(255, 247, 237, 0.72);
}

.coach-livefail__summary {
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 750;
  color: #b45309;
}

.coach-livefail__detail {
  margin: 8px 0 0;
  font-size: 0.68rem;
  line-height: 1.42;
  color: #92400e;
  overflow-wrap: anywhere;
}

.ai-badge--offline-model {
  background: rgba(241, 245, 249, 0.98);
  color: #334155;
  border: 1px solid rgba(100, 116, 139, 0.32);
}

.ai-coach-compact {
  display: grid;
  gap: 10px;
}

.ai-coach-compact__para {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.56;
  color: #252525;
}

.ai-coach-compact__dl {
  margin: 0;
  display: grid;
  gap: 8px;
}

.ai-coach-compact__dl dt {
  margin: 0;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #475569;
}

.ai-coach-compact__dl dd {
  margin: 2px 0 0;
  font-size: 0.79rem;
  line-height: 1.46;
  color: #374151;
}

.ai-coach-compact__timing {
  margin: 0;
  font-size: 0.74rem;
  line-height: 1.42;
  color: #455468;
}

.ai-coach-compact__timing-lbl {
  font-weight: 800;
  color: #1b2e5e;
  margin-right: 6px;
  font-size: 0.6rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.ai-coach-compact__fineprint {
  margin: 0;
  font-size: 0.67rem;
  line-height: 1.42;
  color: #757575;
}

.next-checklist {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.next-checklist__label {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  cursor: pointer;
  font-size: 0.8rem;
  line-height: 1.42;
  color: #374151;
}

.next-checklist__input {
  margin-top: 3px;
  flex-shrink: 0;
}

.coach-divider {
  height: 1px;
  margin: 12px 0 8px;
  background: rgba(27, 46, 94, 0.12);
}

.summary-panel--ai {
  margin-top: 6px;
}

.summary-panel--ai.summary-panel--unified {
  margin-top: 10px;
}

.sim-copy p {
  margin: 0;
  color: #374151;
  line-height: 1.65;
}
.sim-copy--danger {
  animation: tiny-shake 0.2s linear;
}

.sim-copy--scene {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  align-content: flex-start;
  justify-content: flex-start;
  gap: clamp(5px, 1vh, 9px);
  padding-top: 0;
  padding-right: clamp(10px, 2vh, 15px);
  padding-bottom: clamp(10px, 2vh, 15px);
  padding-left: clamp(10px, 2vh, 15px);
  min-height: 0;
}

@media (min-width: 861px) {
  .sim-visual.sim-visual--walkthrough {
    padding-top: 50px;
  }

  .sim-copy.sim-copy--scene {
    padding-top: 50px;
  }
}

.finale-pane--image-only {
  display: none;
}

.finale-mobile-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin: 0 0 4px;
}

.finale-mobile-head__thumb {
  flex: 0 0 auto;
  margin: 0;
  width: 96px;
}

.finale-mobile-head__img {
  display: block;
  width: 96px;
  max-height: 110px;
  object-fit: contain;
}

.finale-mobile-head__body {
  flex: 1 1 auto;
  min-width: 0;
}

.sim-card--walkthrough .scene-head--desktop,
.sim-card--walkthrough .scene-stage-title--desktop {
  display: block;
}

.sim-card--walkthrough .scene-head--mobile,
.sim-card--walkthrough .scene-stage-title--mobile {
  display: none;
}

.sim-copy--final .outcome-section,
.sim-copy--final .detected,
.sim-copy--final .actions {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.sim-copy--scene .thinking-strip__line--desktop {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  line-clamp: 4;
  -webkit-line-clamp: 4;
  overflow: hidden;
}

.sim-copy--scene .risk-signal__reason--desktop {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  line-clamp: 4;
  -webkit-line-clamp: 4;
  overflow: hidden;
}

.sim-copy--scene .choices {
  margin-top: 0;
}

.sim-copy--scene .choice {
  width: 100%;
}

.risk-signal {
  display: grid;
  gap: 8px;
}

.risk-signal--editorial {
  border: 1px solid var(--cream-border);
  border-left: 4px solid var(--coral);
  background: #fffdfc;
  border-radius: 12px;
  padding: 12px 14px;
}

.risk-signal__tag {
  margin: 0;
  color: var(--navy);
  font-size: 0.84rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.risk-signal__glyph {
  flex-shrink: 0;
  font-size: 0.95rem;
  color: var(--coral);
  line-height: 1;
}

.risk-signal__reason {
  margin: 0;
  color: #4b5563;
  font-size: 0.84rem;
  line-height: 1.52;
}

.risk-signal__kicker,
.risk-signal__tag--mobile,
.risk-signal__reason--mobile,
.scene-stage-lead--mobile,
.bubble--wt-mobile,
.thinking-strip__line--mobile {
  display: none;
}

.sim-card--walkthrough .sim-copy--scene,
.sim-card--walkthrough .sim-visual--walkthrough,
.sim-card--walkthrough .risk-signal,
.sim-card--walkthrough .thinking-strip,
.sim-card--walkthrough .choice,
.sim-card--walkthrough .coach-note {
  min-width: 0;
  overflow-wrap: break-word;
  word-break: break-word;
}

.thinking-strip {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--cream-border);
  background: var(--bg-soft-blue);
  display: grid;
  gap: 6px;
}

.thinking-strip__label {
  margin: 0;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.thinking-strip__line {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.52;
  color: var(--navy);
}

.choices-prompt {
  margin: 2px 0 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--navy);
}

.thinking-card {
  border: 1px solid var(--cream-border);
  background: var(--bg-soft-blue);
  border-radius: 14px;
  padding: 14px;
  display: grid;
  gap: 8px;
}

.thinking-card__label {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--navy);
  letter-spacing: 0.01em;
}

.thinking-card__line {
  margin: 0;
  color: var(--navy);
  font-size: 0.92rem;
  line-height: 1.6;
}

.sim-copy--scene .coach-note {
  padding: 12px;
}

.choices,
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.sim-fs-modal {
  inset: 0;
  position: fixed;
  z-index: 980;
}

.sim-fs-modal__backdrop {
  background: rgba(15, 23, 42, 0.46);
  border: 0;
  cursor: default;
  inset: 0;
  margin: 0;
  padding: 0;
  position: absolute;
  width: 100%;
}

.sim-fs-modal__panel {
  background: #ffffff;
  border: 1px solid var(--cream-border);
  border-radius: 12px;
  box-shadow: 0 14px 30px rgba(27, 46, 94, 0.2);
  left: 50%;
  max-width: min(92vw, 430px);
  padding: 16px 16px 14px;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
}

.sim-fs-modal__title {
  color: var(--navy);
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.35;
  margin: 0;
}

.sim-fs-modal__copy {
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 8px 0 0;
}

.sim-fs-modal__tip {
  align-items: center;
  color: var(--text-muted);
  display: flex;
  gap: 8px;
  margin: 8px 0 0;
}

.sim-fs-modal__tip svg {
  fill: var(--accent-bluegray);
  flex: 0 0 auto;
  height: 16px;
  width: 16px;
}

.sim-fs-modal__tip span {
  font-size: 0.84rem;
  line-height: 1.45;
}

.sim-fs-modal__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.sim-fs-modal__btn {
  background: #ffffff;
  border: 1px solid rgba(27, 46, 94, 0.22);
  border-radius: 10px;
  color: #1b2e5e;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.74rem;
  font-weight: 700;
  line-height: 1.35;
  padding: 10px 12px;
  text-align: center;
  transition:
    background-color 0.16s ease,
    color 0.16s ease,
    border-color 0.16s ease;
}

.sim-fs-modal__btn--primary {
  background: #1b2e5e;
  border: 0;
  color: #ffffff;
}

.sim-fs-modal__btn--secondary {
  background: #ffffff;
  border: 1px solid rgba(27, 46, 94, 0.22);
  color: #1b2e5e;
}

.sim-fs-modal__btn--primary:hover,
.sim-fs-modal__btn--primary:focus-visible {
  background: #13244a;
}

.sim-fs-modal__btn--secondary:hover,
.sim-fs-modal__btn--secondary:focus-visible {
  background: #f4ede0;
}

.actions--finale {
  border-top: 1px solid rgba(27, 46, 94, 0.14);
  justify-content: flex-start;
  margin-top: 6px;
  padding-top: 12px;
}

.choices--scene {
  flex-direction: column;
  flex-wrap: nowrap;
  width: 100%;
  gap: 10px;
  margin-top: 0;
}

.choice {
  width: 100%;
  background: var(--bg-panel);
  border: 1px solid var(--cream-border);
  border-left: 4px solid var(--navy);
  border-radius: 14px;
  color: var(--navy);
  cursor: pointer;
  display: grid;
  font-size: 0.95rem;
  font-weight: 700;
  gap: 5px;
  line-height: 1.45;
  padding: 14px 16px;
  position: relative;
  text-align: left;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.choice:hover,
.choice:focus-visible {
  background: var(--bg-soft-blue);
  border-color: var(--cream-border);
  border-left-color: var(--coral);
  box-shadow: 0 1px 4px rgba(27, 46, 94, 0.08);
}

.choice-title {
  font-size: 0.95rem;
  line-height: 1.45;
}

.choice:disabled {
  cursor: default;
  opacity: 1;
}

.choice--neutral:hover:not(:disabled),
.choice--neutral:focus-visible:not(:disabled) {
  transform: none;
}

.choice--selected-correct {
  border-color: var(--cream-border);
  border-left-color: var(--teal);
  background: rgba(122, 154, 130, 0.12);
}

.choice--selected-wrong {
  border-color: var(--cream-border);
  border-left-color: var(--coral);
  background: var(--bg-warning);
}

.choice--not-selected {
  opacity: 0.72;
}

.coach-note {
  display: grid;
  gap: 8px;
  margin-top: 10px;
  border: 1px solid var(--cream-border);
  border-radius: 12px;
  padding: 12px 14px;
}

.coach-note--safe {
  background: rgba(122, 154, 130, 0.12);
  border-left: 3px solid var(--teal);
}

.coach-note--risk {
  background: rgba(208, 49, 45, 0.07);
  border-left: 3px solid var(--coral);
}

.coach-note__judgment {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 800;
  line-height: 1.35;
  color: var(--navy);
}

.coach-note--risk .coach-note__judgment {
  color: #9f1239;
}

.coach-note__explain {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.5;
  color: #374151;
}

.coach-note__action {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.48;
  color: #1f2937;
}

.coach-note__action-label {
  display: block;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: 2px;
}

.outcome-section--coach {
  display: grid;
  gap: 16px;
}

.ai-coach-compact__next {
  color: #1f2937;
  font-size: 0.82rem;
  line-height: 1.45;
  margin: 0;
}

.ai-coach-compact__next span {
  color: #1b2e5e;
  font-weight: 800;
}

.finale-insights-report {
  background: transparent;
  border-top: 2px solid rgba(27, 46, 94, 0.2);
  border-radius: 0;
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 10px 0 0;
}

.finale-insights-report__head {
  display: grid;
  gap: 4px;
}

.finale-insights-report__kicker {
  color: #6b7280;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.finale-insights-report__title {
  color: #1b2e5e;
  font-size: 0.98rem;
  line-height: 1.3;
  margin: 0;
}

.finale-insights-report__summary {
  color: var(--text-muted);
  font-size: 0.8rem;
  line-height: 1.45;
  margin: 0;
}

.finale-insights-type-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.finale-insights-type-tab {
  background: #fff;
  border: 1px solid rgba(27, 46, 94, 0.2);
  border-radius: 999px;
  color: #1b2e5e;
  cursor: pointer;
  font: inherit;
  font-size: 0.74rem;
  font-weight: 700;
  min-height: 30px;
  padding: 4px 10px;
}

.finale-insights-type-tab--active {
  background: #1b2e5e;
  border-color: #1b2e5e;
  color: #fff;
}

.finale-insights-type-card {
  border-top: 1px solid rgba(27, 46, 94, 0.12);
  display: grid;
  gap: 10px;
  min-width: 0;
  padding-top: 10px;
}

.finale-insights-block {
  background: #ffffff;
  border: 1px solid #e3d7c8;
  border-radius: 10px;
  box-shadow: none;
  display: grid;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
  padding: 10px;
}

.finale-insights-block__title {
  color: #1b2e5e;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  margin: 0;
  text-transform: uppercase;
}

.finale-insights-block :deep(.dual-trend-card),
.finale-insights-block :deep(.leaflet-d3-map-layout) {
  gap: 10px;
  max-width: 100%;
  min-width: 0;
}

.finale-insights-block :deep(.leaflet-d3-map-panel),
.finale-insights-block :deep(.state-ranking-card) {
  max-width: 100%;
  min-width: 0;
}

.finale-age-chart--desktop {
  display: block;
  width: 100%;
}

.finale-age-chart--desktop :deep(.picto-card) {
  gap: 10px;
  width: 100%;
}

.finale-age-chart--desktop :deep(.picto-card h3),
.finale-age-chart--desktop :deep(.picto-note) {
  display: none;
}

.finale-age-chart--desktop :deep(.picto-row) {
  align-items: center;
  background: #ffffff;
  border: 1px solid #e3d7c8;
  border-radius: 10px;
  box-shadow: none;
  column-gap: 30px;
  grid-template-columns: auto auto auto;
  justify-content: center;
  justify-items: center;
  min-height: 160px;
  padding: 16px 18px;
}

.finale-age-chart--desktop :deep(.picto-row__meta strong) {
  color: #1b2e5e;
  font-size: 0.95rem;
}

.finale-age-chart--desktop :deep(.picto-row__meta span) {
  font-size: 0.94rem;
}

.finale-age-chart--desktop :deep(.picto-row__meta small) {
  font-size: 0.8rem;
  max-width: 150px;
}

.finale-age-chart--desktop :deep(.picto-row__visual) {
  align-items: center;
  display: flex;
  justify-content: flex-start;
}

.finale-age-chart--desktop :deep(.picto-icons) {
  gap: 12px;
  justify-content: flex-start;
}

.finale-age-chart--desktop :deep(.picto-icon) {
  height: 104px;
  width: 52px;
}

.finale-age-chart--desktop :deep(.picto-icon__fg) {
  width: 52px;
}

.finale-age-chart--desktop :deep(.picto-percent) {
  min-width: 66px;
}

.finale-age-chart--desktop :deep(.picto-percent strong) {
  font-size: 0.98rem;
}

.finale-age-spotlight {
  background: #fff;
  border: 1px solid #e3d7c8;
  border-radius: 10px;
  display: grid;
  gap: 8px;
  padding: 10px;
}

.finale-age-spotlight--mobile {
  display: none;
}

.finale-age-spotlight__label {
  color: #6b7280;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  margin: 0;
  text-transform: uppercase;
}

.finale-age-spotlight__row {
  align-items: center;
  display: grid;
  gap: 8px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  min-width: 0;
}

.finale-age-spotlight__group {
  color: #1b2e5e;
  font-size: 0.86rem;
  font-weight: 800;
  margin: 0;
  white-space: nowrap;
}

.finale-age-spotlight__dots {
  display: grid;
  gap: 5px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  min-width: 0;
}

.finale-age-spotlight__dot {
  background: rgba(27, 46, 94, 0.14);
  border-radius: 999px;
  height: 8px;
}

.finale-age-spotlight__dot--on {
  background: var(--accent-bluegray);
}

.finale-age-spotlight__stat {
  color: #1b2e5e;
  font-size: 0.8rem;
  font-weight: 800;
  margin: 0;
  white-space: nowrap;
}

.finale-age-spotlight__caption {
  color: var(--text-muted);
  font-size: 0.76rem;
  line-height: 1.42;
  margin: 0;
}

.finale-insights-block :deep(.dual-trend-chart) {
  height: 300px;
  padding: 10px;
}

.finale-insights-block :deep(.leaflet-d3-map-shell),
.finale-insights-block :deep(.state-ranking-card),
.finale-insights-block :deep(.leaflet-d3-map) {
  height: 320px;
  max-height: 320px;
  min-height: 320px;
}

.finale-insights-empty {
  border: 1px dashed rgba(27, 46, 94, 0.25);
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 0.8rem;
  line-height: 1.45;
  margin: 0;
  padding: 10px;
}

.finale-map-layout {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.finale-map-controls {
  align-items: stretch;
  background: rgba(27, 46, 94, 0.04);
  border: 1px solid rgba(27, 46, 94, 0.12);
  border-radius: 10px;
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 8px 10px;
}

.finale-map-toolbar {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
}

.finale-map-button {
  align-items: center;
  background: #fff;
  border: 1px solid rgba(27, 46, 94, 0.22);
  border-radius: 999px;
  color: #1b2e5e;
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: 0.74rem;
  font-weight: 700;
  gap: 6px;
  line-height: 1;
  min-height: 30px;
  min-width: 72px;
  padding: 4px 11px;
  white-space: nowrap;
}

.finale-map-year {
  color: #1f2937;
  font-size: 0.8rem;
  margin: 0 0 0 auto;
  min-width: 0;
  white-space: nowrap;
}

.finale-map-slider-group {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.finale-map-slider {
  accent-color: #1b2e5e;
  width: 100%;
}

.finale-map-year-labels {
  color: #6b7280;
  display: grid;
  font-size: 0.66rem;
  gap: 4px;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  text-align: center;
  width: 100%;
}

.finale-map-year-labels__year--active {
  color: #1b2e5e;
  font-weight: 800;
}

.finale-insights-summary-period {
  color: #6b7280;
  font-size: 0.78rem;
  margin: 0;
}

.finale-summary-dual-box {
  align-items: stretch;
  background: #fff;
  border: 1px solid #e3d7c8;
  border-radius: 8px;
  display: grid;
  gap: 0;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
}

.finale-summary-dual-box__half {
  display: grid;
  gap: 3px;
  padding: 9px 10px;
}

.finale-summary-dual-box__divider {
  background: #e3d7c8;
  width: 1px;
}

.finale-summary-dual-box__label {
  color: #6b7280;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.finale-summary-dual-box__value {
  color: #1b2e5e;
  font-size: 0.9rem;
  line-height: 1.35;
  word-break: break-word;
}

.finale-summary-grid {
  display: grid;
  gap: 8px;
}

.finale-summary-tile {
  background: #fff;
  border: 1px solid #e3d7c8;
  border-radius: 8px;
  display: grid;
  gap: 4px;
  min-height: 56px;
  padding: 9px;
}

.finale-summary-tile span {
  color: #6b7280;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.finale-summary-tile strong {
  color: #1b2e5e;
  font-size: 0.9rem;
  line-height: 1.35;
}

.finale-summary-meaning {
  border-left: 3px solid rgba(59, 111, 143, 0.45);
  color: #334155;
  font-size: 0.8rem;
  line-height: 1.48;
  margin: 2px 0 0;
  padding-left: 10px;
}

.sim-copy--final .final-outcome-heading {
  font-size: 1.12rem;
  margin: 0;
}

.summary-panel--recap-block {
  background: rgba(248, 250, 252, 0.95);
  border: 1px solid rgba(27, 46, 94, 0.12);
  border-radius: 12px;
  padding: 12px 14px;
}

.summary-panel__eyebrow--recap {
  margin: 0 0 6px;
}

.recap-scroll-viewport {
  height: 100px;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid rgba(27, 46, 94, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.85);
}

.recap-scroll-viewport__inner {
  padding: 8px 10px;
}

.recap-scroll-viewport:focus-visible {
  outline: 2px solid rgba(27, 46, 94, 0.35);
  outline-offset: 2px;
}

.summary-panel--ai-open {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(99, 102, 241, 0.18);
  border-radius: 12px;
  padding: 12px 14px 14px;
}

.summary-panel__ai-head {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  justify-content: space-between;
  margin-bottom: 10px;
}

.summary-body--ai-open {
  margin-top: 0;
  max-height: none;
  opacity: 1;
  overflow: visible;
}

.coach-unified-stack--ai-only {
  gap: 10px;
}

.recap-count {
  margin: 0 0 8px;
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1.4;
  color: var(--navy);
}

.recap-items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}

.recap-item {
  margin: 0;
  padding: 10px 0 0;
  border-top: 1px solid rgba(27, 46, 94, 0.1);
}

.recap-item:first-child {
  border-top: 0;
  padding-top: 0;
}

.recap-item__decision {
  margin: 0 0 6px;
  font-size: 0.82rem;
  font-weight: 800;
  line-height: 1.35;
  color: var(--navy);
}

.recap-item__why,
.recap-item__how {
  margin: 0 0 6px;
  font-size: 0.8rem;
  line-height: 1.48;
  color: #374151;
}

.recap-item__lbl {
  display: block;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: 2px;
}

.reinforce-done {
  display: grid;
  gap: 8px;
}

.primary,
.secondary {
  border-radius: 10px;
  padding: 10px 12px;
  font-weight: 700;
  text-align: center;
}
.primary {
  background: #1b2e5e;
  color: #fff;
  border: 0;
  text-decoration: none;
}
.secondary {
  background: #fff;
  color: #1b2e5e;
  border: 1px solid rgba(27, 46, 94, 0.22);
}

.finale-pane {
  align-items: stretch;
  align-self: stretch;
  background: var(--bg-page);
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0;
}

.finale-card {
  background: transparent;
  border: 0;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  overflow: hidden;
  padding: 10px;
}

.finale-pane--image-only {
  justify-content: center;
}

.finale-pane .finale-card {
  flex: 1;
  min-height: clamp(260px, 48vh, 640px);
  max-height: clamp(320px, 58vh, 720px);
}

.finale-pane--image-only .finale-image {
  max-height: min(58vh, 640px);
  width: auto;
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

.finale-image {
  display: block;
  height: 100%;
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  width: 100%;
}

/* Learning summary panel */
.summary-panel {
  margin-top: 10px;
  border: 1px solid #e5e2dc;
  background: #ffffff;
  border-radius: 10px;
  padding: 12px 12px 10px;
  box-shadow: 0 1px 4px rgba(26, 26, 42, 0.06);
}

.summary-panel__eyebrow {
  font-size: 0.68rem;
  font-weight: 800;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 10px;
}

/* AI Coach Summary (Gemini-inspired) */
.summary-panel--ai {
  border: 1px solid var(--cream-border);
  background: linear-gradient(165deg, var(--bg-panel) 0%, var(--bg-soft-blue) 100%);
  position: relative;
  overflow: hidden;
}

.summary-panel--ai::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--navy);
}

.ai-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.ai-panel-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-sparkle {
  font-size: 0.9rem;
  color: var(--navy);
  line-height: 1;
}

.summary-panel--ai .summary-panel__eyebrow {
  color: var(--navy);
  margin-bottom: 0;
}

.ai-badge {
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 3px 9px;
  letter-spacing: 0.03em;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.ai-badge--ok {
  background: rgba(122, 154, 130, 0.15);
  color: #3a6b4a;
  border: 1px solid rgba(122, 154, 130, 0.3);
}

.ai-badge--loading {
  background: rgba(59, 111, 143, 0.1);
  color: #3b6f8f;
  border: 1px solid rgba(59, 111, 143, 0.25);
  gap: 6px;
}

.ai-badge__spinner {
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 2px solid rgba(59, 111, 143, 0.3);
  border-top-color: #3b6f8f;
  border-radius: 50%;
  animation: ai-spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes ai-spin {
  to {
    transform: rotate(360deg);
  }
}

.ai-badge--guided {
  background: rgba(254, 252, 232, 0.95);
  color: #854d0e;
  border: 1px solid rgba(217, 119, 6, 0.35);
}

.ai-coach-skeleton {
  display: grid;
  gap: 8px;
  padding: 4px 0 2px;
}

.ai-coach-line {
  height: 10px;
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.12), rgba(59, 111, 143, 0.15));
  animation: ai-skel-shimmer 1.1s ease-in-out infinite;
}

.ai-coach-line--wide {
  width: 100%;
}

.ai-coach-line--mid {
  width: 72%;
}

@keyframes ai-skel-shimmer {
  0% {
    opacity: 0.45;
  }
  50% {
    opacity: 0.85;
  }
  100% {
    opacity: 0.45;
  }
}

.reinforce-panel {
  margin-top: 10px;
  border: 1px dashed rgba(27, 46, 94, 0.24);
  border-radius: 12px;
  padding: 10px;
  background: #f8fbff;
}

.reinforce-entry__title {
  margin: 0;
  font-size: 0.86rem;
  color: #1b2e5e;
  font-weight: 700;
}

.reinforce-entry__hint {
  margin: 5px 0 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.reinforce-entry__actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.reinforce-question__prompt {
  margin: 0;
  color: #1a1a2a;
  font-size: 0.84rem;
  line-height: 1.45;
  font-weight: 600;
}

.reinforce-options {
  margin-top: 8px;
  display: grid;
  gap: 6px;
}

.reinforce-option {
  border: 1px solid rgba(27, 46, 94, 0.2);
  background: #ffffff;
  color: #1b2e5e;
  border-radius: 10px;
  text-align: left;
  padding: 8px 10px;
  font-size: 0.82rem;
  cursor: pointer;
}

.reinforce-option:hover,
.reinforce-option:focus-visible {
  border-color: #1b2e5e;
  background: #eef2ff;
}

.reinforce-option--picked {
  border-color: #1b2e5e;
  background: #eef2ff;
  font-weight: 700;
}

.reinforce-feedback {
  margin: 8px 0 0;
  font-size: 0.8rem;
  line-height: 1.45;
}

.reinforce-feedback--ok {
  color: #166534;
}

.reinforce-feedback--warn {
  color: #92400e;
}

.text-btn {
  margin-top: 8px;
  border: 0;
  background: transparent;
  color: #1b2e5e;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0;
}

.reinforce-skip-note {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.reinforce-skip-note--done {
  color: #166534;
  font-weight: 600;
}

.outcome-panel {
  margin-top: 8px;
  border-radius: 10px;
  border: 1px solid rgba(22, 163, 74, 0.35);
  background: #ecfdf5;
  padding: 8px 10px;
}

.outcome-panel--high {
  border-color: rgba(220, 38, 38, 0.35);
  background: #fef2f2;
}

.detected {
  margin-top: 10px;
  border: 1px solid rgba(16, 185, 129, 0.4);
  background: #ecfdf5;
  border-radius: 10px;
  padding: 8px 10px;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.22s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.sim-shell-fade-enter-active,
.sim-shell-fade-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.sim-shell-fade-enter-from,
.sim-shell-fade-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.995);
}
@keyframes tiny-shake {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  50% {
    transform: translateX(2px);
  }
  100% {
    transform: translateX(0);
  }
}
/* Collapsible summary panels */
.summary-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  text-align: left;
}

.summary-toggle--ai {
  width: 100%;
}

.ai-toggle-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.toggle-chevron {
  font-size: 1.1rem;
  color: #6b7280;
  font-weight: 700;
  line-height: 1;
  transform: rotate(90deg);
  transition: transform 0.25s ease;
  display: inline-block;
  flex-shrink: 0;
}

.toggle-chevron--open {
  transform: rotate(-90deg);
}

.toggle-chevron--ai {
  color: #6366f1;
}

.summary-body {
  overflow: hidden;
  max-height: 600px;
  opacity: 1;
  transition:
    max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.25s ease;
  margin-top: 8px;
}

.summary-body--collapsed {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
}

.fs-transition-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.fs-transition-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  animation: fs-dot-bounce 0.9s ease-in-out infinite;
}

.fs-transition-dot:nth-child(2) {
  animation-delay: 0.15s;
}
.fs-transition-dot:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes fs-dot-bounce {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

.fs-overlay-enter-active {
  transition: opacity 0.2s ease;
}
.fs-overlay-leave-active {
  transition: opacity 0.3s ease;
}
.fs-overlay-enter-from,
.fs-overlay-leave-to {
  opacity: 0;
}

/* Fullscreen shell */
.fullscreen-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(6px);
  border-radius: 10px;
  margin-bottom: 10px;
}

.fullscreen-bar__label {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.fullscreen-bar__exit {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.fullscreen-bar__exit:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sim--fullscreen {
  max-width: 100%;
  background: var(--navy);
  padding: 12px 18px 18px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.sim--fullscreen .sim-card {
  flex: 1;
  min-height: 0;
  max-height: calc(100vh - 80px);
  overflow: hidden;
  width: 100%;
}

/* In fullscreen, keep image to a bounded height so image + dialogue both fit */
.sim--fullscreen .scene-image-wrap {
  max-height: min(56vh, 540px);
  flex: 0 0 auto;
}
.sim--fullscreen .scene-image-wrap--walkthrough {
  max-height: min(48vh, 500px);
}

.sim--fullscreen .finale-pane--image-only .finale-card {
  min-height: min(52vh, 520px);
  max-height: min(58vh, 640px);
}

.sim--fullscreen .finale-pane--image-only .finale-image {
  max-height: min(54vh, 600px);
}

.sim-wrapper {
  overflow-x: hidden;
  width: 100%;
  max-width: 100%;
}

.sim {
  max-width: 100%;
  overflow-x: hidden;
}

@media (max-width: 767px) {
  .sim-card--intro {
    grid-template-columns: minmax(0, 1fr);
    min-height: auto;
    align-items: start;
  }

  .sim-card--intro .intro-visual {
    display: none;
  }

  .sim-card--intro .sim-copy--intro {
    padding: 28px 22px 24px;
    gap: 20px;
  }

  .sim-card--intro .sim-meta {
    font-size: 1.125rem;
    line-height: 1.35;
  }

  .sim-card--intro .progress-line {
    margin: 0;
  }

  .intro-meet-head {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 0;
  }

  .intro-meet-head__art {
    display: block;
    flex: 0 0 auto;
    width: 96px;
  }

  .intro-meet-head__img {
    display: block;
    width: 96px;
    max-width: 110px;
    height: auto;
    max-height: 110px;
    object-fit: contain;
  }

  .intro-meet-head__title {
    margin: 0;
    flex: 1 1 auto;
    min-width: 0;
    font-size: 1.3125rem;
    line-height: 1.28;
  }

  .sim-card--intro .intro-lead {
    margin: 0;
    font-size: 1rem;
    line-height: 1.45;
    color: var(--text-main);
  }

  .sim-card--intro .intro-lead__full {
    display: none;
  }

  .sim-card--intro .intro-lead__short {
    display: block;
  }

  .sim-card--intro .thinking-card {
    padding: 17px;
    gap: 10px;
  }

  .sim-card--intro .thinking-card__label {
    font-size: 0.8125rem;
  }

  .sim-card--intro .thinking-card__line--desktop {
    display: none;
  }

  .sim-card--intro .thinking-card__line--mobile {
    display: block;
    margin: 0;
    font-size: 1rem;
    line-height: 1.48;
  }

  .sim-card--intro .actions {
    flex-direction: column;
    flex-wrap: nowrap;
    width: 100%;
    gap: 10px;
    margin-top: 2px;
  }

  .sim-card--intro .primary,
  .sim-card--intro .secondary {
    width: 100%;
    flex: none;
    justify-content: center;
    font-size: 1rem;
    line-height: 1.35;
    padding: 11px 16px;
    min-height: 0;
  }

  .sim-wrapper {
    box-sizing: border-box;
    margin-inline: auto;
    max-height: min(100dvh, 1000px);
    max-width: 100%;
    overflow-x: clip;
    overflow-y: auto;
    padding-inline: 12px;
    width: 100%;
  }

  .sim {
    max-width: 100%;
    overflow-x: clip;
  }

  .sim-card--walkthrough,
  .sim-card--finale {
    box-sizing: border-box;
    grid-template-columns: minmax(0, 1fr);
    margin-inline: 0;
    max-height: none;
    max-width: 100%;
    min-height: auto;
    overflow-x: clip;
    width: 100%;
    background: var(--bg-panel);
    border-color: #e3d7c8;
    box-shadow: none;
  }

  .wt-stage-context--desktop {
    display: none;
  }

  .wt-stage-context--mobile {
    display: block;
  }

  .scene-stage-lead--desktop {
    display: none;
  }

  .wt-stage-lead--stack {
    display: block;
    margin: 0;
    font-size: 0.84rem;
    line-height: 1.45;
  }

  .sim-card--walkthrough > *,
  .sim-card--finale > * {
    box-sizing: border-box;
    max-width: 100%;
    min-width: 0;
    width: 100%;
  }

  .sim-card--walkthrough .sim-visual--walkthrough {
    display: none;
  }

  .sim-card--walkthrough {
    display: flex;
    flex-direction: column;
  }

  .sim-card--walkthrough .sim-copy--scene {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    overflow-x: clip;
    padding-inline: 12px;
    width: 100%;
    max-width: 100%;
  }

  .sim-card--finale .sim-copy--final {
    overflow-x: clip;
    padding-inline: 12px;
  }

  .finale-celebration,
  .ai-coach-checklist__items,
  .choices--scene,
  .stage-context-panel,
  .wt-conversation-card {
    max-width: 100%;
    min-width: 0;
  }

  .sim-card--walkthrough .wt-stage-mobile-stack {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    width: 100%;
    min-width: 0;
  }

  .sim-card--walkthrough .scene-head--mobile {
    display: grid;
    gap: 6px;
    width: 100%;
  }

  .sim-card--finale .finale-header {
    gap: 10px;
    padding-bottom: 10px;
  }

  .sim-card--finale .finale-header__art {
    max-width: 120px;
  }

  .sim-card--finale .finale-header__img {
    max-height: 120px;
    max-width: 120px;
  }

  .sim-card--finale .sim-copy--final {
    padding: 14px 14px 16px;
  }

  .sim-card--walkthrough .scene-stage-title--mobile,
  .sim-card--walkthrough .scene-stage-lead--mobile,
  .sim-card--walkthrough .wt-scene-mobile-figure,
  .sim-card--walkthrough .wt-mobile-convo,
  .sim-card--walkthrough .risk-signal,
  .sim-card--walkthrough .thinking-strip,
  .sim-card--walkthrough .choices-prompt,
  .sim-card--walkthrough .choices--scene,
  .sim-card--walkthrough .coach-note {
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .sim-card--walkthrough .scene-stage-title--mobile {
    display: block;
    margin: 0;
    font-size: 1.2rem;
    line-height: 1.28;
    color: #1b2e5e;
    width: 100%;
  }

  .sim-card--walkthrough .scene-stage-lead--mobile {
    display: block;
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.45;
    color: #2b2b2b;
    width: 100%;
    max-width: none;
  }

  .sim-card--walkthrough .wt-scene-mobile-figure {
    align-items: center;
    background: transparent;
    border: 0;
    display: flex;
    justify-content: center;
    margin: 0;
    min-height: 0;
    padding: 0;
    width: 100%;
  }

  .sim-card--walkthrough .wt-scene-mobile-figure__img {
    display: block;
    height: auto;
    max-height: 200px;
    max-width: min(100%, 240px);
    object-fit: contain;
    object-position: center center;
    width: auto;
  }

  .sim-card--walkthrough .scene-head--desktop,
  .sim-card--walkthrough .scene-stage-title--desktop,
  .sim-card--walkthrough .scene-stage-lead--desktop {
    display: none;
  }

  .sim-card--walkthrough .sim-copy--scene {
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: visible;
    padding: 14px;
    background: var(--bg-panel);
  }

  .sim-card--walkthrough .sim-meta {
    font-size: 0.78rem;
    color: #1b2e5e;
  }

  .sim-card--finale .outcome-section--coach,
  .sim-card--finale .coach-unified-stack,
  .sim-card--finale .summary-panel {
    box-sizing: border-box;
    max-width: 100%;
    min-width: 0;
    width: 100%;
  }

  .sim-card--finale .summary-body--ai-open {
    max-height: none;
    overflow: visible;
  }

  .sim-card--walkthrough .wt-mobile-convo {
    display: block;
    margin: 0;
    width: 100%;
  }

  .sim-card--walkthrough .wt-conversation-card--mobile {
    border: 1px solid #e3d7c8;
    background: var(--bg-panel);
    padding: 8px;
    border-radius: 10px;
    box-shadow: none;
  }

  .sim-card--walkthrough .phone-thread--compact {
    gap: 5px;
  }

  .sim-card--walkthrough .phone-thread--compact .bubble {
    box-sizing: border-box;
    margin: 0;
    max-width: 85%;
    overflow-wrap: break-word;
    padding: 6px 9px;
    font-size: 0.72rem;
    line-height: 1.35;
    white-space: normal;
    word-break: break-word;
  }

  .sim-card--walkthrough .bubble--alex {
    justify-self: end;
    max-width: 85%;
  }

  .sim-card--walkthrough .bubble--scammer {
    max-width: 85%;
  }

  .sim-card--walkthrough .risk-signal--editorial {
    box-sizing: border-box;
    overflow: visible;
    gap: 4px;
    padding: 10px 12px;
    border-radius: 10px;
    border-color: #e3d7c8;
    border-left-color: #d0312d;
    background: var(--bg-panel);
    box-shadow: none;
  }

  .sim-card--walkthrough .risk-signal__kicker {
    display: block;
    margin: 0;
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6b7280;
  }

  .sim-card--walkthrough .risk-signal__tag--desktop,
  .sim-card--walkthrough .risk-signal__reason--desktop {
    display: none;
  }

  .sim-card--walkthrough .risk-signal__tag--mobile {
    align-items: flex-start;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    font-size: 0.9rem;
    font-weight: 800;
    color: #1b2e5e;
    white-space: normal;
  }

  .sim-card--walkthrough .risk-signal__glyph {
    color: #d0312d;
  }

  .sim-card--walkthrough .risk-signal__reason--mobile {
    display: block;
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.4;
    color: #2b2b2b;
    overflow: visible;
    overflow-wrap: break-word;
    white-space: normal;
    word-break: break-word;
  }

  .sim-card--walkthrough .thinking-strip {
    padding: 8px 10px;
    gap: 4px;
    border-radius: 10px;
    border-color: #e3d7c8;
    background: var(--bg-panel);
  }

  .sim-card--walkthrough .thinking-strip__line--desktop {
    display: none;
  }

  .sim-card--walkthrough .thinking-strip__line--mobile {
    display: block;
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.4;
    color: #1b2e5e;
    -webkit-line-clamp: unset;
    line-clamp: unset;
    overflow: visible;
  }

  .sim-card--walkthrough .choices-prompt {
    margin: 0;
    font-size: 0.65rem;
    width: 100%;
  }

  .sim-card--walkthrough .choices--scene {
    width: 100%;
    gap: 8px;
  }

  .sim-card--walkthrough .choice {
    box-sizing: border-box;
    max-width: 100%;
    overflow-wrap: break-word;
    padding: 11px 14px;
    border-radius: 10px;
    font-size: 0.9rem;
    line-height: 1.35;
    white-space: normal;
    width: 100%;
    word-break: break-word;
  }

  .sim-card--walkthrough .choice-title {
    font-size: 0.9rem;
    line-height: 1.35;
    white-space: normal;
  }

  .finale-summary-dual-box {
    grid-template-columns: 1fr;
  }

  .finale-summary-dual-box__divider {
    display: none;
  }

  .finale-age-spotlight__row {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
  }

  .finale-age-chart--desktop {
    display: none;
  }

  .finale-age-spotlight--mobile {
    display: grid;
  }

  .finale-age-spotlight__group,
  .finale-age-spotlight__stat {
    white-space: normal;
  }

  .finale-map-toolbar {
    gap: 8px;
  }

  .finale-map-year {
    margin-left: 0;
  }

  .finale-map-slider-group {
    width: 100%;
  }

  .finale-insights-type-tab {
    font-size: 0.7rem;
    min-height: 28px;
    padding: 4px 8px;
  }

  .finale-insights-block :deep(.dual-trend-chart) {
    height: 260px;
  }

  .finale-insights-block :deep(.leaflet-d3-map-shell),
  .finale-insights-block :deep(.state-ranking-card),
  .finale-insights-block :deep(.leaflet-d3-map) {
    height: 280px;
    max-height: 280px;
    min-height: 280px;
  }
}

@media (max-width: 480px) {
  .sim-card {
    min-height: auto;
    border-radius: 14px;
  }

  .wt-block {
    padding: 8px 10px;
  }

  .wt-label {
    font-size: 0.62rem;
  }

  .scene-stage-title {
    font-size: 1rem;
  }

  .scene-stage-lead,
  .thinking-strip__line,
  .coach-note__explain {
    font-size: 0.8rem;
  }

  .choice {
    padding: 10px;
  }

  .choice-title {
    font-size: 0.82rem;
  }

  .coach-note {
    padding: 10px;
  }

  .recap-scroll-viewport {
    height: 100px;
  }

  .primary,
  .secondary {
    flex: 1 1 100%;
    font-size: 0.82rem;
    padding: 9px 10px;
  }

  .finale-insights-report {
    padding: 10px;
  }

  .finale-insights-type-tabs {
    gap: 5px;
  }

  .finale-insights-type-tab {
    font-size: 0.66rem;
    min-height: 26px;
    padding: 3px 7px;
  }

  .sim-wrapper {
    padding-inline: 10px;
  }

  .sim-card--finale .sim-copy--final,
  .sim-card--walkthrough .sim-copy--scene {
    padding: 12px;
  }

  .ai-coach-checklist__item {
    border-radius: 10px;
    flex: 1 1 100%;
  }

  .finale-map-controls {
    padding: 8px;
  }

  .finale-map-toolbar {
    align-items: stretch;
    display: grid;
    gap: 6px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .finale-map-year {
    grid-column: 1 / -1;
    text-align: left;
  }

  .finale-map-button {
    justify-content: center;
    min-width: 0;
    width: 100%;
  }

  .finale-map-year-labels {
    font-size: 0.6rem;
  }
}
</style>

