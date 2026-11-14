import { describe, expect, it } from "vitest";
import { contrastRatio, parseHex, type Rgb } from "./color";
import {
  checkPalette,
  labelColorFor,
  type Palette,
  paletteVerdict,
  ROLES,
  type Role,
} from "./palette";

const rgb = (hex: string): Rgb => {
  const parsed = parseHex(hex);
  if (!parsed) throw new Error(`bad fixture ${hex}`);
  return parsed;
};

/** A palette whose roles have seed equal to active. */
const makePalette = (colors: Record<Role, string>): Palette =>
  Object.fromEntries(
    ROLES.map((role) => [role, { seed: colors[role], active: colors[role] }]),
  ) as Palette;

// The example values of the design (a passing, light palette).
const EXAMPLE = makePalette({
  text: "#1C1D22",
  background: "#FAFAF7",
  primary: "#2F5BD8",
  secondary: "#E9ECF5",
  accent: "#C2410C",
});

const AA = { level: "AA", accentAsText: true } as const;
const AAA = { level: "AAA", accentAsText: true } as const;

describe("checkPalette", () => {
  it("returns six pairs with accent as text and five without, in order", () => {
    const six = checkPalette(EXAMPLE, AA);
    expect(six.map((r) => r.id)).toEqual([
      "text-on-background",
      "label-on-primary",
      "primary-vs-background",
      "label-on-secondary",
      "accent-vs-background",
      "accent-as-text",
    ]);
    const five = checkPalette(EXAMPLE, { level: "AA", accentAsText: false });
    expect(five.map((r) => r.id)).not.toContain("accent-as-text");
    expect(five).toHaveLength(5);
  });

  it("uses 4.5 for text pairs and 3 for UI pairs at AA", () => {
    expect(checkPalette(EXAMPLE, AA).map((r) => r.threshold)).toEqual([
      4.5, 4.5, 3, 4.5, 3, 4.5,
    ]);
  });

  it("raises only the text pairs to 7 at AAA", () => {
    expect(checkPalette(EXAMPLE, AAA).map((r) => r.threshold)).toEqual([
      7, 7, 3, 7, 3, 7,
    ]);
  });

  it("names the role a fix would change", () => {
    expect(checkPalette(EXAMPLE, AA).map((r) => r.fixRole)).toEqual([
      "text",
      "primary",
      "primary",
      "secondary",
      "accent",
      "accent",
    ]);
  });

  it("reports the ratio of the pair's own colors", () => {
    for (const result of checkPalette(EXAMPLE, AA)) {
      expect(result.ratio).toBeCloseTo(
        contrastRatio(rgb(result.foreground), rgb(result.backgroundColor)),
        10,
      );
      expect(result.pass).toBe(result.ratio >= result.threshold);
    }
  });

  it("labels the pairs", () => {
    expect(checkPalette(EXAMPLE, AA).map((r) => r.label)).toEqual([
      "Text on background",
      "Label on primary",
      "Primary against background",
      "Label on secondary",
      "Accent against background",
      "Accent as text",
    ]);
  });

  it("uses the active color of each role, not the seed", () => {
    const edited: Palette = {
      ...EXAMPLE,
      text: { seed: "#1C1D22", active: "#FAFAF7" },
    };
    const first = checkPalette(edited, AA)[0];
    expect(first?.foreground).toBe("#FAFAF7");
    expect(first?.pass).toBe(false);
  });
});

describe("labelColorFor", () => {
  it("picks the background when it contrasts more with the fill than the text", () => {
    expect(labelColorFor("#2F5BD8", EXAMPLE)).toBe("#FAFAF7");
  });

  it("picks the text when it contrasts more", () => {
    expect(labelColorFor("#E9ECF5", EXAMPLE)).toBe("#1C1D22");
  });
});

describe("paletteVerdict", () => {
  const passing = checkPalette(EXAMPLE, AA);
  const failing = checkPalette(
    makePalette({
      text: "#1C1D22",
      background: "#FAFAF7",
      primary: "#FAFAF7",
      secondary: "#E9ECF5",
      accent: "#FAFAF7",
    }),
    AA,
  );

  it("summarizes a passing palette", () => {
    expect(paletteVerdict(passing, "AA")).toBe("Passes AA · 6 of 6 pairs");
    expect(paletteVerdict(passing, "AAA")).toBe("Passes AAA · 6 of 6 pairs");
  });

  it("counts the failing pairs", () => {
    const failed = failing.filter((r) => !r.pass).length;
    expect(failed).toBeGreaterThan(0);
    expect(paletteVerdict(failing, "AA")).toBe(
      `Fails AA · ${failed} of 6 pairs fail`,
    );
    expect(paletteVerdict(failing, "AAA")).toBe(
      `Fails AAA · ${failed} of 6 pairs fail`,
    );
  });
});
