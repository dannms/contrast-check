import { contrastRatio, parseHex, type Rgb, toHex } from "./color";
import { formatOklch, rgbToOklch } from "./oklch";
import {
  checkPalette,
  type Palette,
  type PaletteOptions,
  paletteVerdict,
  ROLES,
} from "./palette";
import { scaleFor } from "./scale";

const BLACK: Rgb = { r: 0, g: 0, b: 0 };
const rgbOf = (hex: string): Rgb => parseHex(hex) ?? BLACK;

/**
 * The palette as a Tailwind CSS v4 `@theme` block: 11 steps per role built from
 * the role's seed, and one semantic alias per role pointing at the step that holds
 * the role's active color (or the literal color when a fix moved it off the scale).
 * A header comment records the verdict, the level and the accent flag.
 */
export function toTailwindTheme(
  palette: Palette,
  options: PaletteOptions,
): string {
  const verdict = paletteVerdict(checkPalette(palette, options), options.level);
  const accent = options.accentAsText ? "on" : "off";
  const background = rgbOf(palette.background.active);

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
    const ratio = contrastRatio(active, background).toFixed(2);
    lines.push(`  --color-${role}: ${value}; /* ${ratio}:1 on background */`);
  }

  lines.push("}");
  return `${lines.join("\n")}\n`;
}
