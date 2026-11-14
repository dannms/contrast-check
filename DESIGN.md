# Design

Source of truth for the visual design. Values are normative.

## 1. Concept

- **Surface**: the page takes the background color the person chose.
- **Specimen**: the Preview section uses the raw text color the person chose, unadjusted. It is what is being tested and may fail.
- **Chrome**: everything else (text, labels, borders, focus, buttons) uses a theme derived from the chosen text color by the suggestion algorithm of the core, so it stays readable for any pair. See Theme.

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
| `--cc-tint`      | Ink mixed 90% toward the surface. Used only for the 200ms highlight of the Text input when a suggestion is applied. Not a button fill: near the AA limit it is almost the surface color.                                        |

- Why ink keeps the exact color: pairs that pass AA appear exactly as chosen, as in Realtime Colors. Only failing pairs get an adjusted tone in the interface, and the specimen always shows the exact color.
- Focus ring: `outline-2 outline-offset-2 outline-ink` (2px, ink color, 2px offset).
- While an input holds an invalid hex, the theme keeps the last valid pair, so nothing flashes.
- The theme is computed on the server from the URL state, so the first paint is already themed.
- `prefers-color-scheme` no longer changes the theme: the person chooses the colors. The default pair stays the core defaults.

## 3. Scale rules

- **Standard scales only.** Spacing, type, containers, line-heights and radii are the default Tailwind scales, written as utility classes. No arbitrary values in square brackets, no `clamp()`, no loose `px` in CSS and no custom size tokens. Allowed exceptions: 1px borders, the 2px focus outline, `rounded-xs`, the existing color, font family and easing tokens, and one named utility, `grid-cols-actions` (`grid-template-columns: auto minmax(0, 1fr)`, defined in `tokens.css`), because no standard class expresses an auto-sized column next to a flexible one.
- **8px grid.** Spacing, control sizes and line-heights are multiples of 8px (even Tailwind steps: 2, 4, 6, 8, 10, 12, 16 and so on; one step is 4px). Font sizes follow the Tailwind scale and each text sets its line-height on the grid (`text-xs/4`, `text-sm/6`, `text-base/6`, `text-2xl/8`, `text-4xl/10`, `text-5xl/12`, or `leading-none` for the display sizes).
- **Mobile-first variants, never formulas.** Layout changes through `md` (768px) and `lg` (1024px); `xl` (1280px) is used only to step the hex input up to `text-5xl`. For tall screens there is a custom variant in `tokens.css`: `@custom-variant tall (@media (min-height: 50rem));` (screens at least 800px high). It is combined with `lg` (`lg:tall:`) to give the ratio its largest size only where it still fits above the fold.

## 4. Typography

DM Mono only: `font-light` (300), `font-normal` (400) and `font-medium` (500), self-hosted (no Google Fonts CDN).

| Element                                                           | Classes                                                                                                                                                                                            |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Labels, table headers, notes, "WCAG 2.2", footer                  | `text-xs/4` (12px / 16px), muted                                                                                                                                                                   |
| UI text: buttons, select, table rows, verdict, suggestion message | `text-sm/6` (14px / 24px)                                                                                                                                                                          |
| h1 "Contrast Check"                                               | `text-sm/6 font-medium`                                                                                                                                                                            |
| Hex inputs                                                        | `text-4xl xl:text-5xl font-light leading-none` (36px, then 48px from xl)                                                                                                                           |
| Ratio                                                             | `text-7xl md:text-8xl lg:tall:text-9xl font-light leading-none tracking-tighter whitespace-nowrap` (72px, 96px, 128px). The ":1" is `text-3xl md:text-4xl lg:tall:text-5xl tracking-normal`, muted |
| Specimen, large                                                   | `text-4xl/10 md:text-5xl/12 font-light tracking-tight`                                                                                                                                             |
| Specimen, medium                                                  | `text-2xl/8 font-medium`                                                                                                                                                                           |
| Specimen, body                                                    | `text-base/6 max-w-prose`                                                                                                                                                                          |

## 5. Layout

Mobile-first, with `md` (768px) and `lg` (1024px) as the breakpoints.

- **Container**: `max-w-6xl mx-auto px-4 md:px-8 lg:px-12 pt-6 md:pt-8 pb-12`. The root element covers the viewport (`min-h-dvh`) with the surface color.
- **Header**: h1 on the left, "WCAG 2.2" (`text-xs/4`, muted) on the right.
- **Top row**: `mt-8 md:mt-10`, three groups: Text, Background, Actions.
  - Mobile: groups stacked, each separated by a 1px hairline top border and `py-6`. The first group has no border and no top padding.
  - From `md`: three columns with a gap (`md:gap-x-8`, `lg:gap-x-12`) and a 1px hairline divider centered in each gap, drawn as a `before:` pseudo-element, so both sides of every divider have the same space (16px from `md`, 24px from `lg`). There is no padding on the outer edges: the first column starts at the container's left edge and the last one ends exactly at its right edge, the same axis as "WCAG 2.2" and the criteria table.
  - Text and Background are always the same width. At `md` the three columns are equal (the Colors fieldset is an explicit two-column grid; a subgrid on the fieldset was not applied). From `lg` the row is a flex row: the Colors fieldset takes the free space (`flex-1`, two equal columns) and the Actions group has a fixed `lg:w-96` (384px), enough for Swap and the select side by side.
  - Columns align to the top; each divider is as tall as its own column.
- **Color group**: label (`text-xs/4`, muted), then, `mt-2` below it, a row with the hex input and a `size-12` circular color swatch (native color input, 1px line border). The row never wraps.
  - The hex input takes the width the column leaves (`flex-1 min-w-0`) and the swatch sits at the end of the row, flush with the column's edge, at every width. Text and Background therefore have underlines of the same length, and each swatch is the same distance from the divider on its right. The gap between input and swatch is `gap-4` (`md:gap-2` at `md`, where the columns are narrowest).
  - Input: `size="7"`, transparent background, no border except a 1px bottom border in `--cc-line`, `pb-2`, `text-4xl xl:text-5xl` (36px up to `lg`, 48px from `xl`, so the line fits at 1024px).
  - The hint ("Hex, like #1A2B3C or #ABC") stays in the DOM and tied to the input by `aria-describedby`, but is visually hidden. Error text is `text-xs/4`, ink, visible.
- **Actions group**: contains, in this order in the DOM and on screen: the Swap colors button, the Target level select and the Suggest accessible text color button, then the suggestion message (live), then the note "Changes only the lightness of your text color." (`text-xs/4`, muted). Visual order and focus order are the same (WCAG 2.4.3).
  - Visible group label "Actions" (`text-xs/4`, muted), decorative (`aria-hidden`), aligned with the "Text" and "Background" labels. The suggestion section keeps its h2 "Suggestion", visually hidden.
  - Mobile: the three controls stacked at full width, `gap-2`.
  - From `lg` the group is `lg:grid lg:w-96 lg:flex-none lg:grid-cols-actions lg:gap-2`. `grid-cols-actions` is the named utility from `tokens.css`: column 1 is as wide as Swap and column 2 takes the rest.
    - Row 1, labels: "Actions" (decorative, `aria-hidden`) over column 1 and "Target level" over column 2.
    - Row 2, controls: Swap in column 1, with the width of its content, and the select in column 2, filling it up to the right edge; both `lg:h-10`, aligned to the top.
    - Row 3: Suggest across both columns. Row 4: the message and the note.
    - The Suggestion section spans both columns and the four rows and inherits the tracks with `grid-cols-subgrid` and `grid-rows-subgrid`. Its controls row and the select wrapper subgrid in turn, so the label and the select land in the grid cells above. There is no `display: contents` anywhere, so the landmark region and the focus order do not depend on browser quirks.
    - The section box covers the Swap cell, so Swap has `lg:relative lg:z-10` to stay clickable.
    - DOM order and focus order stay Swap, select, Suggest.
  - The Swap button sits outside the "Colors" fieldset, right after it in the DOM. The fieldset contains only the Text and Background groups.
  - Suggestion message: `text-sm/6`, ink, with a `size-4` inline SVG icon (`aria-hidden`) before the text, in a `gap-2` row. One icon per state: a check (suggestion applied), an information circle (the text color already meets the target) and a warning triangle (impossible with this hue). The message text does not change. It sits right below Suggest and above the note, inside the `aria-live="polite"` region; with no message the region is empty, with no icon and no reserved space.
- **Buttons and select**: `h-12 lg:h-10 px-4 text-sm/6 rounded-xs`. The select and the Swap colors button are transparent with a 1px `--cc-line` border and ink text (outline). Suggest accessible text color is the primary action: filled with `--cc-ink`, text in `--cc-surface`, no border (the contrast is the ink/surface pair itself, always at least 4.5:1). Hover (only in `(hover: hover) and (pointer: fine)`): the border of the select and of Swap becomes `--cc-ink`; Suggest does not change color (cursor only). Focus and `:active` are unchanged.
  - Select: `appearance-none pr-10` with its own chevron (inline SVG, `aria-hidden`, `pointer-events-none`, `size-4`, `currentColor`) at `right-4`, vertically centered, inside a `relative` wrapper. In forced-colors mode the select goes back to its native look (`forced-colors:appearance-auto`) and the SVG is hidden (`forced-colors:hidden`), so the native arrow does not disappear.
- **Results**: `mt-10 md:mt-12 pt-8`, 1px hairline top border.
  - Mobile: stacked, `gap-y-8`. From `md`: a two-column grid, `gap-x-16 gap-y-8`: the ratio block and the criteria table.
  - Ratio block: `text-xs/4` muted label "Contrast ratio", the ratio (`mt-2`), then the visible verdict (`mt-4 max-w-md text-sm/6`, ink, no `aria-live`): one sentence from `verdict()` in the core. "Passes AAA for all text." (ratio 7 or more), "Passes AA. AAA needs 7:1." (4.5 to 7), "Large text and UI only. Normal text needs 4.5:1." (3 to 4.5) or "Fails every criterion. Normal text needs 4.5:1." (below 3). The full `summarize()` sentence stays in a visually hidden (`sr-only`) `aria-live="polite"` region with `data-testid="live-summary"`. With invalid colors the verdict slot shows "Enter two valid hex colors to see the contrast ratio."
- **Criteria table**: `text-sm/6`. Header row `text-xs/4` muted with `pb-2`. Rows with a 1px hairline top border and `py-2`. The result is a `size-4` icon plus "Pass" or "Fail" at `font-medium`, in the same ink color for both (never color alone).
- **Preview**: `mt-12 md:mt-16 pt-8`, 1px hairline top border. Label "Preview" plus "your text color, unaltered" (`text-xs/4`, muted). Specimen lines in the raw text color, `mt-6` below, directly on the surface, no frame. The 24px line reads "Large text, 24px." (DM Mono has no 700 weight, and 24px already counts as large text in WCAG at any weight).
- **Footer**: `mt-16`, `text-xs/4` muted: Contrast Check, Next.js, Nuxt, GitHub. Links underlined, `underline-offset-4`.

## 6. Motion

- No transition on theme or color changes: they follow typing and picker drags.
- Buttons scale down on `:active` (`active:scale-97`) with `transition-transform duration-150 ease-press`, where `ease-press` is the token `cubic-bezier(0.23, 1, 0.32, 1)`.
- When a suggestion is applied, the Text input background starts at `--cc-tint` and fades to transparent in 200ms (`animate-flash`, with the same easing token).
- Hover styles only inside `@media (hover: hover) and (pointer: fine)`.
- `prefers-reduced-motion`: no transforms, transitions or animations (`motion-reduce:` variants plus a global rule).

## 7. UX decisions

- The ratio is the single focal point (Von Restorff): it must be the one thing that stands out.
- Only two actions, Swap and Suggest (Hick): fewer choices, faster decisions.
- Every target is `h-12` (48px) on touch layouts and `lg:h-10` (40px) from `lg`, where a pointer is expected (Fitts): easy to hit on a phone.
- Results are instant, with no submit button (Doherty): feedback keeps pace with typing.
- Hex is accepted with or without `#`, with spaces and in any case (Postel): be liberal in what is accepted.
- Spacing groups before lines (proximity): related controls sit together without boxes.
- Standard form controls with custom styling (Jakob): inputs, selects and the color picker behave as people expect.
- The DOM order of focusable elements does not change across breakpoints: keyboard order matches the visual order.

## 8. Accessibility floors

- Chrome text at least 4.5:1.
- Control boundaries at least 3:1.
- The specimen is exempt by design: it is the thing being tested.
- Existing labels, ids, aria attributes, headings and `data-testid` values are a contract with the E2E suite and must not change.

## 9. Out of scope

- Illustrations or animated figures.
- A dark/light toggle.
- Extra actions.
