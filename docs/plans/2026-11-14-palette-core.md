# Palette core (Phase 1) Implementation Plan

> Execute task by task, in order. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the pure, tested core of the palette builder to `packages/core`: OKLCH math, one lightness search for the whole product, scales, role pairs, fix, Tailwind export and palette URL state. No UI changes.

**Architecture:** New focused modules in `packages/core/src` (`oklch.ts`, `lightness.ts`, `scale.ts`, `palette.ts`, `export.ts`), re-exported from `index.ts`. `suggestTextColor` and therefore `deriveTheme` move from HSL to the shared OKLCH lightness search. The two apps keep compiling and keep their current UI; their E2E suite must stay green.

**Tech Stack:** TypeScript (strict), Bun workspaces, Vitest, Biome. No new runtime dependencies.

**Spec:** `docs/design/2026-11-14-palette-and-motion.md` (sections 5.1 to 5.6 and 7, Phase 1).

## Global Constraints

- `packages/core` stays pure TypeScript: no runtime dependencies, no DOM access.
- Roles: `text`, `background`, `primary`, `secondary`, `accent`.
- Thresholds: AA text 4.5, AAA text 7, UI 3 at both levels.
- Scale step names: `50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`.
- Hex values are uppercase `#RRGGBB` everywhere in the core API; URL values are lowercase without `#`.
- The apps (`apps/next`, `apps/nuxt`) must not change behavior in this phase; `bun run test:e2e` stays green without edits to `e2e/`.
- Commits: Conventional Commits, one line, no body, no trailers.

## Review Focus

1. A gray seed (chroma 0, hue undefined) must produce finite values everywhere, never `NaN` (scale, export, fix).
2. Invalid or missing values in the palette query must fall back per role to the default, without throwing, and old links with `fg`/`bg` must still load.
3. `fixPair` on a pair that already passes must return the palette unchanged (not `null`, not a different color).
4. Level AAA must raise only the text pairs to 7; UI pairs stay at 3.
5. Pure black or pure white seeds and backgrounds must not produce out-of-gamut or duplicate-only scales (anchoring still exact, 11 valid hexes).

Each line has a test in the task that owns the code (marked "Review focus").

---

### Task 1: OKLCH conversion and gamut mapping

**Files:**

- Create: `packages/core/src/oklch.ts`
- Test: `packages/core/src/oklch.test.ts`

**Interfaces:**

- Produces:
  - `type Oklch = { l: number; c: number; h: number }` (l in 0..1, c ≥ 0, h in degrees 0..360; h is 0 when c is 0)
  - `rgbToOklch(rgb: Rgb): Oklch`
  - `oklchToRgb(color: Oklch): Rgb` (gamut-mapped by chroma reduction, channels rounded to 0..255)
  - `formatOklch(color: Oklch): string` → `"oklch(L C H)"` with L to 3 decimals, C to 4, H to 2 (e.g. `"oklch(0.628 0.2577 29.23)"`)

- [ ] **Step 1: Write the failing tests** (`describe("rgbToOklch")`, `describe("oklchToRgb")`, `describe("formatOklch")`)
  - `#FFFFFF` → l ≈ 1.000, c < 0.0005
  - `#000000` → l ≈ 0.000, c < 0.0005
  - `#FF0000` → l ≈ 0.6280, c ≈ 0.2577, h ≈ 29.23
  - `#00FF00` → l ≈ 0.8664, c ≈ 0.2948, h ≈ 142.50
  - `#0000FF` → l ≈ 0.4520, c ≈ 0.3132, h ≈ 264.05
  - `#808080` → l ≈ 0.5999, c < 0.0005, h === 0
  - tolerance: 0.001 for l and c, 0.1 for h
  - round trip: for `#FF3211`, `#5B7BB5`, `#12151C`, `#777777`, `toHex(oklchToRgb(rgbToOklch(x))) === x`
  - out of gamut: `oklchToRgb({ l: 0.7, c: 0.4, h: 150 })` returns channels within 0..255 and keeps l within 0.01 and h within 1 degree of the input (checked by converting back)
  - `formatOklch(rgbToOklch(parseHex("#FF0000")!))` equals `"oklch(0.628 0.2577 29.23)"`

- [ ] **Step 2: Run** `bun run --filter @contrast-check/core test` — Expected: FAIL (module missing)
- [ ] **Step 3: Implement** in `oklch.ts`: sRGB → linear → OKLab (Ottosson matrices) → OKLCH and back. Gamut mapping: if the linear RGB of the target falls outside 0..1, binary-search chroma between 0 and the target (24 iterations) for the largest in-gamut value, keeping l and h.
- [ ] **Step 4: Run** the core tests — Expected: PASS
- [ ] **Step 5: Commit** `feat: add oklch conversion with gamut mapping`

### Task 2: One lightness search, used by the suggestion and the theme

**Files:**

- Create: `packages/core/src/lightness.ts`
- Modify: `packages/core/src/color.ts` (replace the HSL search in `suggestTextColor`; remove `rgbToHsl`, `hslToRgb` and the `Hsl` type if nothing else uses them)
- Modify: `packages/core/src/color.test.ts`, `packages/core/src/theme.test.ts` (hue checks move to OKLCH hue)
- Modify: `README.md` (section "How the suggestion works")
- Test: `packages/core/src/lightness.test.ts`

**Interfaces:**

- Consumes: `rgbToOklch`, `oklchToRgb` (Task 1); `contrastRatio`, `toHex` (existing)
- Produces: `closestPassingLightness(base: Rgb, against: Rgb, threshold: number, accept?: (candidate: Rgb) => boolean): Rgb | null` — keeps the OKLCH hue and chroma of `base` (gamut-mapped), varies only L, returns the passing candidate (contrast with `against` ≥ `threshold` and `accept(candidate)` true) whose L is closest to `base`'s L; returns `base` itself when it already satisfies both; `null` when none does.
- `suggestTextColor(fg, bg, target)` keeps its signature and return type (`Suggestion | null`).

- [ ] **Step 1: Write the failing tests** (`describe("closestPassingLightness")`)
  - returns the base unchanged (same hex) when `#000000` vs `#FFFFFF` at 4.5
  - for `#777777` on `#FFFFFF` at 4.5: result ratio ≥ 4.5 and result is darker than the base (lower OKLCH l)
  - for `#5B7BB5` on `#12151C` at 4.5: result ratio ≥ 4.5, lighter than the base, OKLCH hue within 2 degrees of the base
  - returns `null` for `#888888` on `#777777` at 7
  - with `accept = (c) => toHex(c) !== <the unconstrained result>` the result differs from the unconstrained one and still passes (proves the constraint is honored)
- [ ] **Step 2: Run** the core tests — Expected: FAIL
- [ ] **Step 3: Implement** by sampling L from 0 to 1 in steps of 0.001 (1001 candidates; no binary search, because `accept` can make the predicate non-monotonic), converting each with `oklchToRgb`, filtering by threshold and `accept`, and choosing the minimum |L − base L|; tie goes to the darker candidate.
- [ ] **Step 4: Rewrite `suggestTextColor`** to call `closestPassingLightness(fg, bg, TARGET_THRESHOLDS[target])`; update its doc comment (OKLCH, sampled search, why not binary search).
- [ ] **Step 5: Update existing tests**: in `color.test.ts` and `theme.test.ts`, "preserves hue" assertions compare OKLCH hue (tolerance 2 degrees) instead of HSL hue; keep every other assertion (thresholds, nulls, exact-color cases). Update the expected hex in any test that pinned an HSL result, reading the new value from the implementation and checking it still meets the threshold.
- [ ] **Step 6: Run** `bun run --filter @contrast-check/core test`, then `bun run test:e2e` — Expected: all PASS (apps unchanged)
- [ ] **Step 7: README**: rewrite "How the suggestion works" for the OKLCH sampled search (keep hue and chroma, vary perceptual lightness, closest passing candidate, why sampling).
- [ ] **Step 8: Commit** `refactor: search lightness in oklch for suggestions and the theme`

### Task 3: Scales from a seed

**Files:**

- Create: `packages/core/src/scale.ts`
- Test: `packages/core/src/scale.test.ts`

**Interfaces:**

- Consumes: `rgbToOklch`, `oklchToRgb`, `formatOklch` (Task 1); `contrastRatio`, `toHex`, `parseHex`
- Produces:
  - `const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const`; `type StepName = (typeof SCALE_STEPS)[number]`
  - `type ScaleStep = { name: StepName; hex: string; oklch: string; anchored: boolean }`
  - `scaleFor(seedHex: string): ScaleStep[]` (11 steps, light to dark)
  - `type Use = "text-aaa" | "text-aa" | "large-ui" | "decorative"`
  - `type AnnotatedStep = ScaleStep & { ratio: number; use: Use }`
  - `annotateScale(scale: ScaleStep[], backgroundHex: string): AnnotatedStep[]`

- [ ] **Step 1: Write the failing tests**
  - `scaleFor("#2F5BD8")` has 11 steps named 50..950 in order, OKLCH l strictly decreasing
  - exactly one step has `anchored: true` and its `hex` equals `"#2F5BD8"`
  - every step's OKLCH hue (except near-gray steps with c < 0.01) is within 2 degrees of the seed's
  - Review focus 1: `scaleFor("#808080")` returns 11 finite, valid hexes and no `oklch` string contains `NaN`
  - Review focus 5: `scaleFor("#FFFFFF")` and `scaleFor("#000000")` return 11 valid hexes, with the seed anchored exactly
  - `annotateScale(scaleFor("#2F5BD8"), "#FFFFFF")`: each `use` matches its ratio by the bands ≥7, ≥4.5, ≥3, <3
- [ ] **Step 2: Run** — Expected: FAIL
- [ ] **Step 3: Implement** with this lightness ladder (index aligned with `SCALE_STEPS`): `[0.97, 0.93, 0.87, 0.79, 0.70, 0.61, 0.52, 0.44, 0.37, 0.30, 0.24]`, constant seed hue, chroma = seed chroma × `[0.15, 0.30, 0.55, 0.80, 0.95, 1, 0.95, 0.85, 0.70, 0.55, 0.40]`, gamut-mapped by `oklchToRgb`. Anchor: replace the step whose ladder L is closest to the seed's L with the seed itself (exact hex, `anchored: true`); if the seed L lies outside the ladder range, anchor the nearest end step.
- [ ] **Step 4: Run** — Expected: PASS
- [ ] **Step 5: Commit** `feat: generate anchored oklch scales from a seed`

### Task 4: Palette, pairs and verdict

**Files:**

- Create: `packages/core/src/palette.ts`
- Test: `packages/core/src/palette.test.ts`

**Interfaces:**

- Consumes: `contrastRatio`, `parseHex` (existing)
- Produces:
  - `const ROLES = ["text", "background", "primary", "secondary", "accent"] as const`; `type Role = (typeof ROLES)[number]`
  - `type RoleColor = { seed: string; active: string }`; `type Palette = Record<Role, RoleColor>`
  - `type Level = "AA" | "AAA"`; `type PaletteOptions = { level: Level; accentAsText: boolean }`
  - `type PairId = "text-on-background" | "label-on-primary" | "primary-vs-background" | "label-on-secondary" | "accent-vs-background" | "accent-as-text"`
  - `type PairResult = { id: PairId; label: string; ratio: number; threshold: number; pass: boolean; fixRole: Role; foreground: string; backgroundColor: string }`
  - `labelColorFor(fill: string, palette: Palette): string` — whichever of `palette.background.active` and `palette.text.active` has the higher contrast with `fill`
  - `checkPalette(palette: Palette, options: PaletteOptions): PairResult[]` — pairs in the table order of spec 5.2; `accent-as-text` only when `options.accentAsText`
  - `paletteVerdict(results: PairResult[], level: Level): string`

- [ ] **Step 1: Write the failing tests**
  - a palette built from the spec's example values returns 6 results with `accentAsText: true` and 5 with `false`, in the spec's order
  - thresholds at AA: 4.5, 4.5, 3, 4.5, 3, 4.5; Review focus 4: at AAA: 7, 7, 3, 7, 3, 7
  - `fixRole` per pair: text, primary, primary, secondary, accent, accent
  - `labelColorFor("#2F5BD8", palette)` returns the background when the background has higher contrast with it than the text (use a white background and near-black text)
  - `paletteVerdict`: all passing → `"Passes AA · 6 of 6 pairs"`; two failing → `"Fails AA · 2 of 6 pairs fail"`; the same strings with `AAA` at that level
  - ratios equal `contrastRatio` of the pair's `foreground` and `backgroundColor`
- [ ] **Step 2: Run** — Expected: FAIL
- [ ] **Step 3: Implement** in `palette.ts`; pair labels: `"Text on background"`, `"Label on primary"`, `"Primary against background"`, `"Label on secondary"`, `"Accent against background"`, `"Accent as text"`. All pairs use each role's `active` color.
- [ ] **Step 4: Run** — Expected: PASS
- [ ] **Step 5: Commit** `feat: check palette role pairs at aa or aaa`

### Task 5: Fix without breaking passing pairs

**Files:**

- Modify: `packages/core/src/palette.ts`
- Test: `packages/core/src/palette.test.ts`

**Interfaces:**

- Consumes: `closestPassingLightness` (Task 2); `checkPalette` (Task 4)
- Produces: `type FixResult = { palette: Palette } | { palette: null; blockedBy: PairId[] }`; `fixPair(palette: Palette, pairId: PairId, options: PaletteOptions): FixResult` — changes only `palette[fixRole].active`; never `seed`

- [ ] **Step 1: Write the failing tests**
  - Review focus 3: fixing a pair that already passes returns `{ palette }` deep-equal to the input
  - fixing `text-on-background` for `#777777` on `#FFFFFF` returns a palette whose text active passes 4.5 and whose `text.seed` is unchanged
  - shared role: a palette where primary fails `label-on-primary` but passes `primary-vs-background`; after the fix both pass
  - shared role across roles: text is the chosen label on primary and `text-on-background` fails; after fixing it, `label-on-primary` still passes (or, if no candidate keeps it passing, the result is `{ palette: null, blockedBy: ["label-on-primary"] }`); cover both outcomes with two palettes
  - after any successful fix, every pair that passed before still passes (property-style check over the spec's example palette and two failing palettes)
- [ ] **Step 2: Run** — Expected: FAIL
- [ ] **Step 3: Implement** with `closestPassingLightness(currentActive, pairBackground, threshold, accept)`, where `accept` rebuilds the palette with the candidate as the role's active color and returns true only if every pair involving that role that passed before still passes. When the result is `null`, run the search once more without `accept` to find which previously passing pairs the unconstrained candidate would break, and return them as `blockedBy`. For `text-on-background` and the `label-on-*` pairs, the "background" of the search is the pair's `backgroundColor`.
- [ ] **Step 4: Run** — Expected: PASS
- [ ] **Step 5: Commit** `feat: fix a pair without breaking the ones that pass`

### Task 6: Tailwind v4 export

**Files:**

- Create: `packages/core/src/export.ts`
- Test: `packages/core/src/export.test.ts`

**Interfaces:**

- Consumes: `scaleFor`, `annotateScale` (Task 3); `checkPalette`, `paletteVerdict` (Task 4); `rgbToOklch`, `formatOklch` (Task 1)
- Produces: `toTailwindTheme(palette: Palette, options: PaletteOptions): string`

- [ ] **Step 1: Write the failing tests**
  - output starts with a comment containing the palette verdict, the level and `accent as text: on|off`
  - contains `@theme {` and 55 lines matching `--color-(text|background|primary|secondary|accent)-(50|100|…|950): oklch(…);`, scales built from each role's `seed`
  - contains the five aliases `--color-<role>: var(--color-<role>-<step>);`, where `<step>` is the step whose hex equals the role's `active` color; when `active` is not a step of the seed's scale (after a Fix), the alias is the literal `oklch(...)` of the active color
  - each alias line ends with a comment for its role, ratios from `checkPalette` to 2 decimals: text `/* <text-on-background>:1 on background */`; background `/* surface */` (no ratio); primary `/* label <label-on-primary>:1, <primary-vs-background>:1 vs background */`; secondary `/* label <label-on-secondary>:1 */`; accent `/* <accent-vs-background>:1 on background */`
  - right after the five aliases, `--color-primary-label: var(--color-text);` or `var(--color-background);`, and the same for `--color-secondary-label`, as `labelColorFor` picks for each role's active color; one test with a light primary (label is text) and one with a dark primary (label is background)
  - Review focus 1: a palette with gray seeds produces no `NaN`
  - snapshot test for one fixed palette (Vitest inline snapshot)
- [ ] **Step 2: Run** — Expected: FAIL
- [ ] **Step 3: Implement** `toTailwindTheme` in `export.ts`
- [ ] **Step 4: Run** — Expected: PASS
- [ ] **Step 5: Commit** `feat: export the palette as a tailwind v4 theme`

### Task 7: Palette URL state and defaults

**Files:**

- Modify: `packages/core/src/url-state.ts` (keep `DEFAULT_FG`, `DEFAULT_BG`, `hexFromParam`, `buildQuery` untouched for the current apps)
- Modify: `packages/core/src/index.ts` (export every new module: `oklch`, `lightness`, `scale`, `palette`, `export`)
- Test: `packages/core/src/url-state.test.ts` (create)

**Interfaces:**

- Consumes: `Palette`, `PaletteOptions`, `ROLES`, `checkPalette` (Task 4)
- Produces:
  - `DEFAULT_PALETTE: Palette` with seed = active: text `#1C1D22`, background `#FAFAF7`, primary `#2F5BD8`, secondary `#E9ECF5`, accent `#C2410C`
  - `DEFAULT_PALETTE_OPTIONS: PaletteOptions = { level: "AA", accentAsText: true }`
  - `parsePaletteQuery(params: Record<string, string | string[] | undefined>): { palette: Palette; options: PaletteOptions }`
  - `buildPaletteQuery(palette: Palette, options: PaletteOptions): string` (`?text=…&background=…&primary=…&secondary=…&accent=…&level=…&accentText=0|1`, each role `seed` or `seed.active`, lowercase hex without `#`, `.active` omitted when equal to the seed)

- [ ] **Step 1: Write the failing tests**
  - `checkPalette(DEFAULT_PALETTE, DEFAULT_PALETTE_OPTIONS)` has every pair passing (if a default fails, adjust that default's lightness with `fixPair` once, write the new hex here and in the spec's defaults note, and keep the test)
  - round trip: `parsePaletteQuery` of `buildPaletteQuery(p, o)` returns `p` and `o` for the default and for a palette with differing seed and active
  - `primary=2f5bd8.1e3a8a` parses to seed `#2F5BD8`, active `#1E3A8A`
  - Review focus 2: invalid values per role (`text=zzz`, `primary=12345`, `primary=2f5bd8.xyz`) fall back to that role's default (for a bad active only, active = seed); unknown `level` falls back to `AA`; `accentText` other than `0`/`1` falls back to `true`; nothing throws
  - Review focus 2: legacy `?fg=777777&bg=ffffff` loads text `#777777` and background `#FFFFFF`, other roles default
- [ ] **Step 2: Run** — Expected: FAIL
- [ ] **Step 3: Implement** both functions in `url-state.ts` and update `index.ts`
- [ ] **Step 4: Run** `bun run lint`, `bun run typecheck`, `bun run test`, `bun run test:e2e`, `bun run build` — Expected: all PASS, E2E unchanged
- [ ] **Step 5: Commit** `feat: read and write palette state in the url`

### Task 8: Ship Phase 1

**Files:**

- Commit: `docs/design/2026-11-14-palette-and-motion.md` and this plan, if not committed yet (first commit of the phase is preferred: `docs: add the palette and motion design and phase 1 plan`)

- [ ] **Step 1:** Confirm `git status` is clean except intended files; confirm no new runtime dependency in `packages/core/package.json`.
- [ ] **Step 2:** Push `main` and watch CI (`gh run watch`). Expected: green. On failure, report the failing step's log and stop.
