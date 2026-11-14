import { describe, expect, it } from "vitest";
import { parseHex, type Rgb, toHex } from "./color";
import { formatOklch, type Oklch, oklchToRgb, rgbToOklch } from "./oklch";

const rgb = (hex: string): Rgb => {
  const parsed = parseHex(hex);
  if (!parsed) throw new Error(`bad fixture ${hex}`);
  return parsed;
};

const hueDiff = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};

describe("rgbToOklch", () => {
  const near = (actual: Oklch, expected: Oklch) => {
    expect(Math.abs(actual.l - expected.l)).toBeLessThan(0.001);
    expect(Math.abs(actual.c - expected.c)).toBeLessThan(0.001);
    expect(hueDiff(actual.h, expected.h)).toBeLessThan(0.1);
  };

  it("maps white and black to pure lightness", () => {
    const white = rgbToOklch(rgb("#FFFFFF"));
    expect(white.l).toBeCloseTo(1, 3);
    expect(white.c).toBeLessThan(0.0005);
    const black = rgbToOklch(rgb("#000000"));
    expect(black.l).toBeCloseTo(0, 3);
    expect(black.c).toBeLessThan(0.0005);
  });

  it("matches the published values of the sRGB primaries", () => {
    near(rgbToOklch(rgb("#FF0000")), { l: 0.628, c: 0.2577, h: 29.23 });
    near(rgbToOklch(rgb("#00FF00")), { l: 0.8664, c: 0.2948, h: 142.5 });
    near(rgbToOklch(rgb("#0000FF")), { l: 0.452, c: 0.3132, h: 264.05 });
  });

  it("maps a mid gray to zero chroma and hue 0", () => {
    const gray = rgbToOklch(rgb("#808080"));
    expect(gray.l).toBeCloseTo(0.5999, 3);
    expect(gray.c).toBeLessThan(0.0005);
    expect(gray.h).toBe(0);
  });
});

describe("oklchToRgb", () => {
  it("round-trips 8-bit colors exactly", () => {
    for (const hex of ["#FF3211", "#5B7BB5", "#12151C", "#777777"]) {
      expect(toHex(oklchToRgb(rgbToOklch(rgb(hex))))).toBe(hex);
    }
  });

  it("maps an out-of-gamut color into gamut by reducing chroma only", () => {
    const target: Oklch = { l: 0.7, c: 0.4, h: 150 };
    const mapped = oklchToRgb(target);
    for (const channel of [mapped.r, mapped.g, mapped.b]) {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(255);
    }
    const back = rgbToOklch(mapped);
    expect(Math.abs(back.l - target.l)).toBeLessThan(0.01);
    expect(hueDiff(back.h, target.h)).toBeLessThan(1);
    expect(back.c).toBeLessThan(target.c);
  });
});

describe("formatOklch", () => {
  it("formats with 3, 4 and 2 decimals", () => {
    expect(formatOklch(rgbToOklch(rgb("#FF0000")))).toBe(
      "oklch(0.628 0.2577 29.23)",
    );
  });
});
