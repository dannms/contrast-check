import {
  contrastRatio,
  parseHex,
  type Rgb,
  suggestTextColor,
  toHex,
} from "./color";

export type Theme = {
  surface: string;
  ink: string;
  inkMuted: string;
  line: string;
  hairline: string;
  tint: string;
};

const FALLBACK_DARK: Rgb = { r: 0x14, g: 0x14, b: 0x16 };
const FALLBACK_LIGHT: Rgb = { r: 0xfa, g: 0xfa, b: 0xf7 };

const MUTED_MIN_RATIO = 4.5;
const LINE_MIN_RATIO = 3.1;
const HAIRLINE_T = 0.84;
const TINT_T = 0.9;
const INK_ON_TINT_MIN_RATIO = 4.5;
const SEARCH_STEPS = 24;

/** Linear interpolation in sRGB: t = 0 gives `a`, t = 1 gives `b`. */
export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const channel = (from: number, to: number) =>
    Math.round(from + (to - from) * t);
  return {
    r: channel(a.r, b.r),
    g: channel(a.g, b.g),
    b: channel(a.b, b.b),
  };
}

/**
 * Mixes `ink` toward `surface` as far as possible while keeping at least
 * `minRatio` against `surface`. Returns `ink` unchanged if it already falls short.
 */
export function fadeToward(ink: Rgb, surface: Rgb, minRatio: number): Rgb {
  const passes = (t: number) =>
    contrastRatio(mix(ink, surface, t), surface) >= minRatio;
  let lo = 0;
  let hi = 1;
  if (passes(hi)) return mix(ink, surface, hi);
  for (let i = 0; i < SEARCH_STEPS; i++) {
    const mid = (lo + hi) / 2;
    if (passes(mid)) lo = mid;
    else hi = mid;
  }
  return mix(ink, surface, lo);
}

/**
 * `fg` itself when the pair passes AA (the suggestion returns it unchanged),
 * else the closest tone of `fg` reaching 4.5:1, else near-black or near-white.
 */
function pickInk(fg: Rgb, bg: Rgb): Rgb {
  const suggestion = suggestTextColor(fg, bg, "AA");
  const rgb = suggestion && parseHex(suggestion.hex);
  if (rgb) return rgb;
  return contrastRatio(FALLBACK_DARK, bg) >= contrastRatio(FALLBACK_LIGHT, bg)
    ? FALLBACK_DARK
    : FALLBACK_LIGHT;
}

/** Tint: ink mixed 90% toward the surface, nudged further if ink on tint falls below 4.5:1. */
function pickTint(ink: Rgb, surface: Rgb): Rgb {
  const at = (t: number) => mix(ink, surface, t);
  if (contrastRatio(ink, at(TINT_T)) >= INK_ON_TINT_MIN_RATIO)
    return at(TINT_T);
  let lo = TINT_T;
  let hi = 1;
  for (let i = 0; i < SEARCH_STEPS; i++) {
    const mid = (lo + hi) / 2;
    if (contrastRatio(ink, at(mid)) >= INK_ON_TINT_MIN_RATIO) hi = mid;
    else lo = mid;
  }
  return at(hi);
}

/**
 * Derives the roles of the app chrome from the chosen pair, so the interface
 * stays readable whatever the person picks. See DESIGN.md, section Theme.
 */
export function deriveTheme(fg: Rgb, bg: Rgb): Theme {
  const ink = pickInk(fg, bg);
  return {
    surface: toHex(bg),
    ink: toHex(ink),
    inkMuted: toHex(fadeToward(ink, bg, MUTED_MIN_RATIO)),
    line: toHex(fadeToward(ink, bg, LINE_MIN_RATIO)),
    hairline: toHex(mix(ink, bg, HAIRLINE_T)),
    tint: toHex(pickTint(ink, bg)),
  };
}

/** CSS custom properties for the app root. */
export function themeToCssVars(theme: Theme): Record<string, string> {
  return {
    "--cc-surface": theme.surface,
    "--cc-ink": theme.ink,
    "--cc-ink-muted": theme.inkMuted,
    "--cc-line": theme.line,
    "--cc-hairline": theme.hairline,
    "--cc-tint": theme.tint,
  };
}
