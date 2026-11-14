import type { Rgb } from "./color";

/** OKLCH: perceptual lightness l (0..1), chroma c (>= 0), hue h in degrees (0..360). */
export type Oklch = { l: number; c: number; h: number };

// Below this chroma a color is treated as gray and its hue as 0.
const GRAY_CHROMA = 1e-4;
// Tolerance for float noise when testing whether a linear channel is in 0..1.
const GAMUT_EPSILON = 1e-6;
const GAMUT_STEPS = 24;

function toLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function fromLinear(value: number): number {
  const v = Math.min(1, Math.max(0, value));
  const c = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.round(c * 255);
}

/** sRGB to OKLCH, through linear sRGB and OKLab (Ottosson matrices). */
export function rgbToOklch({ r, g, b }: Rgb): Oklch {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
  );

  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const chroma = Math.hypot(a, bb);
  if (chroma < GRAY_CHROMA) return { l: lightness, c: chroma, h: 0 };
  const hue = (Math.atan2(bb, a) * 180) / Math.PI;
  return { l: lightness, c: chroma, h: (hue + 360) % 360 };
}

/** Linear sRGB channels of an OKLCH color (not clamped). */
function toLinearRgb({ l, c, h }: Oklch): [number, number, number] {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);

  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

function inGamut(color: Oklch): boolean {
  return toLinearRgb(color).every(
    (v) => v >= -GAMUT_EPSILON && v <= 1 + GAMUT_EPSILON,
  );
}

/**
 * OKLCH to sRGB. A color outside the sRGB gamut keeps its lightness and hue and
 * loses chroma: the largest in-gamut chroma is found by binary search.
 */
export function oklchToRgb(color: Oklch): Rgb {
  const l = Math.min(1, Math.max(0, color.l));
  let chroma = Math.max(0, color.c);
  const candidate = { l, c: chroma, h: color.h };

  if (!inGamut(candidate)) {
    let lo = 0;
    let hi = chroma;
    for (let i = 0; i < GAMUT_STEPS; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut({ l, c: mid, h: color.h })) lo = mid;
      else hi = mid;
    }
    chroma = lo;
  }

  const [r, g, b] = toLinearRgb({ l, c: chroma, h: color.h });
  return { r: fromLinear(r), g: fromLinear(g), b: fromLinear(b) };
}

/** Formats a color as a CSS function: `oklch(L C H)` with 3, 4 and 2 decimals. */
export function formatOklch({ l, c, h }: Oklch): string {
  return `oklch(${l.toFixed(3)} ${c.toFixed(4)} ${h.toFixed(2)})`;
}
