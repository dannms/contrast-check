import { describe, expect, it } from "vitest";
import { contrastRatio, parseHex, type Rgb } from "./color";
import {
  checkPalette,
  fixPair,
  labelColorFor,
  type Palette,
  type PaletteOptions,
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

describe("fixPair", () => {
  const passingIds = (palette: Palette, options: PaletteOptions = AA) =>
    checkPalette(palette, options)
      .filter((r) => r.pass)
      .map((r) => r.id);

  it("returns the palette unchanged when the pair already passes", () => {
    const result = fixPair(EXAMPLE, "text-on-background", AA);
    expect(result.palette).toEqual(EXAMPLE);
  });

  it("fixes the text color only, keeping its seed", () => {
    const palette = makePalette({
      text: "#777777",
      background: "#FFFFFF",
      primary: "#2F5BD8",
      secondary: "#E9ECF5",
      accent: "#C2410C",
    });
    const result = fixPair(palette, "text-on-background", AA);
    expect(result.palette).not.toBeNull();
    if (!result.palette) return;
    expect(result.palette.text.seed).toBe("#777777");
    expect(result.palette.text.active).not.toBe("#777777");
    const pair = checkPalette(result.palette, AA)[0];
    expect(pair?.pass).toBe(true);
    expect(result.palette.background).toEqual(palette.background);
    expect(result.palette.primary).toEqual(palette.primary);
  });

  it("fixes a label without breaking the primary against the background", () => {
    // Primary passes as a boundary (4.29:1 on white, needs 3) but fails as a
    // button fill: neither the white nor the dark label reaches 4.5:1.
    const palette = makePalette({
      text: "#1C1D22",
      background: "#FFFFFF",
      primary: "#7A7A7A",
      secondary: "#E9ECF5",
      accent: "#C2410C",
    });
    const before = checkPalette(palette, AA);
    expect(before.find((r) => r.id === "label-on-primary")?.pass).toBe(false);
    expect(before.find((r) => r.id === "primary-vs-background")?.pass).toBe(
      true,
    );
    const result = fixPair(palette, "label-on-primary", AA);
    expect(result.palette).not.toBeNull();
    if (!result.palette) return;
    const after = checkPalette(result.palette, AA);
    expect(after.find((r) => r.id === "label-on-primary")?.pass).toBe(true);
    expect(after.find((r) => r.id === "primary-vs-background")?.pass).toBe(
      true,
    );
    expect(result.palette.primary.seed).toBe("#7A7A7A");
  });

  it("fixes text when it is also the label on primary, keeping that label passing", () => {
    // Text is the better label on the white primary; darker text only helps.
    const palette = makePalette({
      text: "#333333",
      background: "#808080",
      primary: "#FFFFFF",
      secondary: "#E9ECF5",
      accent: "#101010",
    });
    const before = checkPalette(palette, AA);
    expect(before.find((r) => r.id === "text-on-background")?.pass).toBe(false);
    expect(before.find((r) => r.id === "label-on-primary")?.pass).toBe(true);
    const result = fixPair(palette, "text-on-background", AA);
    expect(result.palette).not.toBeNull();
    if (!result.palette) return;
    const after = checkPalette(result.palette, AA);
    expect(after.find((r) => r.id === "text-on-background")?.pass).toBe(true);
    expect(after.find((r) => r.id === "label-on-primary")?.pass).toBe(true);
  });

  it("reports the blocking pair when no text color can fix it without breaking another", () => {
    // Light text is the label on the dark primary (8.2:1). The only text colors that
    // pass on the mid-gray background are darker than the primary, which would make
    // the background the label on primary, at 3.3:1.
    const palette = makePalette({
      text: "#CCCCCC",
      background: "#808080",
      primary: "#303030",
      secondary: "#E9ECF5",
      accent: "#101010",
    });
    const before = checkPalette(palette, AA);
    expect(before.find((r) => r.id === "text-on-background")?.pass).toBe(false);
    expect(before.find((r) => r.id === "label-on-primary")?.pass).toBe(true);
    const result = fixPair(palette, "text-on-background", AA);
    expect(result).toEqual({
      palette: null,
      blockedBy: ["label-on-primary"],
    });
  });

  it("never breaks a pair that passed, over the example and failing palettes", () => {
    const palettes = [
      EXAMPLE,
      makePalette({
        text: "#777777",
        background: "#FFFFFF",
        primary: "#7A7A7A",
        secondary: "#E9ECF5",
        accent: "#C2410C",
      }),
      makePalette({
        text: "#9A9A9A",
        background: "#F2F2F2",
        primary: "#B5C4F0",
        secondary: "#EEEEEE",
        accent: "#FF8040",
      }),
    ];
    for (const palette of palettes) {
      for (const options of [AA, AAA]) {
        const passedBefore = passingIds(palette, options);
        for (const { id } of checkPalette(palette, options)) {
          const result = fixPair(palette, id, options);
          if (!result.palette) continue;
          const after = checkPalette(result.palette, options);
          for (const passedId of passedBefore) {
            expect(after.find((r) => r.id === passedId)?.pass).toBe(true);
          }
          expect(after.find((r) => r.id === id)?.pass).toBe(true);
        }
      }
    }
  });

  it("works with gray roles and never yields NaN or an invalid hex", () => {
    const gray = makePalette({
      text: "#808080",
      background: "#808080",
      primary: "#808080",
      secondary: "#808080",
      accent: "#808080",
    });
    for (const { id } of checkPalette(gray, AA)) {
      const result = fixPair(gray, id, AA);
      if (!result.palette) continue;
      for (const role of ROLES) {
        expect(result.palette[role].active).toMatch(/^#[0-9A-F]{6}$/);
      }
    }
  });
});
