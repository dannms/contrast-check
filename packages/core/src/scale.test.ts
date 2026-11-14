import { describe, expect, it } from "vitest";
import { contrastRatio, parseHex, type Rgb } from "./color";
import { rgbToOklch } from "./oklch";
import { annotateScale, SCALE_STEPS, scaleFor } from "./scale";

const rgb = (hex: string): Rgb => {
  const parsed = parseHex(hex);
  if (!parsed) throw new Error(`bad fixture ${hex}`);
  return parsed;
};

const hueDiff = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};

const HEX = /^#[0-9A-F]{6}$/;

describe("scaleFor", () => {
  const scale = scaleFor("#2F5BD8");

  it("has 11 steps named 50 to 950 with strictly decreasing lightness", () => {
    expect(scale.map((s) => s.name)).toEqual([...SCALE_STEPS]);
    const lightness = scale.map((s) => rgbToOklch(rgb(s.hex)).l);
    for (let i = 1; i < lightness.length; i++) {
      expect(lightness[i]).toBeLessThan(lightness[i - 1] ?? 0);
    }
  });

  it("anchors the seed exactly on one step", () => {
    const anchored = scale.filter((s) => s.anchored);
    expect(anchored).toHaveLength(1);
    expect(anchored[0]?.hex).toBe("#2F5BD8");
  });

  it("keeps the hue of the seed on every chromatic step", () => {
    const seedHue = rgbToOklch(rgb("#2F5BD8")).h;
    for (const step of scale) {
      const { c, h } = rgbToOklch(rgb(step.hex));
      if (c < 0.01) continue;
      expect(hueDiff(h, seedHue)).toBeLessThan(2);
    }
  });

  it("gives every step a valid hex and an oklch string", () => {
    for (const step of scale) {
      expect(step.hex).toMatch(HEX);
      expect(step.oklch).toMatch(
        /^oklch\(\d\.\d{3} \d\.\d{4} \d{1,3}\.\d{2}\)$/,
      );
    }
  });

  it("produces finite values for a gray seed (no NaN)", () => {
    const gray = scaleFor("#808080");
    expect(gray).toHaveLength(11);
    for (const step of gray) {
      expect(step.hex).toMatch(HEX);
      expect(step.oklch).not.toContain("NaN");
    }
  });

  it("handles pure white and pure black seeds", () => {
    for (const seed of ["#FFFFFF", "#000000"]) {
      const s = scaleFor(seed);
      expect(s).toHaveLength(11);
      for (const step of s) expect(step.hex).toMatch(HEX);
      const anchored = s.filter((x) => x.anchored);
      expect(anchored).toHaveLength(1);
      expect(anchored[0]?.hex).toBe(seed);
    }
  });
});

describe("annotateScale", () => {
  it("assigns the highest allowed use from the ratio bands", () => {
    const annotated = annotateScale(scaleFor("#2F5BD8"), "#FFFFFF");
    expect(annotated).toHaveLength(11);
    for (const step of annotated) {
      expect(step.ratio).toBeCloseTo(
        contrastRatio(rgb(step.hex), rgb("#FFFFFF")),
        10,
      );
      const expected =
        step.ratio >= 7
          ? "text-aaa"
          : step.ratio >= 4.5
            ? "text-aa"
            : step.ratio >= 3
              ? "large-ui"
              : "decorative";
      expect(step.use).toBe(expected);
    }
    // Light steps are decorative on white and dark steps allow any text.
    expect(annotated[0]?.use).toBe("decorative");
    expect(annotated[10]?.use).toBe("text-aaa");
  });
});
