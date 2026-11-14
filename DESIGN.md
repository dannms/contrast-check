# Design

Source of truth for the visual design. Values are normative.

## 1. Concept

- **Surface**: the page takes the background color the person chose.
- **Specimen**: the Preview section uses the raw text color the person chose, unadjusted. It is what is being tested and may fail.
- **Chrome**: everything else (text, labels, borders, focus, buttons) uses a theme derived from the chosen text color by the suggestion algorithm of the core, so it stays readable for any pair. See Theme.

Direction: minimalism in the style of Scale (hihayk.github.io/scale) combined with the idea of Realtime Colors, where the page is the preview. Mobile-first. One monospaced family. No cards, no shadows, no gradients, no glassmorphism. 1px dividers, 2px radius on controls, a circular color swatch.

## 2. Theme

Computed by `deriveTheme` in `packages/core` and exposed as CSS custom properties on the app root.

| Role             | Rule                                                                                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--cc-surface`   | The chosen background.                                                                                                                                                                                                            |
| `--cc-ink`       | The chosen text color, unaltered, when the pair reaches 4.5:1 (AA). Otherwise the closest tone of it (same hue and saturation, HSL lightness only) reaching 4.5:1. If impossible, the higher-contrast of `#141416` and `#FAFAF7`. |
| `--cc-ink-muted` | Ink mixed toward the surface as far as possible while keeping at least 4.5:1. When ink is already close to 4.5:1 it can equal ink. Labels and secondary text.                                                                     |
| `--cc-line`      | Ink mixed toward the surface keeping at least 3.1:1. Input underlines and control borders (WCAG 1.4.11).                                                                                                                          |
| `--cc-hairline`  | Ink mixed 84% toward the surface. Decorative dividers only, never a control boundary.                                                                                                                                             |
| `--cc-tint`      | Ink mixed 90% toward the surface. Used only for the 200ms highlight of the Text input when a suggestion is applied. Not a button fill: near the AA limit it is almost the surface color.                                          |

- Why ink keeps the exact color: pairs that pass AA appear exactly as chosen, as in Realtime Colors. Only failing pairs get an adjusted tone in the interface, and the specimen always shows the exact color.
- Focus ring: `2px solid var(--cc-ink)`, offset 3px.
- While an input holds an invalid hex, the theme keeps the last valid pair, so nothing flashes.
- The theme is computed on the server from the URL state, so the first paint is already themed.
- `prefers-color-scheme` no longer changes the theme: the person chooses the colors. The default pair stays the core defaults.

## 3. Typography

DM Mono only, weights 300, 400 and 500, self-hosted (no Google Fonts CDN).

| Element                      | Style                                                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Labels and table headers     | 12px / 400, muted                                                                                                                  |
| UI text, buttons, table rows | 13px                                                                                                                               |
| h1 "Contrast Check"          | 14px / 500                                                                                                                         |
| Hex inputs                   | `clamp(36px, 4.2vw, 48px)` / 300, line-height 1                                                                                    |
| Ratio                        | `clamp(104px, 15vw, 196px)` / 300, line-height 0.85, letter-spacing -0.045em, no wrap. The ":1" at 0.36em, muted, letter-spacing 0 |
| Specimen, large              | `clamp(36px, 9vw, 56px)` / 300, line-height 1.05, letter-spacing -0.02em                                                           |
| Specimen, medium             | 24px / 500, line-height 1.3                                                                                                        |
| Specimen, body               | 16px / 400, line-height 1.6, max 66ch                                                                                              |

## 4. Layout

Mobile-first, one breakpoint at 768px.

- **Container**: max-width 1180px, centered. `padding-inline: clamp(20px, 4vw, 48px)`, `padding-top: clamp(28px, 5vw, 64px)`, `padding-bottom: 48px`. The root element covers the viewport (`min-height: 100dvh`) with the surface color.
- **Header**: h1 on the left, "WCAG 2.2" (12px, muted) on the right.
- **Top row**: `margin-top: clamp(40px, 6vw, 64px)`, three groups: Text, Background, Actions.
  - Mobile: groups stacked, each separated by a 1px hairline top border and 28px vertical padding. The first group has no border and no top padding.
  - From 768px: three equal columns, a 1px hairline left divider and 40px horizontal padding. The first column has no divider and no left padding.
- **Color group**: label (12px, muted), then a row with the hex input and a 44x44 circular color swatch (native color input, 1px line border).
  - Mobile: input on the left, swatch on the right (space-between). From 768px: swatch right after the input, 16px gap.
  - Input: transparent background, no border except a 1px bottom border in `--cc-line`, 6px bottom padding, width fits 7 characters.
  - The hint ("Hex, like #1A2B3C or #ABC") stays in the DOM and tied to the input by `aria-describedby`, but is visually hidden. Error text 12px ink, visible.
- **Actions group**: contains, in this order in the DOM and on screen: the Swap colors button, the Target level select and the Suggest accessible text color button, with a 12px muted note right below the Suggest button ("Changes only the lightness of your text color."), followed by the (live) message (12px, muted). Visual order and focus order are the same (WCAG 2.4.3).
  - Visible group label "Actions" (12px, muted), decorative (`aria-hidden`), aligned with the "Text" and "Background" labels. The suggestion section keeps its h2 "Suggestion", visually hidden.
  - Mobile: the three controls stacked at full width, 8px gap.
  - From 768px: Swap at automatic width; below it, the select and Suggest side by side in a row that wraps when space runs out.
  - The Swap button sits outside the "Colors" fieldset, right after it in the DOM. The fieldset contains only the Text and Background groups.
- **Buttons and select**: height 44px, padding `0 16px`, radius 2px, 13px. The select and the Swap colors button are transparent with a 1px `--cc-line` border and ink text (outline). Suggest accessible text color is the primary action: filled with `--cc-ink`, text in `--cc-surface`, no border (the contrast is the ink/surface pair itself, always at least 4.5:1). Hover (only in `(hover: hover) and (pointer: fine)`): the border of the select and of Swap becomes `--cc-ink`; Suggest does not change color (cursor only). Focus and `:active` are unchanged.
- **Results**: `margin-top: 72px`, `padding-top: 40px`, 1px hairline top border.
  - Mobile: stacked. From 768px: a wrapping row with gap `48px 64px`, ratio block (`flex: 1 1 380px`) and criteria table (`flex: 1 1 400px`).
  - Ratio block: 12px muted label "Contrast ratio", the ratio, then the visible one-sentence summary (13px, muted, max 44ch), which is also the aria-live region.
- **Criteria table**: header row 12px muted. Rows 13px with a 1px hairline top border and 13px vertical padding. The result is a 14px icon plus "Pass" or "Fail" at weight 500, in the same ink color for both (never color alone).
- **Preview**: `margin-top: 80px`, `padding-top: 40px`, 1px hairline top border. Label "Preview" plus "your text color, unaltered" (12px, muted). Specimen lines in the raw text color, directly on the surface, no frame. The 24px line reads "Large text, 24px." (DM Mono has no 700 weight, and 24px already counts as large text in WCAG at any weight).
- **Footer**: `margin-top: 96px`, 12px muted: Contrast Check, Next.js, Nuxt, GitHub. Links underlined, offset 3px.

## 5. Motion

- No transition on theme or color changes: they follow typing and picker drags.
- Buttons `scale(0.97)` on `:active`, 160ms, `cubic-bezier(0.23, 1, 0.32, 1)`.
- When a suggestion is applied, the Text input background flashes `--cc-tint` for 200ms.
- Hover styles only inside `@media (hover: hover) and (pointer: fine)`.
- `prefers-reduced-motion`: no transforms and no transitions.

## 6. UX decisions

- The ratio is the single focal point (Von Restorff): it must be the one thing that stands out.
- Only two actions, Swap and Suggest (Hick): fewer choices, faster decisions.
- Every target is at least 44px (Fitts): easy to hit on a phone.
- Results are instant, with no submit button (Doherty): feedback keeps pace with typing.
- Hex is accepted with or without `#`, with spaces and in any case (Postel): be liberal in what is accepted.
- Spacing groups before lines (proximity): related controls sit together without boxes.
- Standard form controls with custom styling (Jakob): inputs, selects and the color picker behave as people expect.
- The DOM order of focusable elements does not change across breakpoints: keyboard order matches the visual order.

## 7. Accessibility floors

- Chrome text at least 4.5:1.
- Control boundaries at least 3:1.
- The specimen is exempt by design: it is the thing being tested.
- Existing labels, ids, aria attributes, headings and `data-testid` values are a contract with the E2E suite and must not change.

## 8. Out of scope

- Illustrations or animated figures.
- A dark/light toggle.
- Extra actions.
