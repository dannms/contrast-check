import { parseHex, type Rgb, toHex } from "./color";
import { formatOklch, rgbToOklch } from "./oklch";
import {
  checkPalette,
  labelColorFor,
  type PairId,
  type Palette,
  type PaletteOptions,
  paletteVerdict,
  ROLES,
  type Role,
} from "./palette";
import { scaleFor } from "./scale";

const BLACK: Rgb = { r: 0, g: 0, b: 0 };
const rgbOf = (hex: string): Rgb => parseHex(hex) ?? BLACK;

/**
 * The palette as a Tailwind CSS v4 `@theme` block: 11 steps per role built from
 * the role's seed, and one semantic alias per role pointing at the step that holds
 * the role's active color (or the literal color when a fix moved it off the scale).
 * Each alias ends with a comment for the pair that applies to its role, and two
 * `-label` aliases name the text or background alias to use on primary and secondary.
 * A header comment records the verdict, the level and the accent flag.
 */
export function toTailwindTheme(
  palette: Palette,
  options: PaletteOptions,
): string {
  const results = checkPalette(palette, options);
  const verdict = paletteVerdict(results, options.level);
  const ratio = (id: PairId): string =>
    (results.find((r) => r.id === id)?.ratio ?? Number.NaN).toFixed(2);
  const notes: Record<Role, string> = {
    text: `${ratio("text-on-background")}:1 on background`,
    background: "surface",
    primary: `label ${ratio("label-on-primary")}:1, ${ratio("primary-vs-background")}:1 vs background`,
    secondary: `label ${ratio("label-on-secondary")}:1`,
    accent: `${ratio("accent-vs-background")}:1 on background`,
  };
  const accent = options.accentAsText ? "on" : "off";

  const lines: string[] = [
    `/* ${verdict}. Level ${options.level}, accent as text: ${accent}. */`,
    "@theme {",
  ];

  for (const role of ROLES) {
    for (const step of scaleFor(palette[role].seed)) {
      lines.push(`  --color-${role}-${step.name}: ${step.oklch};`);
    }
  }

  for (const role of ROLES) {
    const active = rgbOf(palette[role].active);
    const activeHex = toHex(active);
    const step = scaleFor(palette[role].seed).find((s) => s.hex === activeHex);
    const value = step
      ? `var(--color-${role}-${step.name})`
      : formatOklch(rgbToOklch(active));
    lines.push(`  --color-${role}: ${value}; /* ${notes[role]} */`);
  }

  const textHex = toHex(rgbOf(palette.text.active));
  for (const role of ["primary", "secondary"] as const) {
    const label = labelColorFor(palette[role].active, palette);
    const on = label === textHex ? "text" : "background";
    lines.push(`  --color-${role}-label: var(--color-${on});`);
  }

  lines.push("}");
  return `${lines.join("\n")}\n`;
}
