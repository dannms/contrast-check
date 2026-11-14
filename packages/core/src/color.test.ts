import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  evaluate,
  formatRatio,
  parseHex,
  suggestTextColor,
  summarize,
  toHex,
  verdict,
} from "./color";
import { rgbToOklch } from "./oklch";

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
    const hueDiff = Math.abs(rgbToOklch(out).h - rgbToOklch(fg).h);
    expect(Math.min(hueDiff, 360 - hueDiff)).toBeLessThan(2);
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
    expect(rgbToOklch(rgb(suggestion?.hex ?? "")).l).toBeGreaterThan(
      rgbToOklch(fg).l,
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

describe("summarize", () => {
  it("lists passing and failing criteria", () => {
    expect(summarize(evaluate(rgb("#767676"), rgb("#FFFFFF")))).toBe(
      "4.54:1. Passes AA normal text, AA large text, AAA large text, UI components and graphics. Fails AAA normal text.",
    );
  });

  it("says all criteria pass without an empty list", () => {
    expect(summarize(evaluate(rgb("#000000"), rgb("#FFFFFF")))).toBe(
      "21.00:1. Passes all criteria.",
    );
  });

  it("says all criteria fail without an empty list", () => {
    expect(summarize(evaluate(rgb("#FFFFFF"), rgb("#FFFFFF")))).toBe(
      "1.00:1. Fails all criteria.",
    );
  });
});

describe("verdict", () => {
  const at = (ratio: number) => ({ ratio, criteria: [] });

  it("covers the four bands with their boundaries", () => {
    expect(verdict(at(21))).toBe("Passes AAA for all text.");
    expect(verdict(at(7))).toBe("Passes AAA for all text.");
    expect(verdict(at(6.99))).toBe("Passes AA. AAA needs 7:1.");
    expect(verdict(at(4.5))).toBe("Passes AA. AAA needs 7:1.");
    expect(verdict(at(4.49))).toBe(
      "Large text and UI only. Normal text needs 4.5:1.",
    );
    expect(verdict(at(3))).toBe(
      "Large text and UI only. Normal text needs 4.5:1.",
    );
    expect(verdict(at(2.99))).toBe(
      "Fails every criterion. Normal text needs 4.5:1.",
    );
    expect(verdict(at(1))).toBe(
      "Fails every criterion. Normal text needs 4.5:1.",
    );
  });

  it("matches the reference pairs", () => {
    expect(verdict(evaluate(rgb("#000000"), rgb("#FFFFFF")))).toBe(
      "Passes AAA for all text.",
    );
    expect(verdict(evaluate(rgb("#767676"), rgb("#FFFFFF")))).toBe(
      "Passes AA. AAA needs 7:1.",
    );
    expect(verdict(evaluate(rgb("#777777"), rgb("#FFFFFF")))).toBe(
      "Large text and UI only. Normal text needs 4.5:1.",
    );
    expect(verdict(evaluate(rgb("#FFFFFF"), rgb("#FFFFFF")))).toBe(
      "Fails every criterion. Normal text needs 4.5:1.",
    );
  });
});
