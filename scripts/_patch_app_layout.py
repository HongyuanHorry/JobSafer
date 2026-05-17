from pathlib import Path

p = Path(__file__).resolve().parents[1] / "src/App.vue"
t = p.read_text(encoding="utf-8")
d = "d" + "iv"

old = """      <section
        id="check-section"
        class="flow-section flow-section--check snap-stage section-a section-fade section-fade--check reveal-on-scroll"
        aria-label="Check section"
      >
        <div id="check-scam-panel" class="container-shell">
          <motion
            class="preview-mode-strip"
            :class="{ 'preview-mode-strip--on': isUIPreviewMode }"
            role="status"
          >
            <span class="preview-mode-strip__label">
              <span aria-hidden="true">{{ isUIPreviewMode ? '✓' : '🔍' }}</span>
              <template v-if="uiPreviewVariant === 'text'">
                Text preview — suspicious
              </template>
              <template v-else-if="uiPreviewVariant === 'text-safe'">
                Text preview — not suspicious
              </template>
              <template v-else-if="uiPreviewVariant === 'link'">
                Link preview — suspicious
              </template>
              <template v-else-if="uiPreviewVariant === 'link-safe'">
                Link preview — not suspicious
              </template>
              <template v-else>
                Preview mock results — text or link, suspicious or safe
              </template>
            </span>
            <motion class="preview-mode-strip__actions">
              <button
                type="button"
                class="preview-mode-strip__btn"
                :class="{ 'preview-mode-strip__btn--active': uiPreviewVariant === 'text' }"
                @click="enterUiPreview('text')"
              >
                Text · suspicious
              </button>
              <button
                type="button"
                class="preview-mode-strip__btn"
                :class="{ 'preview-mode-strip__btn--active': uiPreviewVariant === 'text-safe' }"
                @click="enterUiPreview('text-safe')"
              >
                Text · not suspicious
              </button>
              <button
                type="button"
                class="preview-mode-strip__btn"
                :class="{ 'preview-mode-strip__btn--active': uiPreviewVariant === 'link' }"
                @click="enterUiPreview('link')"
              >
                Link · suspicious
              </button>
              <button
                type="button"
                class="preview-mode-strip__btn"
                :class="{ 'preview-mode-strip__btn--active': uiPreviewVariant === 'link-safe' }"
                @click="enterUiPreview('link-safe')"
              >
                Link · not suspicious
              </button>
              <button
                v-if="isUIPreviewMode"
                type="button"
                class="preview-mode-strip__btn preview-mode-strip__btn--ghost"
                @click="exitUiPreview"
              >
                Exit preview
              </button>
            </motion>
          </motion>

          <SubmissionPanel
            :quick-mode="submissionQuickMode"
            :is-analyzing="isAnalyzing"
            :preview-mode="isUIPreviewMode\"""".replace("motion", d)

new = f"""      <nav class="how-check-bridge section-fade section-fade--bridge" aria-label="Start checking">
        <{d} class="container-shell how-check-bridge__inner">
          <p class="how-check-bridge__lead">Start with any evidence type</p>
          <{d} class="how-check-bridge__types" role="group" aria-label="Evidence types">
            <button type="button" class="how-check-bridge__chip" @click="goToCheckWithMode('text')">
              Text
            </button>
            <button type="button" class="how-check-bridge__chip" @click="goToCheckWithMode('link')">
              Link
            </button>
            <button type="button" class="how-check-bridge__chip" @click="goToCheckWithMode('pdf')">
              PDF
            </button>
            <button type="button" class="how-check-bridge__chip" @click="goToCheckWithMode('abn')">
              ABN
            </button>
          </{d}>
          <p class="how-check-bridge__note">Fast risk check · No sign-up needed</p>
        </{d}>
      </nav>

      <section
        id="check-section"
        class="flow-section flow-section--check section-a section-fade section-fade--check reveal-on-scroll"
        aria-label="Check section"
      >
        <{d} id="check-scam-panel" class="container-shell">
          <SubmissionPanel
            :quick-mode="submissionQuickMode"
            :is-analyzing="isAnalyzing"
            :preview-mode="false\""""

if old not in t:
    raise SystemExit("check block not found")
t = t.replace(old, new, 1)

# Remove preview band section
band_start = '      <section\n        id="check-alerts-section"'
band_end = '      </section>\n\n      <section\n        v-if="isAnalyzing"'
i = t.find(band_start)
j = t.find(band_end)
if i < 0 or j < 0:
    raise SystemExit("preview band not found")
t = t[:i] + t[j + len("      </section>\n\n") :]

# Add sample bar + transition before ResultPanel
old_result = """        <div class="container-shell">
          <div v-if="isUIPreviewMode && !showResult" class="preview-result-banner" role="note">
            <span aria-hidden="true">🎨</span>
            UI Preview —
            {{
              uiPreviewVariant === 'link' || uiPreviewVariant === 'link-safe'
                ? 'link analysis layout'
                : 'text analysis layout'
            }}
            · {{ isPreviewSafeVariant ? 'Not suspicious' : 'Suspicious' }} (mock)
          </div>
          <ResultPanel
            :result="isUIPreviewMode && !showResult ? activePreviewResult : result"
"""

new_result = f"""        <{d} class="container-shell">
          <{d} class="sample-result-inline" aria-label="Try sample results">
            <span class="sample-result-inline__label">Try sample result</span>
            <{d} class="sample-result-inline__pills" role="tablist">
              <button
                v-for="pill in sampleResultPills"
                :key="pill.id"
                type="button"
                class="sample-result-inline__pill"
                :class="{{ 'sample-result-inline__pill--active': uiPreviewVariant === pill.variant }}"
                role="tab"
                :aria-selected="uiPreviewVariant === pill.variant"
                @click="trySampleResult(pill.variant)"
              >
                {{{{ pill.label }}}}
              </button>
              <button
                v-if="isUIPreviewMode && !showResult"
                type="button"
                class="sample-result-inline__pill sample-result-inline__pill--ghost"
                @click="exitUiPreview"
              >
                Clear sample
              </button>
            </{d}>
          </{d}>
          <Transition name="result-crossfade" mode="out-in">
            <ResultPanel
              :key="resultPanelTransitionKey"
              :result="isUIPreviewMode && !showResult ? activePreviewResult : result"
"""

if old_result not in t:
    raise SystemExit("result block not found")
t = t.replace(old_result, new_result, 1)

# Close Transition after ResultPanel
old_close = """            :analysis-source-text="resultPanelMessagePlain"
          />
        </div>
      </section>

      <section
        class="info-grid section-c section-fade section-fade--news"
"""

new_close = """            :analysis-source-text="resultPanelMessagePlain"
            />
          </Transition>
        </div>
      </section>

      <section
        class="info-grid section-c section-fade section-fade--news"
"""

if old_close not in t:
    raise SystemExit("result close not found")
t = t.replace(old_close, new_close, 1)

# Show result section when sample selected OR real result
t = t.replace(
    "v-if=\"showResult || isUIPreviewMode\"",
    "v-show=\"showResult || isUIPreviewMode\"",
    1,
)

# Add sample bar always visible below check - user wants samples above result
# Insert sample bar between check and result always visible
sample_bar = f"""
      <{d} class="sample-result-strip-wrap">
        <{d} class="container-shell sample-result-inline" aria-label="Try sample results">
          <span class="sample-result-inline__label">Try sample result</span>
          <{d} class="sample-result-inline__pills" role="tablist">
            <button
              v-for="pill in sampleResultPills"
              :key="pill.id"
              type="button"
              class="sample-result-inline__pill"
              :class="{{ 'sample-result-inline__pill--active': uiPreviewVariant === pill.variant }}"
              role="tab"
              :aria-selected="uiPreviewVariant === pill.variant"
              @click="trySampleResult(pill.variant)"
            >
              {{{{ pill.label }}}}
            </button>
            <button
              v-if="isUIPreviewMode"
              type="button"
              class="sample-result-inline__pill sample-result-inline__pill--ghost"
              @click="exitUiPreview"
            >
              Clear
            </button>
          </{d}>
        </{d}>
      </{d}>
"""
marker = "      </section>\n\n      <section\n        v-if=\"isAnalyzing\""
if marker not in t:
    marker = "      </section>\n\n      <section\n        v-show=\"showResult || isUIPreviewMode\""
if marker not in t:
    raise SystemExit("marker not found")
# Only insert if not duplicate - check first
if "sample-result-strip-wrap" not in t:
    t = t.replace(
        "      </section>\n\n      <section\n        v-show=\"showResult || isUIPreviewMode\"",
        "      </section>\n" + sample_bar + "\n      <section\n        v-show=\"showResult || isUIPreviewMode\"",
        1,
    )

# Remove duplicate inline sample inside result if we added both
if t.count("sample-result-inline__label") > 1:
    # remove inner one in result section
    inner = f"""          <{d} class="sample-result-inline" aria-label="Try sample results">
            <span class="sample-result-inline__label">Try sample result</span>
            <{d} class="sample-result-inline__pills" role="tablist">
              <button
                v-for="pill in sampleResultPills"
                :key="pill.id"
                type="button"
                class="sample-result-inline__pill"
                :class="{{ 'sample-result-inline__pill--active': uiPreviewVariant === pill.variant }}"
                role="tab"
                :aria-selected="uiPreviewVariant === pill.variant"
                @click="trySampleResult(pill.variant)"
              >
                {{{{ pill.label }}}}
              </button>
              <button
                v-if="isUIPreviewMode && !showResult"
                type="button"
                class="sample-result-inline__pill sample-result-inline__pill--ghost"
                @click="exitUiPreview"
              >
                Clear sample
              </button>
            </{d}>
          </{d}>
"""
    t = t.replace(inner, "", 1)

p.write_text(t, encoding="utf-8")
print("patched App.vue layout")
