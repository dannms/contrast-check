/**
 * Pure color utilities for WCAG 2.x contrast checking.
 * No dependencies, no side effects.
 */

export type Rgb = { r: number; g: number; b: number };
export type Hsl = { h: number; s: number; l: number };

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

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const sector = Math.floor(h / 60) % 6;
  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][sector] as [number, number, number];
  const to255 = (v: number) => Math.round((v + m) * 255);
  return { r: to255(r), g: to255(g), b: to255(b) };
}

const SEARCH_STEPS = 24;

/**
 * Suggests the closest text color that reaches the target contrast on `bg`,
 * keeping hue and saturation and changing only HSL lightness.
 *
 * Contrast is not monotonic in lightness (it dips where the text luminance
 * crosses the background's), so each direction is searched separately with a
 * monotonic predicate: "lighter than bg and passing" and "darker than bg and
 * passing". Returns null when neither direction can reach the target.
 */
export function suggestTextColor(
  fg: Rgb,
  bg: Rgb,
  target: SuggestionTarget = "AA",
): Suggestion | null {
  const threshold = TARGET_THRESHOLDS[target];
  const original = contrastRatio(fg, bg);
  if (original >= threshold) return { hex: toHex(fg), ratio: original };

  const { h, s, l: l0 } = rgbToHsl(fg);
  const bgLum = relativeLuminance(bg);
  const at = (l: number) => hslToRgb({ h, s, l });
  const passesLighter = (l: number) => {
    const c = at(l);
    return relativeLuminance(c) >= bgLum && contrastRatio(c, bg) >= threshold;
  };
  const passesDarker = (l: number) => {
    const c = at(l);
    return relativeLuminance(c) <= bgLum && contrastRatio(c, bg) >= threshold;
  };

  const candidates: number[] = [];

  if (passesLighter(1)) {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < SEARCH_STEPS; i++) {
      const mid = (lo + hi) / 2;
      if (passesLighter(mid)) hi = mid;
      else lo = mid;
    }
    candidates.push(hi);
  }
  if (passesDarker(0)) {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < SEARCH_STEPS; i++) {
      const mid = (lo + hi) / 2;
      if (passesDarker(mid)) lo = mid;
      else hi = mid;
    }
    candidates.push(lo);
  }

  const best = candidates.sort(
    (a, b) => Math.abs(a - l0) - Math.abs(b - l0),
  )[0];
  if (best === undefined) return null;
  const color = at(best);
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
