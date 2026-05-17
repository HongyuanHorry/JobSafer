# StepSafe Design Specifications (Learn / Simulator Focus)

**Last Updated:** May 6, 2026

---

## 1) Typography hierarchy and spacing standard

This standard is now used to reduce inconsistent line spacing and improve readability on **1024×1366**.

### Title levels

- **H1 / page hero title**
  - Size: `clamp(1.8rem, 3.2vw, 2.2rem)`
  - Line-height: `1.2`
  - Weight: `800`
  - Letter-spacing: `-0.01em`
- **H2 / section title**
  - Size: `clamp(2rem, 4vw, 3.2rem)`
  - Line-height: `1.15–1.25`
  - Weight: `800`
- **H3/H4 / card title & sub-title**
  - Size: `1.2rem–1.35rem`
  - Line-height: `1.3–1.4`
  - Weight: `700–800`

### Body and helper text

- **Body text**
  - Size: `1rem`
  - Line-height: `1.7`
- **Secondary text / notes**
  - Size: `0.84rem–0.95rem`
  - Line-height: `1.55–1.65`
- **Micro labels / eyebrow**
  - Size: `0.7rem–0.82rem`
  - Uppercase with extra tracking where needed

### Vertical rhythm

- Standard content block gap: `10px / 14px / 18px` scale
- Card padding: `20px` (learn entry) / `14px` (simulator stage card)
- Avoid ultra-tight lines (`< 1.35`) and overly loose blocks (`> 1.8`)

---

## 2) Learn section layout alignment

### Goal

Ensure **“Scam Progression Simulator”** top box aligns with the large content box below.

### Applied constraints

- `.learn-hero` and `.learn-flow` use same width logic:
  - `width: 100%`
  - `max-width: 1200px`
  - `margin-inline: auto`
- `.learn-hero` includes `box-sizing: border-box`

Result: top title box width now visually matches lower simulator workflow box.

---

## 3) Scenario UI information architecture (text plan implemented)

### New hierarchy (left to right)

1. **Left visual pane**: expression + phone thread for emotional context
2. **Right decision pane**: stage title, concise scenario text, Alex guidance in chat bubbles
3. **Action zone**: options and feedback

### Visual landing sequence

1. Stage marker/progress dots
2. Stage heading
3. Core scenario text
4. Alex chat-bubble guidance
5. Pressure meter
6. Decision buttons

This removes the prior “split/fragmented” feeling and gives a clear reading path.

---

## 4) Simulator interaction logic updates

### High-pressure threshold

- **Updated rule:** `riskCount >= 1`
- Any wrong/risky choice now triggers high-pressure outcome path.

### Option correctness visibility

- Before selection:
  - No green/red “correctness” signaling on options.
  - Neutral option styling only.
- After selection:
  - User sees selected-path feedback text in coach note.

---

## 5) Dialogue box clarity improvement

To fix “users cannot tell this is a dialogue box”:

- Introduced `chat-thread` container with subtle panel background
- Bubbles include left/right tail styles:
  - `bubble--tail-left`
  - `bubble--tail-right`
- Alex guidance is presented in chat-bubble blocks instead of plain paragraph stack

---

## 6) Simulator action/button spacing improvements

- Increased spacing before options/actions:
  - from `gap: 8px; margin-top: 10px`
  - to `gap: 10px; margin-top: 14px`
- Quiz question spacing improved:
  - `.quiz-question` now uses bottom margin + padding for clearer separation from options

---

## 7) Completion marker (local only, no backend)

### Behavior

- On simulator completion, component emits completion payload:
  - `scenarioType`, `highPressure`, `riskCount`
- Parent stores completion in localStorage under learn state
- Entry screen shows completion summary and per-scenario completed badge

### UI

- In “Ready to outsmart this scam with Alex?” list:
  - completed scenarios show `completed` badge
  - badge replaces the previous emoji in that slot

---

## 8) Copy and content updates

- Home stat updated:
  - from `18-30`
  - to `18-24`

- Simulator intro sentence replaced with:
  - “Progression simulator includes **scenario walkthrough** and **scam type check**. Choose one scenario to begin.”
  - both terms are color-accented via `.term--walkthrough` and `.term--check`

---

## 9) Insights summary split layout (“Reports / Losses”)

Updated to a true two-half composition:

- New `.summary-dual-box`
  - `grid-template-columns: 1fr auto 1fr`
  - center divider line
  - left and right values centered in equal halves

This replaces prior left-aligned stacked appearance.

---

## 10) Unified control system (buttons + selects)

To reduce visual fatigue and learning cost while keeping variety:

### Base tokens (theme)

- `--ms-control-*` tokens for radius, sizes, colors, borders

### Standard classes

- `.ms-control` (base)
- `.ms-control--pill` (rounded pill variant)
- `.ms-control--active` (selected state)
- `.ms-control--sm` / `--lg` (size variants)
- `.ms-select` (dropdown/select standard)

### Design principle

- **Consistency first**: same interaction affordance, hover/focus language, spacing rhythm
- **Controlled variety**: variant modifiers for context (pill, active, size), not random one-off styles

---

## 11) Responsive behavior

- Main simulator remains 2-column on desktop, 1-column below `860px`
- Recap items changed to wrap-friendly flex chips on smaller widths
- Goal: avoid clipping/overflow and preserve complete flow visibility on common tablet portrait sizes

---

## 12) Accessibility notes

- Reduced reliance on color-only correctness cues in option pre-selection state
- Better grouping and hierarchy improves scanability
- Focus/hover states are consistent across unified controls

---

End of specification.
