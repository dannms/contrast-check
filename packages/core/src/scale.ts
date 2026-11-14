import { contrastRatio, parseHex, type Rgb, toHex } from "./color";
import { formatOklch, oklchToRgb, rgbToOklch } from "./oklch";

export const SCALE_STEPS = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;
export type StepName = (typeof SCALE_STEPS)[number];

export type ScaleStep = {
  name: StepName;
  hex: string;
  oklch: string;
  anchored: boolean;
};

export type Use = "text-aaa" | "text-aa" | "large-ui" | "decorative";
export type AnnotatedStep = ScaleStep & { ratio: number; use: Use };

// OKLCH lightness of each step, light to dark (aligned with SCALE_STEPS).
const LIGHTNESS_LADDER = [
  0.97, 0.93, 0.87, 0.79, 0.7, 0.61, 0.52, 0.44, 0.37, 0.3, 0.24,
] as const;

// Share of the seed chroma kept at each step: tapers toward both ends.
const CHROMA_TAPER = [
  0.15, 0.3, 0.55, 0.8, 0.95, 1, 0.95, 0.85, 0.7, 0.55, 0.4,
] as const;

function step(name: StepName, rgb: Rgb, anchored: boolean): ScaleStep {
  return {
    name,
    hex: toHex(rgb),
    oklch: formatOklch(rgbToOklch(rgb)),
    anchored,
  };
}

/**
 * Eleven steps (50 to 950, light to dark) built from a seed in OKLCH: a fixed
 * lightness ladder, the seed's hue, and chroma tapering toward both ends,
 * gamut-mapped. The seed replaces the step whose ladder lightness is closest to
 * its own, so its hex is kept exactly and that step is marked `anchored`.
 */
export function scaleFor(seedHex: string): ScaleStep[] {
  const seed = parseHex(seedHex);
  if (!seed) throw new RangeError(`Invalid seed color: ${seedHex}`);
  const origin = rgbToOklch(seed);

  let anchorIndex = 0;
  let anchorDistance = Number.POSITIVE_INFINITY;
  LIGHTNESS_LADDER.forEach((l, i) => {
    const distance = Math.abs(l - origin.l);
    if (distance < anchorDistance) {
      anchorIndex = i;
      anchorDistance = distance;
    }
  });

  return SCALE_STEPS.map((name, i) => {
    if (i === anchorIndex) return step(name, seed, true);
    const color = oklchToRgb({
      l: LIGHTNESS_LADDER[i] ?? 0,
      c: origin.c * (CHROMA_TAPER[i] ?? 1),
      h: origin.h,
    });
    return step(name, color, false);
  });
}

function useFor(ratio: number): Use {
  if (ratio >= 7) return "text-aaa";
  if (ratio >= 4.5) return "text-aa";
  if (ratio >= 3) return "large-ui";
  return "decorative";
}

/** Adds, to each step, its contrast ratio against a background and the highest use it allows. */
export function annotateScale(
  scale: ScaleStep[],
  backgroundHex: string,
): AnnotatedStep[] {
  const background = parseHex(backgroundHex);
  if (!background) throw new RangeError(`Invalid background: ${backgroundHex}`);
  return scale.map((s) => {
    const color = parseHex(s.hex);
    const ratio = color ? contrastRatio(color, background) : 1;
    return { ...s, ratio, use: useFor(ratio) };
  });
}
