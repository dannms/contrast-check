import { contrastRatio, parseHex, type Rgb, toHex } from "./color";
import { closestPassingLightness } from "./lightness";

export const ROLES = [
  "text",
  "background",
  "primary",
  "secondary",
  "accent",
] as const;
export type Role = (typeof ROLES)[number];

/** `seed` builds the scale; `active` is the color used in pairs, preview and export. */
export type RoleColor = { seed: string; active: string };
export type Palette = Record<Role, RoleColor>;

export type Level = "AA" | "AAA";
export type PaletteOptions = { level: Level; accentAsText: boolean };

export type PairId =
  | "text-on-background"
  | "label-on-primary"
  | "primary-vs-background"
  | "label-on-secondary"
  | "accent-vs-background"
  | "accent-as-text";

export type PairResult = {
  id: PairId;
  label: string;
  ratio: number;
  threshold: number;
  pass: boolean;
  /** The role a fix of this pair would change. */
  fixRole: Role;
  /** Colors of the pair, as uppercase hex. */
  foreground: string;
  backgroundColor: string;
};

const BLACK: Rgb = { r: 0, g: 0, b: 0 };
const UI_THRESHOLD = 3;

const rgbOf = (hex: string): Rgb => parseHex(hex) ?? BLACK;
const hexOf = (hex: string): string => toHex(rgbOf(hex));

function textThreshold(level: Level): number {
  return level === "AAA" ? 7 : 4.5;
}

/** Whichever of the background and the text color contrasts more with `fill`. */
export function labelColorFor(fill: string, palette: Palette): string {
  const fillRgb = rgbOf(fill);
  const background = hexOf(palette.background.active);
  const text = hexOf(palette.text.active);
  return contrastRatio(rgbOf(background), fillRgb) >=
    contrastRatio(rgbOf(text), fillRgb)
    ? background
    : text;
}

type PairSpec = {
  id: PairId;
  label: string;
  fixRole: Role;
  kind: "text" | "ui";
  colors: (palette: Palette) => { foreground: string; backgroundColor: string };
};

const PAIR_SPECS: readonly PairSpec[] = [
  {
    id: "text-on-background",
    label: "Text on background",
    fixRole: "text",
    kind: "text",
    colors: (p) => ({
      foreground: hexOf(p.text.active),
      backgroundColor: hexOf(p.background.active),
    }),
  },
  {
    id: "label-on-primary",
    label: "Label on primary",
    fixRole: "primary",
    kind: "text",
    colors: (p) => ({
      foreground: labelColorFor(p.primary.active, p),
      backgroundColor: hexOf(p.primary.active),
    }),
  },
  {
    id: "primary-vs-background",
    label: "Primary against background",
    fixRole: "primary",
    kind: "ui",
    colors: (p) => ({
      foreground: hexOf(p.primary.active),
      backgroundColor: hexOf(p.background.active),
    }),
  },
  {
    id: "label-on-secondary",
    label: "Label on secondary",
    fixRole: "secondary",
    kind: "text",
    colors: (p) => ({
      foreground: labelColorFor(p.secondary.active, p),
      backgroundColor: hexOf(p.secondary.active),
    }),
  },
  {
    id: "accent-vs-background",
    label: "Accent against background",
    fixRole: "accent",
    kind: "ui",
    colors: (p) => ({
      foreground: hexOf(p.accent.active),
      backgroundColor: hexOf(p.background.active),
    }),
  },
  {
    id: "accent-as-text",
    label: "Accent as text",
    fixRole: "accent",
    kind: "text",
    colors: (p) => ({
      foreground: hexOf(p.accent.active),
      backgroundColor: hexOf(p.background.active),
    }),
  },
];

/**
 * Every pair the roles form in an interface, with its ratio and verdict at the
 * chosen level. AAA raises only the text pairs to 7; UI pairs stay at 3. The
 * "accent as text" pair is included only when `options.accentAsText` is true.
 */
export function checkPalette(
  palette: Palette,
  options: PaletteOptions,
): PairResult[] {
  return PAIR_SPECS.filter(
    (spec) => spec.id !== "accent-as-text" || options.accentAsText,
  ).map((spec) => {
    const { foreground, backgroundColor } = spec.colors(palette);
    const ratio = contrastRatio(rgbOf(foreground), rgbOf(backgroundColor));
    const threshold =
      spec.kind === "text" ? textThreshold(options.level) : UI_THRESHOLD;
    return {
      id: spec.id,
      label: spec.label,
      ratio,
      threshold,
      pass: ratio >= threshold,
      fixRole: spec.fixRole,
      foreground,
      backgroundColor,
    };
  });
}

/** "Passes AA · 6 of 6 pairs" or "Fails AA · 2 of 6 pairs fail". */
export function paletteVerdict(results: PairResult[], level: Level): string {
  const failed = results.filter((r) => !r.pass).length;
  return failed === 0
    ? `Passes ${level} · ${results.length} of ${results.length} pairs`
    : `Fails ${level} · ${failed} of ${results.length} pairs fail`;
}

export type FixResult =
  | { palette: Palette }
  | { palette: null; blockedBy: PairId[] };

/**
 * Fixes one failing pair by changing only the `active` color of the pair's
 * `fixRole` (never its seed), with the OKLCH lightness search. A pair that
 * already passes (or is not checked) comes back as the same palette.
 *
 * A candidate is accepted only if the target pair passes and every pair that
 * passed before still passes. When no candidate satisfies both, the result is
 * `null` with the pairs the best unconstrained candidate would have broken.
 */
export function fixPair(
  palette: Palette,
  pairId: PairId,
  options: PaletteOptions,
): FixResult {
  const before = checkPalette(palette, options);
  const target = before.find((r) => r.id === pairId);
  if (!target || target.pass) return { palette };

  const role = target.fixRole;
  const passedBefore = before.filter((r) => r.pass).map((r) => r.id);
  const withActive = (hex: string): Palette => ({
    ...palette,
    [role]: { ...palette[role], active: hex },
  });

  // For a label pair the changed role is the fill, so the search runs against the label.
  const against = rgbOf(
    pairId.startsWith("label-on-") ? target.foreground : target.backgroundColor,
  );
  const base = rgbOf(palette[role].active);

  const accept = (candidate: Rgb): boolean => {
    const after = checkPalette(withActive(toHex(candidate)), options);
    const passes = (id: PairId) =>
      after.find((r) => r.id === id)?.pass === true;
    return passes(pairId) && passedBefore.every(passes);
  };

  const fixed = closestPassingLightness(
    base,
    against,
    target.threshold,
    accept,
  );
  if (fixed) return { palette: withActive(toHex(fixed)) };

  const unconstrained = closestPassingLightness(
    base,
    against,
    target.threshold,
  );
  if (!unconstrained) return { palette: null, blockedBy: [] };
  const after = checkPalette(withActive(toHex(unconstrained)), options);
  const blockedBy = passedBefore.filter(
    (id) => after.find((r) => r.id === id)?.pass !== true,
  );
  return { palette: null, blockedBy };
}
