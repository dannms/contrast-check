/**
 * Pure color utilities for WCAG 2.x contrast checking.
 * No dependencies, no side effects.
 */

export type Rgb = { r: number; g: number; b: number };

export type SuggestionTarget = "AA" | "AAA";

export type Suggestion = {
  hex: string;
  ratio: number;
};

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export const TARGET_THRESHOLDS: Record<SuggestionTarget, number> = {
  AA: 4.5,
  AAA: 7,
};

/** Parses #RGB or #RRGGBB (the leading # is optional). Returns null if invalid. */
export function parseHex(input: string): Rgb | null {
  const match = HEX_PATTERN.exec(input.trim());
  if (!match?.[1]) return null;
  const digits = match[1];
  const full =
    digits.length === 3
      ? digits
          .split("")
          .map((c) => c + c)
          .join("")
      : digits;
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

/** Formats an RGB color as an uppercase #RRGGBB string. */
export function toHex({ r, g, b }: Rgb): string {
  const part = (n: number) => n.toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}

function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance, from 0 (black) to 1 (white). */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** WCAG contrast ratio, from 1 to 21. Symmetric in its arguments. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Formats a ratio with two decimals, e.g. "4.54:1". */
export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}

/** The four verdict sentences, from the ratio alone. */
export function verdictForRatio(ratio: number): string {
  if (ratio >= 7) return "Passes AAA for all text.";
  if (ratio >= 4.5) return "Passes AA. AAA needs 7:1.";
  if (ratio >= 3) return "Large text and UI only. Normal text needs 4.5:1.";
  return "Fails every criterion. Normal text needs 4.5:1.";
}
