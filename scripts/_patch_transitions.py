from pathlib import Path

p = Path("src/App.vue")
text = p.read_text(encoding="utf-8")

sample_start = text.find('      <div class="sample-result-strip-wrap">')
info_start = text.find('      <section\n        class="info-grid section-c section-fade section-fade--news"')

if sample_start == -1 or info_start == -1:
    raise SystemExit(f"markers not found sample={sample_start} info={info_start}")

new_block = """      <section
        id="result-section"
        class="flow-section section-c section-fade section-fade--result reveal-on-scroll"
        aria-label="Result section"
      >
        <div class="container-shell analysis-preview-caption" role="note">
          <p class="analysis-preview-caption__eyebrow">Analysis preview</p>
          <p class="analysis-preview-caption__lead">
            Example analysis layout for suspicious and safe submissions
          </p>
          <div class="analysis-preview-caption__tags" aria-hidden="true">
            <span class="editorial-chip editorial-chip--muted">Text analysis</span>
            <span class="editorial-chip editorial-chip--muted">Link analysis</span>
            <span class="editorial-chip editorial-chip--muted">Risk summary</span>
          </div>
        </div>
        <div class="container-shell">
          <Transition v-if="showResult" name="result-crossfade" mode="out-in">
            <ResultPanel
              :key="resultPanelTransitionKey"
              :result="result"
              :highlight-key-signals="highlightKeySignals"
              :analysis-input-type="resultPanelAnalysisType"
              :link-evidence-url="resultPanelLinkUrl"
              :message-evidence-plain="resultPanelMessagePlain"
              :extracted-text-preview="extractedTextPreview"
              :analysis-source-text="resultPanelMessagePlain"
            />
          </Transition>
          <div v-else class="analysis-layout-demo" inert aria-hidden="true">
            <ResultPanel
              key="layout-preview"
              :result="MOCK_PREVIEW_RESULT"
              :highlight-key-signals="false"
              analysis-input-type="text"
              :link-evidence-url="MOCK_PREVIEW_LINK"
              :message-evidence-plain="MOCK_PREVIEW_MESSAGE"
              :extracted-text-preview="MOCK_PREVIEW_MESSAGE"
              :analysis-source-text="MOCK_PREVIEW_MESSAGE"
            />
          </div>
        </div>
      </section>

""".replace("<motion ", "<div ").replace("</motion>", "</motion>")

text = text[:sample_start] + new_block + text[info_start:]

insights_marker = '      <section\n        id="insights-section"'
if insights_marker not in text:
    raise SystemExit("insights marker missing")

data_bridge = """      <div
        class="editorial-transition editorial-transition--data-band section-fade section-fade--data-bridge"
        aria-hidden="true"
      >
        <div class="container-shell editorial-transition__inner editorial-transition__inner--wide">
          <p class="editorial-transition__title editorial-transition__title--banner">
            Built from real scam patterns across Australia
          </p>
          <p class="editorial-transition__lead">
            Explore trends, age groups, and regional signals from reported scam data.
          </p>
          <div class="editorial-transition__tags" aria-hidden="true">
            <span class="editorial-chip">Trend patterns</span>
            <span class="editorial-chip">Age groups</span>
            <span class="editorial-chip">Location map</span>
            <span class="editorial-chip">Dataset summary</span>
          </div>
        </div>
      </div>

"""

text = text.replace(insights_marker, data_bridge + insights_marker, 1)

old_closure = """        </div>
      </section>

      <div
        class="editorial-transition editorial-transition--data-band"""

idx = text.find('class="info-grid section-c')
end_article = text.find(old_closure, idx)
if end_article == -1:
    raise SystemExit("info grid end not found")

closure = """          <p class="info-grid__closure" role="note">
            Cross-check urgent cases with official sources — JobSafer is a fast first read, not a
            replacement for reporting.
          </p>
        </div>
      </section>

      <div
        class="editorial-transition editorial-transition--data-band"""

text = text[:end_article] + closure + text[end_article + len(old_closure) :]

p.write_text(text, encoding="utf-8")
print("patched App.vue")
