# Design

Source of truth for the visual design. Values are normative.

## 1. Concept

- **Roles**: the person chooses five colors: text, background, primary, secondary and accent. The surface is the active background.
- **Preview**: the Preview section uses the exact colors the person chose, unadjusted. It is what is being tested and may fail, so it is exempt from the contrast goals.
- **Chrome**: everything else (text, labels, borders, focus, buttons) uses a theme derived from text and background by `deriveTheme`, so it stays readable for any palette. See Theme.

Direction: minimalism in the style of Scale (hihayk.github.io/scale) combined with the idea of Realtime Colors, where the page is the preview. Mobile-first. One monospaced family. No cards, no shadows, no gradients, no glassmorphism. 1px dividers, 2px radius on controls, a circular color swatch.

## 2. Theme

Computed by `deriveTheme` in `packages/core` and exposed as CSS custom properties on the app root.

| Role             | Rule                                                                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--cc-surface`   | The chosen background.                                                                                                                                                                                                          |
| `--cc-ink`       | The chosen text color, unaltered, when the pair reaches 4.5:1 (AA). Otherwise the closest tone of it (same hue and chroma, OKLCH lightness only) reaching 4.5:1. If impossible, the higher-contrast of `#141416` and `#FAFAF7`. |
| `--cc-ink-muted` | Ink mixed toward the surface as far as possible while keeping at least 4.5:1. When ink is already close to 4.5:1 it can equal ink. Labels and secondary text.                                                                   |
| `--cc-line`      | Ink mixed toward the surface keeping at least 3.1:1. Input underlines and control borders (WCAG 1.4.11).                                                                                                                        |
| `--cc-hairline`  | Ink mixed 84% toward the surface. Decorative dividers only, never a control boundary.                                                                                                                                           |

- Filled chrome buttons (Fix, Copy): background primary and text in the label color of the primary (`labelColorFor`) when the `label-on-primary` pair passes AA. Otherwise background `--cc-ink` and text `--cc-surface`.
- Why ink keeps the exact color: pairs that pass AA appear exactly as chosen, as in Realtime Colors. Only failing pairs get an adjusted tone in the interface, and the Preview always shows the exact colors.
- Focus ring: `outline-2 outline-offset-2 outline-ink` (2px, ink color, 2px offset).
- While an input holds an invalid hex, the theme keeps the last valid pair, so nothing flashes.
- The theme is computed on the server from the URL state, so the first paint is already themed.
- `prefers-color-scheme` no longer changes the theme: the person chooses the colors. The default pair stays the core defaults.

## 3. Scale rules

- **Standard scales only.** Spacing, type, containers, line-heights and radii are the default Tailwind scales, written as utility classes. No arbitrary values in square brackets, no `clamp()`, no loose `px` in CSS and no custom size tokens. Allowed exceptions: 1px borders, the 2px focus outline, `rounded-xs`, the existing color, font family and easing tokens, and one named utility, `grid-cols-scale` (`grid-template-columns: 6rem minmax(0, 1fr)`, 96px for the strip label and the rest for the steps, defined in `tokens.css`), because no standard class expresses a fixed column next to a flexible one. `grid-cols-actions` is retired with the Suggest layout.
- **8px grid.** Spacing, control sizes and line-heights are multiples of 8px (even Tailwind steps: 2, 4, 6, 8, 10, 12, 16 and so on; one step is 4px). Font sizes follow the Tailwind scale and each text sets its line-height on the grid (`text-xs/4`, `text-sm/6`, `text-base/6`, `text-4xl/10`, or `leading-none` for the display sizes).
- **Mobile-first variants, never formulas.** Layout changes through `md` (768px) and `lg` (1024px). For tall screens there is a custom variant in `tokens.css`: `@custom-variant tall (@media (min-height: 50rem));` (screens at least 800px high). It is combined with `lg` (`lg:tall:`) to give the ratio its largest size only where it still fits above the fold.

## 4. Typography

DM Mono only: `font-light` (300), `font-normal` (400) and `font-medium` (500), self-hosted (no Google Fonts CDN).

| Element                                                        | Classes                                                                                                                                                                                            |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Labels, table headers, notes, "WCAG 2.2", footer               | `text-xs/4` (12px / 16px), muted                                                                                                                                                                   |
| UI text: buttons, select, table rows, verdicts, status message | `text-sm/6` (14px / 24px)                                                                                                                                                                          |
| h1 "Contrast Check"                                            | `text-sm/6 font-medium`                                                                                                                                                                            |
| Hex inputs                                                     | `text-4xl lg:text-3xl font-light leading-none` (36px; 30px from `lg`, where the five fields sit side by side)                                                                                      |
| Ratio                                                          | `text-7xl md:text-8xl lg:tall:text-9xl font-light leading-none tracking-tighter whitespace-nowrap` (72px, 96px, 128px). The ":1" is `text-3xl md:text-4xl lg:tall:text-5xl tracking-normal`, muted |
| Preview, title                                                 | `text-4xl/10 font-light tracking-tight`                                                                                                                                                            |
| Preview, body                                                  | `text-base/6 max-w-prose`                                                                                                                                                                          |
| Preview, panel title                                           | `text-base/6 font-medium`                                                                                                                                                                          |

## 5. Layout

Mobile-first, with `md` (768px) and `lg` (1024px) as the breakpoints. The sections below are in DOM order, which is the visual order and the focus order (WCAG 2.4.3). The order does not change across breakpoints.

1. **Container**: `max-w-7xl mx-auto px-4 md:px-8 lg:px-12 pt-6 md:pt-8 pb-12`. The root element covers the viewport (`min-h-dvh`) with the surface color.
2. **Header**: h1 "Contrast Check" on the left, "WCAG 2.2" (`text-xs/4`, muted) on the right.
3. **Palette**: a `fieldset` with a visually hidden `legend` "Palette" and five groups: Text, Background, Primary, Secondary, Accent.
   - Up to `lg`: stacked, each with a 1px hairline top border and `py-4`. The first has no border and no top padding.
   - From `lg`: `grid-cols-5 gap-x-8`, with a 1px hairline divider centered in each gap, drawn as a `before:` pseudo-element.
   - Each group: label (`text-xs/4`, muted); `mt-2`, a row with the hex input and a circular swatch (native color input, 1px line border), `gap-4`. The swatch is `size-12 lg:size-10`.
   - Input: `flex-1 min-w-0`, transparent background, no border except a 1px underline in `--cc-line`, `pb-2`, with the muted "#" inside the underline. The hint ("Hex, like #1A2B3C or #ABC") stays in the DOM, visually hidden.
   - Error line, always present: `mt-2 min-h-4 text-xs/4`, empty while the hex is valid. The input points to it and to the hint with `aria-describedby`. It never changes the height of the group.
4. **Actions**: `mt-6`. Mobile: stacked, full width, `gap-2`. From `md`: `flex flex-wrap items-center gap-x-6 gap-y-2`. All controls are `h-12 lg:h-10`.
   - Swap text and background: outline button.
   - Level: a visible label "Level" (`text-xs/4`, muted) beside the select AA/AAA (`md:w-32`) with the chevron described below.
   - Accent as text: a `button` with `role="switch"` and `aria-checked`. Track `w-8 h-4` with a 1px `--cc-line` border and a knob in ink. On: track in ink, knob in surface, moved 16px.
   - The Suggest button and the note "Changes only the lightness…" are gone. The Fix button of each pair replaces Suggest.
5. **Results**: `mt-8 pt-8`, 1px hairline top border. Mobile: stacked, `gap-y-8`. From `lg`: `grid-cols-5 gap-x-16`; the pair in focus takes `col-span-2` on the left and the table takes `col-span-3` on the right.
   - **Pair in focus** (first in the DOM): label "In focus · <pair name>" (`text-xs/4`, muted); the ratio (`mt-2`); the `verdict()` sentence (`mt-4 max-w-md text-sm/6`); the message (`mt-2 min-h-12 text-sm/6`, `aria-live="polite"`).
   - **Live summary**: a visually hidden (`sr-only`) region with `aria-live="polite"`, outside the two blocks and right after the Results section in the DOM. It announces the state in short text: "<pair in focus name>, <ratio> to 1. <palette verdict>." (for example "Text on background, 16.09 to 1. Passes AA · 6 of 6 pairs."). It updates when any color, the level, the Accent as text switch or the pair in focus changes. With an invalid hex, the announcement keeps the last valid pair, like the theme.
   - The visible message (`min-h-12`) keeps its own `aria-live`: it announces the result of an action (Fix, Copy); the hidden region announces the state.
   - The four texts of `verdict()` are defined in the core (`packages/core`, function `verdict`) and are not repeated here.
   - The message space is always reserved (two 24px lines), so a message never shifts the layout. Texts: "<Role> set to #HEX.", "Can't fix without breaking <pair> and N more." ("and N more" only when more than one pair would break), "Theme copied.", "Copy failed. Select the code and copy it."
   - **Pairs table** (after it in the DOM): first the palette verdict (`text-sm/6 font-medium`), "Passes AA · 6 of 6 pairs" or "Fails AA · 3 of 6 pairs fail"; then, `mt-4`, a `<table>` with a visually hidden caption "Palette pairs at <level>".
   - Columns: Pair; Ratio and Minimum (both from `md`); Result (`size-4` icon plus Pass or Fail at `font-medium`, same color for both, never color alone); Fix (header visually hidden).
   - Rows: `h-12 lg:h-10`, 1px hairline top border.
   - The pair name is a full-width button with `aria-pressed` that puts the pair in focus. The pair in focus is `font-medium` and underlined (`underline-offset-4`).
   - Below `md` the pair button has a second line, `text-xs/4` muted: "5.56:1 · min 4.5:1".
   - Fix: a filled button only on failing rows, with the accessible name "Fix <pair name in lowercase>", with "vs" replaced by "against" (for example "Fix accent against background").
6. **Scales**: `mt-10 pt-8`, 1px hairline top border; label "Scales · 11 steps from each seed, in OKLCH". Then, `mt-6`, five strips with `gap-y-6`.
   - From `lg` each strip is `grid-cols-scale gap-x-6`: the label on the left, the steps on the right.
   - Steps: `grid-cols-6 gap-x-1 gap-y-2` on mobile (6 + 5); `md:grid-cols-11 md:gap-1`.
   - Each step is a `role="radio"` inside a `role="radiogroup"` named after the strip, with roving tabindex, arrow keys, Home and End. Selection follows focus.
   - A step shows: a block `h-12 rounded-xs` with a 1px hairline border in the step's own color; the name (`mt-2 text-xs/4`); the use (`text-xs/4`, muted) with a `size-3` icon and text: check and "AAA" (7 or more), check and "AA" (4.5 or more), square and "Large · UI" (3 or more), dash and "Decor" (below 3).
   - The accessible name carries step, hex, ratio and use.
   - The active step: `outline-2 outline-offset-2` in ink, and its name in `font-medium`.
   - The background strip is annotated against the active text color; the other strips against the active background.
7. **Preview and Export**: from `lg`, `grid grid-cols-2 gap-x-16 items-start` with the two sections side by side, Preview on the left. Below `lg`, stacked in that order. Each section: `mt-10 pt-8`, 1px hairline top border.
   - **Preview**: label "Preview · your colors, unaltered"; then, `mt-6`, a settings screen in the exact colors, with `gap-6`:
     - the title "Notification settings" (`text-4xl/10 font-light tracking-tight`) and a paragraph (`text-base/6 max-w-prose`), both in the text color;
     - a panel with the secondary as background and the label color of the secondary as text, `p-6 rounded-xs max-w-xl`, no border: the title "Email updates" (`text-base/6 font-medium`) and two drawn fields (a label and a box `h-10 px-3` with a 1px border in `currentColor`; from `md`, the label is `w-40` beside the box);
     - below the panel, on the background: "Save changes" (primary, with its label color, `h-10 px-4`) and "Cancel" (outline in the text color);
     - on a row below, the chip "New" (`h-8 px-3`, border and text in accent) and the drawn link "Read what changed" (`text-base/6`, accent, underlined).
   - The buttons and the link sit outside the panel because the core does not check primary or accent on secondary.
   - Nothing in the Preview takes focus, and axe keeps excluding it.
   - The Preview answers to the pair in focus: the part that uses that pair gets `outline-2 outline-dashed outline-offset-4` in ink.
     - `text-on-background`: the title and the paragraph.
     - `label-on-secondary`: the panel.
     - `label-on-primary` and `primary-vs-background`: Save changes.
     - `accent-vs-background`: the chip.
     - `accent-as-text`: the link.
   - **Export**: a row with the label "Export · Tailwind CSS v4 theme" and the filled Copy button; then, `mt-4`, a `<pre>` with `tabindex="0"` and `aria-label="Tailwind theme"`, `max-h-96 overflow-auto p-4`, 1px border in `--cc-line`, `rounded-xs`, `text-xs/4`. Horizontal scrolling on long lines is expected.
8. **Footer**: `mt-16`, `text-xs/4` muted: Contrast Check, Next.js, Nuxt, GitHub. Links underlined, `underline-offset-4`.

### Ratio and controls

- **Ratio**: `text-7xl md:text-8xl lg:tall:text-9xl font-light leading-none tracking-tighter whitespace-nowrap`; the ":1" is `text-3xl md:text-4xl lg:tall:text-5xl tracking-normal`, muted.
- **Buttons and select**: `h-12 lg:h-10 px-4 text-sm/6 rounded-xs`. The select and Swap are transparent with a 1px `--cc-line` border and ink text (outline). Filled buttons (Fix, Copy) follow the Theme rule and have no border. Hover (only in `(hover: hover) and (pointer: fine)`): the border of the select and of Swap becomes `--cc-ink`; filled buttons do not change color (cursor only).
  - Select: `appearance-none pr-10` with its own chevron (inline SVG, `aria-hidden`, `pointer-events-none`, `size-4`, `currentColor`) at `right-4`, vertically centered, inside a `relative` wrapper. In forced-colors mode the select goes back to its native look (`forced-colors:appearance-auto`) and the SVG is hidden (`forced-colors:hidden`).

## 6. Motion

- No transition on theme or color changes: they follow typing and picker drags.
- Buttons scale down on `:active` (`active:scale-97`) with `transition-transform duration-150 ease-press`, where `ease-press` is the token `cubic-bezier(0.23, 1, 0.32, 1)`.
- The Accent as text switch moves with `transition-transform duration-150 ease-press`.
- Hover styles only inside `@media (hover: hover) and (pointer: fine)`.
- `prefers-reduced-motion`: no transforms, transitions or animations (`motion-reduce:` variants plus a global rule); this includes the switch.

## 7. UX decisions

- The ratio is the single focal point (Von Restorff): it must be the one thing that stands out.
- The global actions are Swap, Level and Accent as text; correction is per pair (Fix only on failing rows) (Hick): fewer choices, faster decisions.
- Every target is `h-12` (48px) on touch layouts and `lg:h-10` (40px) from `lg`, where a pointer is expected (Fitts): easy to hit on a phone.
- Results are instant, with no submit button (Doherty): feedback keeps pace with typing.
- Hex is accepted with or without `#`, with spaces and in any case (Postel): be liberal in what is accepted.
- Spacing groups before lines (proximity): related controls sit together without boxes.
- Standard form controls with custom styling (Jakob): inputs, selects and the color picker behave as people expect.
- Messages and errors have reserved space, so nothing shifts the layout when they appear.
- The DOM order of focusable elements does not change across breakpoints: keyboard order matches the visual order.

## 8. Accessibility floors

- Chrome text at least 4.5:1.
- Control boundaries at least 3:1.
- The Preview is exempt by design: it is the thing being tested.
- Changes of state are announced through one polite live region; action results through the visible message.
- Phase 3 rewrites the E2E suite for this interface (design, section 6.3); the new ids and `data-testid` values defined there become the contract.

## 9. Out of scope

- Illustrations or animated figures.
- A dark/light toggle.
- Extra global actions.
