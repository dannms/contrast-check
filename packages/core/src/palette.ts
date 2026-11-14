import { contrastRatio, parseHex, type Rgb, toHex } from "./color";

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
