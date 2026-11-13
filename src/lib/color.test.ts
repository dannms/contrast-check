import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  evaluate,
  formatRatio,
  parseHex,
  rgbToHsl,
  suggestTextColor,
  toHex,
} from "./color";

const rgb = (hex: string) => {
  const parsed = parseHex(hex);
  if (!parsed) throw new Error(`bad fixture ${hex}`);
  return parsed;
};

const ratio = (fg: string, bg: string) => contrastRatio(rgb(fg), rgb(bg));

describe("parseHex", () => {
  it("accepts #RRGGBB", () => {
    expect(parseHex("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHex("#767676")).toEqual({ r: 118, g: 118, b: 118 });
  });

  it("accepts #RGB and expands it", () => {
    expect(parseHex("#FFF")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHex("#a0c")).toEqual({ r: 170, g: 0, b: 204 });
  });

  it("rejects invalid values", () => {
    for (const bad of [
      "",
      "#",
      "#FF",
      "#FFFF",
      "#FFFFF",
      "#GGGGGG",
      "red",
      "#12345678",
    ]) {
      expect(parseHex(bad)).toBeNull();
    }
  });
});

describe("contrastRatio", () => {
  it("matches WCAG reference values", () => {
    expect(ratio("#000000", "#FFFFFF").toFixed(2)).toBe("21.00");
    expect(ratio("#FFFFFF", "#FFFFFF").toFixed(2)).toBe("1.00");
    expect(ratio("#767676", "#FFFFFF").toFixed(2)).toBe("4.54");
    expect(ratio("#777777", "#FFFFFF").toFixed(2)).toBe("4.48");
  });

  it("is symmetric", () => {
    expect(ratio("#123456", "#FEDCBA")).toBeCloseTo(
      ratio("#FEDCBA", "#123456"),
    );
  });
});

describe("evaluate", () => {
  it("passes AA normal at 4.54:1", () => {
    const result = evaluate(rgb("#767676"), rgb("#FFFFFF"));
    expect(formatRatio(result.ratio)).toBe("4.54:1");
    const byId = Object.fromEntries(result.criteria.map((c) => [c.id, c.pass]));
    expect(byId).toEqual({
      "aa-normal": true,
      "aa-large": true,
      "aaa-normal": false,
      "aaa-large": true,
      ui: true,
    });
  });

  it("fails AA normal at 4.48:1", () => {
    const result = evaluate(rgb("#777777"), rgb("#FFFFFF"));
    expect(result.criteria.find((c) => c.id === "aa-normal")?.pass).toBe(false);
    expect(result.criteria.find((c) => c.id === "aa-large")?.pass).toBe(true);
  });
});

describe("suggestTextColor", () => {
  it("reaches AA while preserving hue", () => {
    const fg = rgb("#FF8040");
    const bg = rgb("#FFFFFF");
    const suggestion = suggestTextColor(fg, bg, "AA");
    expect(suggestion).not.toBeNull();
    const out = rgb(suggestion?.hex ?? "");
    expect(contrastRatio(out, bg)).toBeGreaterThanOrEqual(4.5);
    const hueDiff = Math.abs(rgbToHsl(out).h - rgbToHsl(fg).h);
    expect(Math.min(hueDiff, 360 - hueDiff)).toBeLessThan(3);
  });

  it("reaches AAA", () => {
    const suggestion = suggestTextColor(rgb("#3366CC"), rgb("#FFFFFF"), "AAA");
    expect(suggestion?.ratio).toBeGreaterThanOrEqual(7);
  });

  it("returns the original color when it already passes", () => {
    const suggestion = suggestTextColor(rgb("#000000"), rgb("#FFFFFF"), "AA");
    expect(suggestion?.hex).toBe("#000000");
  });

  it("goes lighter on a dark background", () => {
    const fg = rgb("#404060");
    const suggestion = suggestTextColor(fg, rgb("#101010"), "AA");
    expect(suggestion).not.toBeNull();
    expect(rgbToHsl(rgb(suggestion?.hex ?? "")).l).toBeGreaterThan(
      rgbToHsl(fg).l,
    );
    expect(suggestion?.ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("returns null when the target is unreachable", () => {
    expect(suggestTextColor(rgb("#888888"), rgb("#777777"), "AAA")).toBeNull();
  });
});

describe("toHex", () => {
  it("formats uppercase #RRGGBB", () => {
    expect(toHex(rgb("#0af"))).toBe("#00AAFF");
  });
});
