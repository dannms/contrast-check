import {
  contrastRatio,
  type Rgb,
  type Suggestion,
  type SuggestionTarget,
  TARGET_THRESHOLDS,
  toHex,
} from "./color";
import { oklchToRgb, rgbToOklch } from "./oklch";

// Lightness is sampled from 0 to 1 in this many steps (1001 candidates).
const LIGHTNESS_STEPS = 1000;

/**
 * The one lightness search of the product, used by the text suggestion, the
 * derived theme and the palette fix.
 *
 * It keeps the OKLCH hue and chroma of `base` (gamut-mapped) and varies only the
 * perceptual lightness L. A candidate is acceptable when its contrast with
 * `against` is at least `threshold` and `accept` (if given) returns true. The
 * result is the acceptable candidate whose L is closest to the base's; a tie goes
 * to the darker one. `base` itself comes back when it is already acceptable, and
 * `null` when no candidate is.
 *
 * It samples instead of bisecting because two things make "acceptable" non
 * monotonic in L: contrast dips where the candidate's luminance crosses the
 * background's, and an `accept` callback can reject any candidate.
 */
export function closestPassingLightness(
  base: Rgb,
  against: Rgb,
  threshold: number,
  accept?: (candidate: Rgb) => boolean,
): Rgb | null {
  const acceptable = (candidate: Rgb) =>
    contrastRatio(candidate, against) >= threshold &&
    (accept ? accept(candidate) : true);

  if (acceptable(base)) return base;

  const origin = rgbToOklch(base);
  let best: Rgb | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i <= LIGHTNESS_STEPS; i++) {
    const l = i / LIGHTNESS_STEPS;
    const candidate = oklchToRgb({ l, c: origin.c, h: origin.h });
    if (!acceptable(candidate)) continue;
    const distance = Math.abs(l - origin.l);
    // Ascending L, so a strict comparison keeps the darker candidate on a tie.
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }

  return best;
}

/**
 * Suggests the closest text color that reaches the target contrast on `bg`.
 *
 * It keeps the OKLCH hue and chroma of `fg` and changes only the perceptual
 * lightness (see `closestPassingLightness`). The color comes back unchanged when
 * it already passes, and `null` when no lightness can reach the target.
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
