# Palette UI (Phase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two-color checker in both apps with the palette screen recorded in `DESIGN.md`, driven by one pure view layer in the core, with a rewritten E2E suite that both apps pass.

**Architecture:** All screen state and every derived value live in `packages/core/src/view.ts`: a state type, a pure `reduce(state, action)` and a pure `paletteView(state)` that returns everything the screen shows (strings already formatted). The Next and Nuxt apps only hold the state (`useReducer` / a `ref`), dispatch actions, render the view, and do the browser-only work (URL sync, clipboard, focus moves, mirroring the theme on `<html>`). The E2E suite is written first, against the contract below, and runs unchanged against both apps.

**Tech Stack:** Bun workspaces, TypeScript, Next 16 + React 19, Nuxt 4.6 + Vue 3.5, Tailwind CSS v4, Vitest, Playwright + @axe-core/playwright, Biome.

**Spec:** `docs/design/2026-11-14-palette-and-motion.md` (sections 5 and 6) and `DESIGN.md` (normative layout, typography and copy). Read both before any task.

## Global Constraints

- `packages/core` has no runtime dependencies and no DOM access; `view.ts` is pure (no `window`, no `navigator`, no timers).
- Both apps render the same DOM structure, labels, ids and `data-testid` values; the E2E suite has no per-app branches.
- Standard Tailwind scales only, 8px grid, no bracketed arbitrary values, no `clamp()`; the only named utility added is `grid-cols-scale` (`grid-template-columns: 6rem minmax(0, 1fr)`) in `tokens.css`.
- DOM order = visual order = focus order at every breakpoint (WCAG 2.4.3).
- The first paint is server-rendered from the URL with `parsePaletteQuery` (both apps).
- Pair names come from the core (`PairResult.label`): "Text on background", "Label on primary", "Primary against background", "Label on secondary", "Accent against background", "Accent as text". The Fix accessible name is `Fix ` + the label in lowercase ("Fix accent against background").
- Copy (exact): messages "<Role> set to #HEX.", "Can't fix without breaking <pair label> and N more." ("and N more" only when N ≥ 1), "Theme copied.", "Copy failed. Select the code and copy it."; error "Enter 3 or 6 hex digits, like 1A2B3C."; hint "Hex, like #1A2B3C or #ABC".
- The message slot (`min-h-12`) and each field's error line (`min-h-4`) are always rendered, so nothing shifts when they fill.
- No commit is pushed until Task 8; the E2E suite is red on purpose between Task 3 and Task 5.
- Git: Conventional Commits, one line, no body; never Co-Authored-By, trailers or any mention of Claude or AI in commits, code, comments or docs.

## Review Focus

1. A partial hex in any role ("#12" in Primary) keeps every pair, scale, preview color and export line on the last valid color: no `NaN`, no empty row, the theme does not flash. (Task 1 test 7, Task 3 test `contrast: partial hex keeps the last valid palette`.)
2. Fix on a pair that cannot be fixed leaves the palette unchanged, shows the blocked message, and does not move the table. (Task 1 test 9, Task 3 test `fix: blocked fix keeps the layout`.)
3. Swap after a fix carries both seed and active of text and background, so the scales follow. (Task 1 test 5.)
4. Malformed and legacy URLs (`?fg=777&bg=fff`, `?primary=zzz&level=x`) load with server-rendered colors and no crash. (Task 3 test `contrast: legacy and malformed urls load`.)
5. Turning Accent as text off while "Accent as text" is the pair in focus moves the focus to "Text on background". (Task 1 test 6.)

---

### Task 1: Core view layer

**Files:**

- Create: `packages/core/src/view.ts`
- Test: `packages/core/src/view.test.ts`
- Modify: `packages/core/src/color.ts` (add `verdictForRatio`; `verdict` calls it), `packages/core/src/index.ts` (export `./view`)

**Interfaces:**

- Consumes: `Palette`, `PaletteOptions`, `PairId`, `Role`, `ROLES`, `checkPalette`, `paletteVerdict`, `fixPair`, `labelColorFor` (palette.ts); `scaleFor`, `annotateScale` (scale.ts); `toTailwindTheme` (export.ts); `buildPaletteQuery` (url-state.ts); `deriveTheme`, `themeToCssVars` (theme.ts); `formatRatio`, `parseHex`, `toHex` (color.ts).
- Produces:
  - `verdictForRatio(ratio: number): string` (same four sentences as `verdict`).
  - `type ViewState = { palette: Palette; options: PaletteOptions; drafts: Record<Role, string>; focus: PairId; message: string }`
  - `initialViewState(palette: Palette, options: PaletteOptions): ViewState` (drafts = active hex, focus `text-on-background`, message `""`).
  - `type ViewAction = { type: "draft"; role: Role; text: string } | { type: "pick"; role: Role; hex: string } | { type: "step"; role: Role; hex: string } | { type: "swap" } | { type: "level"; level: Level } | { type: "accentAsText"; on: boolean } | { type: "focus"; pair: PairId } | { type: "fix"; pair: PairId } | { type: "copied"; ok: boolean }`
  - `reduce(state: ViewState, action: ViewAction): ViewState`
  - `paletteView(state: ViewState): PaletteView`, where `PaletteView` is:
    - `cssVars: Record<string, string>` (the `--cc-*` vars plus `--cc-button` and `--cc-button-label`)
    - `colorScheme: "light" | "dark"` (surface luminance below 0.18 is dark, as today)
    - `fields: { role; id: string; label: string; draft: string; invalid: boolean; error: string; pickerHex: string }[]` (`id` = `role-<role>`, `pickerHex` lowercase active)
    - `options: PaletteOptions`
    - `paletteVerdict: string`
    - `focus: { pair: PairId; label: string; ratio: string; verdict: string }` (`ratio` like `"16.09"`, no `:1`)
    - `pairs: { id: PairId; label: string; ratio: string; minimum: string; meta: string; pass: boolean; focused: boolean; fixLabel: string }[]` (`ratio` `"5.56:1"`, `minimum` `"4.5:1"`, `meta` `"5.56:1 · min 4.5:1"`)
    - `liveSummary: string` (`"<label>, <ratio> to 1. <paletteVerdict>."`)
    - `message: string`
    - `scales: { role; label: string; steps: { name: StepName; hex: string; ratio: string; use: Use; useLabel: "AAA" | "AA" | "Large · UI" | "Decor"; checked: boolean; tabbable: boolean; ariaLabel: string }[] }[]`
    - `preview: { text; background; primary; primaryLabel; secondary; secondaryLabel; accent: string; highlight: "copy" | "panel" | "save" | "chip" | "link" }`
    - `exportText: string`
    - `query: string`

- [ ] **Step 1: Write the failing tests** in `view.test.ts`:
  1. `paletteView(initialViewState(DEFAULT_PALETTE, DEFAULT_PALETTE_OPTIONS))`: `paletteVerdict` is `"Passes AA · 6 of 6 pairs"`; `focus` is `{ pair: "text-on-background", ratio: "16.09", verdict: "Passes AAA for all text." }`; `pairs.length` is 6; `liveSummary` is `"Text on background, 16.09 to 1. Passes AA · 6 of 6 pairs."`; `exportText` equals `toTailwindTheme(DEFAULT_PALETTE, DEFAULT_PALETTE_OPTIONS)`; `query` equals `buildPaletteQuery(...)` of the same.
  2. `draft` with a valid hex ("777") sets that role's seed and active to `#777777`, draft keeps the typed text, message clears.
  3. `pick` sets seed and active and draft to the picked hex in uppercase.
  4. `step` sets only `active` (seed unchanged) and the draft; the scale of that role marks that step `checked` and `tabbable`; a role whose active is off its scale has no checked step and step 50 is `tabbable`.
  5. `swap` exchanges the whole `RoleColor` (seed and active) and the drafts of text and background.
  6. `accentAsText` off while focus is `accent-as-text`: focus becomes `text-on-background`, `pairs.length` is 5; `level` AAA: the text-on-background `minimum` is `"7:1"`, primary-against-background stays `"3:1"`.
  7. Review focus 1: `draft` "#12" in primary: field `invalid` true, `error` is the exact error copy, palette unchanged, no string in the whole `paletteView` output (JSON) contains `NaN`.
  8. `fix` on accent-against-background of a palette with accent `#F97316`: accent active changes, seed does not, the pair passes, `message` is `"Accent set to #<HEX>."`, focus becomes that pair.
  9. Review focus 2: `fix` on a blocked pair (reuse the blocked fixture from `palette.test.ts`: text `#CCCCCC` with primary `#303030`) leaves the palette equal and sets the message `"Can't fix without breaking <label>…"` with the exact copy rule.
  10. `copied` ok/failed set the two exact copy messages; any other action clears the message.
  11. Preview `highlight` maps: text-on-background → copy, label-on-secondary → panel, label-on-primary and primary-against-background → save, accent-against-background → chip, accent-as-text → link.
  12. Chrome buttons: with the default palette `--cc-button` is the primary active and `--cc-button-label` its label color; with primary `#93C5FD` on `#FAFAF7` and text `#1C1D22` (label-on-primary passes) it is still primary; with a palette where label-on-primary fails it is ink on surface.
  13. The background scale is annotated against the text active, the others against the background active (check one ratio of each).
- [ ] **Step 2: Run** `bun run --filter @contrast-check/core test` — Expected: FAIL (module missing).
- [ ] **Step 3: Implement** `verdictForRatio` in `color.ts` and `view.ts`. `reduce` never mutates; unknown pairs in `fix`/`focus` return the state unchanged.
- [ ] **Step 4: Run** the core tests and `bun run typecheck` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: add a pure view layer for the palette screen`

### Task 2: Theme and tokens for the new screen

**Files:**

- Modify: `packages/core/src/theme.ts`, `packages/core/src/theme.test.ts`, `packages/core/src/styles/tokens.css`, `packages/core/src/lightness.ts`, `packages/core/src/color.ts`

**Interfaces:**

- Produces: `Theme` without `tint`; `themeToCssVars` without `--cc-tint`; tokens: `--color-button: var(--cc-button)`, `--color-button-label: var(--cc-button-label)` in `@theme inline` with fallbacks in `:root`; utility `grid-cols-scale`.

- [ ] **Step 1: Update tests:** theme tests no longer expect `tint`; a test asserts `themeToCssVars` keys are exactly `--cc-surface`, `--cc-ink`, `--cc-ink-muted`, `--cc-line`, `--cc-hairline`.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement:** remove tint and `pickTint`; move `suggestTextColor` from `color.ts` to `lightness.ts` (breaks the import cycle; the export from the index stays the same); in `tokens.css` remove `--cc-tint`, `--color-tint`, `--animate-flash` and its keyframes and `grid-cols-actions`, add `grid-cols-scale` with a comment like the old one, add the two button colors. The apps still compile: if the old components use `tint` or `animate-flash`, delete those classes there (they are rewritten in Tasks 4 and 5).
- [ ] **Step 4: Run** core tests, `bun run typecheck`, `bun run lint` — Expected: PASS.
- [ ] **Step 5: Commit** `refactor: drop the tint and flash tokens and add the scale grid`

### Task 3: E2E contract (written before the UI)

**Files:**

- Rewrite: `e2e/helpers.ts`, `e2e/contrast.spec.ts`, `e2e/keyboard.spec.ts`, `e2e/a11y.spec.ts`
- Create: `e2e/fix.spec.ts`, `e2e/scale.spec.ts`, `e2e/export.spec.ts`

**Interfaces (the contract both apps implement):**

- Inputs by label: "Text", "Background", "Primary", "Secondary", "Accent" (exact); pickers "<Role> color picker".
- Controls: button "Swap text and background"; select labelled "Level"; `role="switch"` named "Accent as text"; pair buttons named by the pair label with `aria-pressed`; Fix buttons "Fix <label lowercase>"; radio groups named "<Role> scale"; button "Copy".
- `data-testid`: `app-root`, `focus-ratio` (text like `16.09:1`), `focus-verdict`, `message`, `live-summary`, `palette-verdict`, `pair-<PairId>` (the `<tr>`), `preview`, `export-code`.
- Helpers: `field(page, role)`, `focusRatio(page): Promise<number>`, `pairRow(page, id)`.

- [ ] **Step 1: Write the tests:**
  - `contrast`: default page shows `palette-verdict` "Passes AA · 6 of 6 pairs" and `focus-ratio` "16.09:1"; filling Text `#000000` and Background `#FFFFFF` gives "21.00:1"; invalid hex sets `aria-invalid="true"` and the description contains "Enter 3 or 6 hex digits"; swap exchanges Text and Background values; Level AAA shows "7:1" in the text-on-background row; the switch off removes `pair-accent-as-text`; the URL contains `text=000000` after typing; `partial hex keeps the last valid palette` (Review focus 1: Primary "#12", 6 rows still show ratios, `export-code` has no "NaN"); `legacy and malformed urls load` (Review focus 4: `/?fg=777&bg=fff` shows Text `#777777`; `/?primary=zzz&level=x` shows the default Primary and AA).
  - `fix`: `/?primary=93c5fd&accent=f97316` shows "Fails AA · 3 of 6 pairs fail"; clicking "Fix accent against background" makes that row Pass, the message starts with "Accent set to #", rows that passed before still pass, the URL has `accent=f97316.`; `blocked fix keeps the layout` (Review focus 2): the bounding box `y` of `pair-text-on-background` is the same before and after the message appears (use any Fix that sets a message).
  - `scale`: in "Primary scale" the step "600" is checked by default; ArrowRight moves focus and selection to "700", the Primary input shows its hex, `focus-ratio` changes when Primary is the pair in focus.
  - `export`: `export-code` contains `@theme {` and `--color-primary-label`; with clipboard permissions granted, Copy sets the message "Theme copied.".
  - `keyboard`: Tab order from the top: Text, Text color picker, Background, its picker, Primary, its picker, Secondary, its picker, Accent, its picker, Swap, Level, Accent as text, the first pair button; Enter on a pair button sets `aria-pressed="true"` and the focus label.
  - `a11y`: no axe violations on the default page, with an invalid hex, and on `/?primary=93c5fd&accent=f97316` excluding `[data-testid="preview"]`; on a dark palette (`/?text=f5f5f4&background=12151c`).
- [ ] **Step 2: Run** `bun run test:e2e` — Expected: FAIL in both projects (the old UI has none of this).
- [ ] **Step 3: Commit** `test: rewrite the e2e suite for the palette screen` (not pushed).

### Task 4: Next app

**Files:**

- Modify: `apps/next/src/app/page.tsx`
- Create in `apps/next/src/components/`: `palette-app.tsx` (client; `useReducer(reduce, …)`, URL sync, `<html>` mirror, clipboard), `palette-fields.tsx`, `palette-actions.tsx`, `pair-results.tsx` (focus block, table, live summary), `scale-strips.tsx` (radiogroups; arrow, Home and End dispatch `step` and move focus), `palette-preview.tsx`, `theme-export.tsx`
- Delete: `contrast-checker.tsx`, `color-field.tsx`, `results.tsx`, `preview.tsx`, `status-badge.tsx`, `suggest-panel.tsx`

**Interfaces:** Consumes `initialViewState`, `reduce`, `paletteView`, `parsePaletteQuery` and the contract of Task 3. Classes and structure: exactly `DESIGN.md` section 5.

- [ ] **Step 1: Run** `bunx playwright test --project=next` — Expected: FAIL (from Task 3).
- [ ] **Step 2: Implement** the components; `page.tsx` reads `searchParams` with `parsePaletteQuery` and passes the initial state. Consult Context7 for any Next 16 / React 19 API you use.
- [ ] **Step 3: Run** `bunx playwright test --project=next`, `bun run typecheck`, `bun run lint` — Expected: PASS.
- [ ] **Step 4: Commit** `feat: build the palette screen in the next app`

### Task 5: Nuxt app

**Files:**

- Modify: `apps/nuxt/app/app.vue`
- Create in `apps/nuxt/app/components/`: `PaletteApp.vue`, `PaletteFields.vue`, `PaletteActions.vue`, `PairResults.vue`, `ScaleStrips.vue`, `PalettePreview.vue`, `ThemeExport.vue` (same split and DOM as Task 4)
- Delete: `ContrastChecker.vue`, `ColorField.vue`, `ContrastResults.vue`, `ColorPreview.vue`, `StatusBadge.vue`, `SuggestPanel.vue`

- [ ] **Step 1: Run** `bunx playwright test --project=nuxt` — Expected: FAIL.
- [ ] **Step 2: Implement**; `app.vue` reads the URL with `useRequestURL()` and `parsePaletteQuery`. Consult Context7 for Nuxt 4 / Vue 3.5 APIs.
- [ ] **Step 3: Run** `bun run test:e2e` (both projects), `bun run typecheck`, `bun run lint` — Expected: PASS, the same test count in both projects.
- [ ] **Step 4: Commit** `feat: build the palette screen in the nuxt app`

### Task 6: Remove what the old screen needed

**Files:** `packages/core/src/url-state.ts` and its tests, `packages/core/src/color.ts` and its tests, `packages/core/src/index.ts`

- [ ] **Step 1:** List every core export no app, script or test of a kept function imports (`rg` over `apps/`, `scripts/`, `e2e/`). Expected candidates: `DEFAULT_FG`, `DEFAULT_BG`, `hexFromParam`, `buildQuery`, `summarize`, `evaluate`, `TARGET_THRESHOLDS`. Show the list before deleting.
- [ ] **Step 2:** Delete the unused ones and their tests; keep `verdict` only if something still uses it, otherwise keep `verdictForRatio` alone.
- [ ] **Step 3: Run** `bun run test`, `bun run typecheck`, `bun run lint`, `bun run test:e2e` — Expected: PASS.
- [ ] **Step 4: Commit** `refactor: remove the two-color checker api`

### Task 7: README and screenshots

**Files:** `README.md`, `scripts/screenshots.ts`, `docs/screenshot-*.png`

- [ ] **Step 1:** Update `scripts/screenshots.ts` shots to: default palette (1280×900), the failing palette `?primary=93c5fd&accent=f97316`, a dark palette `?text=f5f5f4&background=12151c`, and mobile 390×844.
- [ ] **Step 2: Run** `bun run screenshots` and look at every image.
- [ ] **Step 3:** Rewrite the README sections that describe the two-color checker and the Suggest button: what the palette screen does, the pairs, Fix, scales, export; keep every claim true to the code.
- [ ] **Step 4: Run** `bun run lint` — Expected: PASS.
- [ ] **Step 5: Commit** `docs: describe the palette screen`

### Task 8: Ship

- [ ] **Step 1: Run** `bun run lint && bun run typecheck && bun run test && bun run test:e2e && bun run build` — Expected: all PASS.
- [ ] **Step 2:** `git push`, watch CI until green, then check that both Vercel deployments of `main` succeeded and open both URLs.
- [ ] **Step 3:** Report: the outputs of Step 1 with test counts, `git log --oneline` of the new commits, the CI run, both deployment URLs, and every decision made outside this plan.
