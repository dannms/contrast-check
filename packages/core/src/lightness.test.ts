import { describe, expect, it } from "vitest";
import { contrastRatio, parseHex, type Rgb, toHex } from "./color";
import { closestPassingLightness } from "./lightness";
import { rgbToOklch } from "./oklch";

const rgb = (hex: string): Rgb => {
  const parsed = parseHex(hex);
  if (!parsed) throw new Error(`bad fixture ${hex}`);
  return parsed;
};

const hueDiff = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};

describe("closestPassingLightness", () => {
  it("returns the base unchanged when it already passes", () => {
    const result = closestPassingLightness(rgb("#000000"), rgb("#FFFFFF"), 4.5);
    expect(result && toHex(result)).toBe("#000000");
  });

  it("darkens a gray on white to reach 4.5:1", () => {
    const base = rgb("#777777");
    const white = rgb("#FFFFFF");
    const result = closestPassingLightness(base, white, 4.5);
    expect(result).not.toBeNull();
    if (!result) return;
    expect(contrastRatio(result, white)).toBeGreaterThanOrEqual(4.5);
    expect(rgbToOklch(result).l).toBeLessThan(rgbToOklch(base).l);
  });

  it("lightens a blue on a dark background and keeps its hue", () => {
    const base = rgb("#5B7BB5");
    const dark = rgb("#12151C");
    const result = closestPassingLightness(base, dark, 4.5);
    expect(result).not.toBeNull();
    if (!result) return;
    expect(contrastRatio(result, dark)).toBeGreaterThanOrEqual(4.5);
    expect(rgbToOklch(result).l).toBeGreaterThan(rgbToOklch(base).l);
    expect(hueDiff(rgbToOklch(result).h, rgbToOklch(base).h)).toBeLessThan(2);
  });

  it("returns null when no lightness can reach the threshold", () => {
    expect(
      closestPassingLightness(rgb("#888888"), rgb("#777777"), 7),
    ).toBeNull();
  });

  it("honors the accept constraint", () => {
    const base = rgb("#777777");
    const white = rgb("#FFFFFF");
    const free = closestPassingLightness(base, white, 4.5);
    expect(free).not.toBeNull();
    if (!free) return;
    const freeHex = toHex(free);
    const constrained = closestPassingLightness(
      base,
      white,
      4.5,
      (candidate) => toHex(candidate) !== freeHex,
    );
    expect(constrained).not.toBeNull();
    if (!constrained) return;
    expect(toHex(constrained)).not.toBe(freeHex);
    expect(contrastRatio(constrained, white)).toBeGreaterThanOrEqual(4.5);
  });
});
