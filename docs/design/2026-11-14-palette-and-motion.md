# Palette builder and motion: design

Status: draft for approval. Date: 2026-11-14.
Repository: `contrast-check` (Bun monorepo: `packages/core`, `apps/next`, `apps/nuxt`, `e2e/`).
Governance documents that remain authoritative unless this design changes them explicitly: `PRODUCT.md`, `DESIGN.md`.

## 1. Intent

Contrast Check today tests one pair of colors (text and background), and the page repaints itself with that pair. The next version turns it into a **palette builder whose output is validated for contrast and ready to use**: the person builds a palette by role, every pair those roles form in a real interface is checked at WCAG AA or higher, failing pairs can be fixed in one click, and the palette is exported as Tailwind CSS v4 tokens.

Why: the project is a public portfolio piece for a Design Engineer whose differentiator is accessibility. Tools like Scale (hihayk.github.io/scale) generate beautiful color scales; tools like Realtime Colors (realtimecolors.vercel.app) preview a palette on a page. Neither guarantees the result is accessible. This project's argument is: **a palette where every step already says what it may be used for, and every role pair is proven to pass**. The page keeps being the preview (Realtime Colors), the visual language keeps being minimal and typographic (Scale), and motion gives the tool an identity ("color proof", section 8).

Success: someone lands on the page, edits five colors, sees at a glance which pairs fail, fixes them, and leaves with a pasteable `@theme` block, without reading instructions; a recruiter sees the same in a 20-second video.

## 2. Goals, non-goals, anti-goals

Goals

- Five roles: text, background, primary, secondary, accent.
- Pair validation at AA by default, with a switch to require AAA on text pairs.
- One-click fix per failing pair, using the project's own lightness-search algorithm.
- An 11-step scale (50 to 950) per role, each step annotated with its contrast against the background and its allowed use.
- Export to a Tailwind CSS v4 `@theme` block.
- The page itself is painted with the palette.
- Motion with a defined art direction, implemented once and shared by both apps.
- Parity between the Next and Nuxt apps, as today.

Non-goals (v1)

- Dark mode / a second palette per mode (the structure must allow adding it later).
- Saving palettes, accounts, multiple palettes.
- APCA or any metric other than WCAG 2.x contrast ratio.
- Color-blindness simulation.
- Export formats other than Tailwind v4 `@theme`.

Anti-goals (failure even if it "works")

- A palette marked as passing while a pair it implies fails.
- Animation on typing, picker dragging or keyboard navigation.
- Motion that is purely decorative or that blocks interaction.
- The interface itself becoming unreadable for any palette.
- The two apps drifting apart in behavior or look.
- Anything resembling shadcn/ui; cards; nested cards.

## 3. Constraints (carried over, still binding)

- `DESIGN.md` scale rules: standard Tailwind scales only, 8px grid, no arbitrary values in brackets, no `clamp()`, mobile-first variants (`md`, `lg`, `lg:tall`). Named `@utility` entries in `tokens.css` are the sanctioned escape hatch and must be documented.
- Accessibility: chrome text at least 4.5:1, control boundaries at least 3:1, visible focus, focus order equals visual order, `prefers-reduced-motion` honored, semantic HTML, forced-colors fallbacks for custom controls.
- The interface chrome is always readable: it uses the derived theme (section 6.4). Only the preview shows exact colors.
- `packages/core` stays pure TypeScript with no runtime dependencies and no DOM access.
- Commits: Conventional Commits, one line, no body.
- Each phase ends with lint, typecheck, unit tests, E2E and build passing, then push and green CI. The published site is never broken between phases.

## 4. Approaches considered

- **A. Phased on the current monorepo (chosen).** Core logic first (pure, tested), then a mockup for approval, then the UI rewrite in both apps, then motion, then the video. Each phase ships green. Trade-off: the live site keeps the old UI while the core grows underneath.
- B. Rewrite everything at once. Rejected: longest and riskiest, nothing reviewable along the way.
- C. Build the palette on a new route and migrate later. Rejected: contradicts the decision that the palette is the center of the product; two tools would coexist.

Library for motion: **GSAP (chosen)** over Motion (motion.dev). GSAP is framework-agnostic, so one implementation can live in a shared package used by both apps; its Flip, SplitText and MorphSVG plugins are free since the Webflow acquisition. Motion would need two implementations (`motion` for React, `motion-v` for Vue/Nuxt). CSS alone was rejected for the signature moments (digit roll, ink reveal, flip), and kept for trivial states (press scale, hover).

## 5. Decisions on the core (`packages/core`)

### 5.1 Color math

- Add OKLCH <-> sRGB conversion (via OKLab and linear sRGB) implemented in the core, no dependency. Unit tests against published reference values (at least black, white, pure sRGB primaries and two mid tones), round-trip tolerance documented in the tests.
- Gamut mapping: when an OKLCH color is out of sRGB, reduce chroma (keep L and H) by binary search until it fits.

### 5.2 Roles and pairs

- `Palette = { text, background, primary, secondary, accent }`, each a hex color.
- `Level = "AA" | "AAA"`. AA thresholds: text 4.5, UI 3. AAA raises text pairs to 7; UI stays 3 (WCAG has no AAA for non-text contrast).
- Pairs checked (function `checkPalette(palette, options)` with `options = { level, accentAsText }` returns each pair with ratio, threshold, pass, and the role a fix would change):

| Id                          | Pair                                        | Minimum (AA / AAA) | Role changed by Fix | Why                                             |
| --------------------------- | ------------------------------------------- | ------------------ | ------------------- | ----------------------------------------------- |
| `text-on-background`        | text over background                        | 4.5 / 7            | text                | body text                                       |
| `label-on-primary`          | primary button label over primary           | 4.5 / 7            | primary             | button labels are text                          |
| `primary-vs-background`     | primary against background                  | 3 / 3              | primary             | filled control boundary (WCAG 1.4.11)           |
| `label-on-secondary`        | secondary button label over secondary       | 4.5 / 7            | secondary           | button labels are text                          |
| `accent-vs-background`      | accent against background                   | 3 / 3              | accent              | UI and graphics                                 |
| `accent-as-text` (optional) | accent used as text (links) over background | 4.5 / 7            | accent              | only when `accentAsText` is true (default true) |

- Button label color: for primary and secondary, the label is whichever of `background` and `text` has the higher contrast against that fill. The pair fails only if neither reaches the threshold.
- Secondary buttons are always drawn with a 1px boundary in the chrome `line` tone (at least 3:1 against the background), so the secondary fill itself is not required to reach 3:1 against the background. This mirrors common "subtle secondary" palettes (as in Realtime Colors) without breaking 1.4.11.
- `accentAsText` is part of the palette state (design call): it is in the URL, in `checkPalette`, in the export header comment, and in the defaults test, so a shared link always reproduces the same verdict.
- Palette verdict: "Passes AA · N of N pairs" or "Fails AA · k of N pairs fail" (and the AAA variant when the level is AAA).

### 5.3 Fix

- One lightness-search algorithm for the whole product, in **OKLCH**: keep hue and chroma (gamut-mapped), change L only, search lighter and darker directions separately (contrast is not monotonic in L), return the passing color closest to the original L, or `null` when impossible.
- This replaces the current HSL-based `suggestTextColor`. Existing unit tests are updated to the new expected values; the README section "How the suggestion works" is rewritten accordingly. `deriveTheme` uses the same search.
- `fixPair(palette, pairId, options)` returns a new palette with only the changed role updated, or `null`.
- Fix never breaks a pair that passes now (design call). The search for the changed role's L accepts a candidate only if (a) the target pair passes and (b) every other pair involving that role that passes before the fix still passes after it. Among acceptable candidates it returns the one closest to the original L. If no candidate satisfies both, it returns `null` and the UI says the pair cannot be fixed by changing that role alone (with the other role named), so the person is never sent into a loop of fixes. Unit tests cover the shared-role cases: `label-on-primary` with `primary-vs-background`, and `text-on-background` when text is the chosen label on primary or secondary.

### 5.4 Scales

- Seed and active color (design call). Each role has a **seed** (the color the person typed or picked in the color picker) and an **active color** (the one used in pairs, preview and export). The scale is always built from the seed. Selecting a scale step changes only the active color; the strip does not rebuild, so moving across steps is reversible and never drifts. Typing a hex or using the picker sets both seed and active color to that value. Fix changes only the active color.
- `scaleFor(seedHex)` returns 11 steps named 50, 100, 200 ... 900, 950.
- Generated in OKLCH with a fixed lightness ladder (builder chooses the exact values; it must be monotonic, roughly perceptually even, light at 50, dark at 950), constant hue, chroma tapering toward both ends, gamut-mapped.
- The seed is **anchored**: it replaces the step whose L is closest to it, exactly (its hex is preserved).
- Each step is annotated against the current background: ratio, and the highest allowed use: `text-aaa` (≥7), `text-aa` (≥4.5), `large-ui` (≥3), `decorative` (<3).

### 5.5 Export

- `toTailwindTheme(palette, level)` returns a Tailwind v4 CSS string:
  - an `@theme { ... }` block with `--color-<role>-<step>: oklch(L C H);` for the five roles and 11 steps;
  - semantic aliases `--color-text`, `--color-background`, `--color-primary`, `--color-secondary`, `--color-accent` pointing to the anchored step of each role;
  - a header comment with the palette verdict and level, and a trailing comment per anchored step with its ratio against the background.
- Snapshot-style unit test for a fixed palette.

### 5.6 URL state

- Query: `?text=&background=&primary=&secondary=&accent=&level=&accentText=` with each role as `seed` or `seed.active` (hex without `#`, active omitted when equal to the seed), e.g. `primary=2F5BD8.1E3A8A`.
- Backward compatible: `?fg=&bg=` still loads (as text and background), so existing shared links keep working.
- Defaults: a palette that passes AA on every pair (builder picks it; it must be shown passing in a unit test).

## 6. Decisions on the interface (both apps)

### 6.1 Structure (DOM order = focus order)

1. Header: "Contrast Check", "WCAG 2.2".
2. Palette fields: five role groups (label, hex input, circular swatch picker), then actions: Swap text/background, Level (AA/AAA), "Accent as text" switch.
3. Palette verdict line.
4. Pairs table: one row per pair (name, ratio, minimum, result icon plus word, Fix button on failing rows). Activating a row (click, or Enter/Space on the row's button) puts it "in focus".
5. Focus pair: the large ratio (existing typographic treatment) and `verdict()` sentence for the pair in focus. Default focus: `text-on-background`.
6. Scales: five strips of 11 steps (the Scale homage), each step showing its name, and its annotation as icon plus short text; selecting a step sets that role to it.
7. Preview: sample interface in exact colors (heading, paragraph, primary button, secondary button, link in accent, accent chip), directly on the surface.
8. Export: the `@theme` block in a code region with "Copy" (and the copy confirmation).
9. Footer.

The exact visual layout is decided in the mockup phase (Phase 2) and recorded in `DESIGN.md` before any UI code.

### 6.2 Accessibility specifics

- Pairs table: a real `<table>` with a caption; the Fix and focus controls are `<button>`s with names that include the pair ("Fix accent against background").
- Scales: each strip is a radio group (`role="radiogroup"`, arrow-key navigation where selection follows focus, the active step checked), name "Primary scale"; each step's accessible name includes step, hex, ratio and use. Because the strip is built from the seed, arrow navigation is reversible.
- Verdict and focus-pair changes are announced through the existing polite live region pattern (concise text only).
- Exported code region is focusable and readable; Copy reports success in the live region.

### 6.3 Contract with tests

The E2E suite is rewritten for the new interface (this is an explicit decision, not an accident). New labels, ids and `data-testid` values are defined in the UI phase and become the new contract. The axe checks (no violations; chrome passes with a failing palette, specimen/preview excluded) carry over.

### 6.4 Page painting

- Surface = background; specimen/preview = exact colors.
- Chrome = derived theme from text and background, as today (`deriveTheme`), extended so chrome buttons use primary when the label/primary pair passes and the chrome's adjusted tone otherwise. The chrome must pass the axe check for any palette.

## 7. Phases

1. **Core** (no UI change): sections 5.1 to 5.6, with unit tests; `deriveTheme` and `suggestTextColor` migrated to the OKLCH search; README "How the suggestion works" updated. Ships green.
2. **Mockup**: the new screen in the existing design canvas (mobile 390 and desktop 1307×646 at least), approved by Daniel; then `DESIGN.md` updated with the new layout and component rules.
3. **UI** in both apps, E2E rewritten, fold check: on 1307×646 the palette fields, verdict and pairs table are visible without scrolling. Ships green.
4. **Motion** (section 8). Ships green.
5. **Video** (section 9). Separate deliverable.

## 8. Motion: "color proof"

Art direction: the vocabulary of a print proof. Ink (new color spreads from where the action happened), measurement (numbers behave like an instrument), registration (hairlines draw like registration marks).

Moments:

| Moment                                                                 | Motion                                                                                                                                                         | Duration and easing                                                  |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| First load (once)                                                      | hairlines draw from the left (scaleX); the five swatches enter in sequence (scale 0.92 to 1, opacity); ratio digits rise from a mask (SplitText); verdict last | about 900ms total, stagger 40ms, strong ease-out; never blocks input |
| Palette change by a discrete action (Swap, Fix, clicking a scale step) | ink reveal: the new palette spreads as a circle from the center of the activating element over the page                                                        | about 450ms, strong ease-out                                         |
| Focus ratio changes by click                                           | odometer roll per digit; up when contrast improves, down when it worsens                                                                                       | about 300ms                                                          |
| Swap                                                                   | the two swatches exchange places along an arc (Flip)                                                                                                           | about 300ms, ease-in-out                                             |
| Fix                                                                    | the row's cross morphs into a check (MorphSVG); the role swatch slides to the new tone                                                                         | about 250ms                                                          |
| Export appears or Copy                                                 | code lines cascade in (stagger 20ms); Copy button confirms and returns                                                                                         | under 300ms                                                          |
| Typing, picker drag, keyboard navigation, hover                        | none (hover color only)                                                                                                                                        | instant                                                              |

Rules

- Input (design call): discrete actions animate the same way whether activated by pointer or by Enter/Space, with the origin always taken from the activating element's box (no pointer coordinates needed). Arrow-key movement inside a scale radio group is navigation: it changes the active color instantly with no ink reveal and no digit roll. The apps therefore only need to know "was this a scale step activated by arrow keys", which the radio group's keydown handler provides.
- Only `transform`, `opacity` and `clip-path`.
- Reduced motion (`prefers-reduced-motion: reduce`): every moment becomes an instant state change.
- Interruptible: a new action cancels or completes the running animation; no queued backlog.
- Implementation: a new workspace package `packages/motion` (DOM-dependent, GSAP as its only dependency) exporting one function per moment, each taking elements and options and returning a cleanup. Both apps call the same functions (React: `useEffect`/`useLayoutEffect` with cleanup; Vue: `onMounted`/`onBeforeUnmount`). Reduced motion via `gsap.matchMedia`. Plugins registered once in the package.
- The ink reveal may use the View Transitions API with the animation driven on the pseudo-element when supported, falling back to an instant change; the builder decides the technique as long as the result and the rules above hold.
- E2E runs with reduced motion emulated so tests are deterministic; one smoke test runs with motion on and asserts the final state.

## 9. Video (Phase 5, after the product is done)

About 20 seconds, no audio, two formats (16:9 for the README, 1:1 for LinkedIn). Real footage recorded with Playwright from the published site following a script (failing palette, page repaints, Fix, scale step, export), composed in HyperFrames (skills `hyperframes-cli` and `hyperframes-animation`) with short captions, scene transitions and an end card with the links. Requires Node 22+ and FFmpeg. Planned in its own document.

## 10. Design calls made during review

Marked "(design call)" above: seed and active color per role; Fix never breaks a passing pair; `accentAsText` is state; discrete actions animate for pointer and keyboard alike, arrow navigation never animates.

## 11. Left to the builder

- The OKLCH lightness ladder and chroma taper values (within 5.4).
- The default palette (within 5.6).
- Internal module structure of `packages/core` and `packages/motion`.
- Component decomposition in each app.
- GSAP techniques and exact timings within section 8.
- New E2E file structure.
