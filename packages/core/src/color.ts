/**
 * Pure color utilities for WCAG 2.x contrast checking.
 * No dependencies, no side effects.
 */

import { closestPassingLightness } from "./lightness";

export type Rgb = { r: number; g: number; b: number };

export type CriterionId =
  | "aa-normal"
  | "aa-large"
  | "aaa-normal"
  | "aaa-large"
  | "ui";

export type Criterion = {
  id: CriterionId;
  label: string;
  threshold: number;
  pass: boolean;
};

export type Evaluation = {
  ratio: number;
  criteria: Criterion[];
};

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

const CRITERIA: ReadonlyArray<Omit<Criterion, "pass">> = [
  { id: "aa-normal", label: "AA normal text", threshold: 4.5 },
  { id: "aa-large", label: "AA large text", threshold: 3 },
  { id: "aaa-normal", label: "AAA normal text", threshold: 7 },
  { id: "aaa-large", label: "AAA large text", threshold: 4.5 },
  { id: "ui", label: "UI components and graphics", threshold: 3 },
];

/** Computes the ratio and the pass/fail status of every WCAG 2.2 criterion. */
export function evaluate(fg: Rgb, bg: Rgb): Evaluation {
  const ratio = contrastRatio(fg, bg);
  return {
    ratio,
    criteria: CRITERIA.map((c) => ({ ...c, pass: ratio >= c.threshold })),
  };
}

/**
 * Suggests the closest text color that reaches the target contrast on `bg`.
 *
 * It keeps the OKLCH hue and chroma of `fg` and changes only the perceptual
 * lightness (see `closestPassingLightness`). The search samples lightness
 * instead of bisecting it: contrast is not monotonic in lightness, because it dips
 * where the text luminance crosses the background's, so lighter and darker
 * candidates both have to be considered. The color comes back unchanged when it
 * already passes, and `null` when no lightness can reach the target.
 */
export function suggestTextColor(
  fg: Rgb,
  bg: Rgb,
  target: SuggestionTarget = "AA",
): Suggestion | null {
  const color = closestPassingLightness(fg, bg, TARGET_THRESHOLDS[target]);
  if (!color) return null;
  return { hex: toHex(color), ratio: contrastRatio(color, bg) };
}

/**
 * Short, screen-reader friendly summary of an evaluation, e.g.
 * "4.54:1. Passes AA normal text, AA large text. Fails AAA normal text."
 */
export function summarize(evaluation: Evaluation): string {
  const passed = evaluation.criteria.filter((c) => c.pass).map((c) => c.label);
  const failed = evaluation.criteria.filter((c) => !c.pass).map((c) => c.label);
  const parts = [`${formatRatio(evaluation.ratio)}.`];
  if (failed.length === 0) parts.push("Passes all criteria.");
  else if (passed.length === 0) parts.push("Fails all criteria.");
  else {
    parts.push(`Passes ${passed.join(", ")}.`);
    parts.push(`Fails ${failed.join(", ")}.`);
  }
  return parts.join(" ");
}

/** One short sentence on where the ratio stands, for the visible text under the ratio. */
export function verdict(evaluation: Evaluation): string {
  return verdictForRatio(evaluation.ratio);
}

/** The four verdict sentences, from the ratio alone. */
export function verdictForRatio(ratio: number): string {
  if (ratio >= 7) return "Passes AAA for all text.";
  if (ratio >= 4.5) return "Passes AA. AAA needs 7:1.";
  if (ratio >= 3) return "Large text and UI only. Normal text needs 4.5:1.";
  return "Fails every criterion. Normal text needs 4.5:1.";
}
