import { describe, expect, it } from "vitest";
import { checkPalette, type Palette } from "./palette";
import {
  buildPaletteQuery,
  DEFAULT_PALETTE,
  DEFAULT_PALETTE_OPTIONS,
  parsePaletteQuery,
} from "./url-state";

const toParams = (query: string): Record<string, string> =>
  Object.fromEntries(new URLSearchParams(query));

describe("DEFAULT_PALETTE", () => {
  it("passes every pair at AA with accent as text", () => {
    const results = checkPalette(DEFAULT_PALETTE, DEFAULT_PALETTE_OPTIONS);
    expect(results).toHaveLength(6);
    for (const result of results) {
      expect(result.pass, `${result.id} at ${result.ratio.toFixed(2)}`).toBe(
        true,
      );
    }
  });

  it("has the design's colors, with seed equal to active", () => {
    expect(DEFAULT_PALETTE.text).toEqual({
      seed: "#1C1D22",
      active: "#1C1D22",
    });
    expect(DEFAULT_PALETTE.background.seed).toBe("#FAFAF7");
    expect(DEFAULT_PALETTE.primary.seed).toBe("#2F5BD8");
    expect(DEFAULT_PALETTE.secondary.seed).toBe("#E9ECF5");
    expect(DEFAULT_PALETTE.accent.seed).toBe("#C2410C");
    expect(DEFAULT_PALETTE_OPTIONS).toEqual({
      level: "AA",
      accentAsText: true,
    });
  });
});

describe("buildPaletteQuery", () => {
  it("writes lowercase hex without #, and the active color only when it differs", () => {
    const edited: Palette = {
      ...DEFAULT_PALETTE,
      primary: { seed: "#2F5BD8", active: "#1E3A8A" },
    };
    const params = toParams(
      buildPaletteQuery(edited, { level: "AAA", accentAsText: false }),
    );
    expect(params).toEqual({
      text: "1c1d22",
      background: "fafaf7",
      primary: "2f5bd8.1e3a8a",
      secondary: "e9ecf5",
      accent: "c2410c",
      level: "AAA",
      accentText: "0",
    });
  });

  it("starts with a question mark and keeps the documented order", () => {
    const query = buildPaletteQuery(DEFAULT_PALETTE, DEFAULT_PALETTE_OPTIONS);
    expect(query.startsWith("?text=")).toBe(true);
    expect(query.indexOf("background=")).toBeGreaterThan(
      query.indexOf("text="),
    );
    expect(query.endsWith("accentText=1")).toBe(true);
  });
});

describe("parsePaletteQuery", () => {
  it("round-trips the default palette", () => {
    const query = buildPaletteQuery(DEFAULT_PALETTE, DEFAULT_PALETTE_OPTIONS);
    expect(parsePaletteQuery(toParams(query))).toEqual({
      palette: DEFAULT_PALETTE,
      options: DEFAULT_PALETTE_OPTIONS,
    });
  });

  it("round-trips a palette whose seed and active differ", () => {
    const edited: Palette = {
      ...DEFAULT_PALETTE,
      primary: { seed: "#2F5BD8", active: "#1E3A8A" },
      accent: { seed: "#C2410C", active: "#9A3412" },
    };
    const options = { level: "AAA", accentAsText: false } as const;
    expect(
      parsePaletteQuery(toParams(buildPaletteQuery(edited, options))),
    ).toEqual({ palette: edited, options });
  });

  it("reads seed.active", () => {
    const { palette } = parsePaletteQuery({ primary: "2f5bd8.1e3a8a" });
    expect(palette.primary).toEqual({ seed: "#2F5BD8", active: "#1E3A8A" });
  });

  it("falls back per role to the default for invalid values, without throwing", () => {
    const { palette } = parsePaletteQuery({
      text: "zzz",
      primary: "12345",
      accent: "c2410c.xyz",
    });
    expect(palette.text).toEqual(DEFAULT_PALETTE.text);
    expect(palette.primary).toEqual(DEFAULT_PALETTE.primary);
    // A bad active color only: the active color is the seed.
    expect(palette.accent).toEqual({ seed: "#C2410C", active: "#C2410C" });
    expect(palette.background).toEqual(DEFAULT_PALETTE.background);
  });

  it("falls back for a bad level, a bad accentText and missing params", () => {
    expect(parsePaletteQuery({ level: "AAAA" }).options.level).toBe("AA");
    expect(parsePaletteQuery({ level: "aaa" }).options.level).toBe("AAA");
    expect(parsePaletteQuery({ accentText: "yes" }).options.accentAsText).toBe(
      true,
    );
    expect(parsePaletteQuery({ accentText: "0" }).options.accentAsText).toBe(
      false,
    );
    expect(parsePaletteQuery({})).toEqual({
      palette: DEFAULT_PALETTE,
      options: DEFAULT_PALETTE_OPTIONS,
    });
  });

  it("takes the first value of a repeated param", () => {
    const { palette } = parsePaletteQuery({ text: ["000000", "ffffff"] });
    expect(palette.text.seed).toBe("#000000");
  });

  it("still loads legacy fg and bg links", () => {
    const { palette } = parsePaletteQuery({ fg: "777777", bg: "ffffff" });
    expect(palette.text).toEqual({ seed: "#777777", active: "#777777" });
    expect(palette.background).toEqual({ seed: "#FFFFFF", active: "#FFFFFF" });
    expect(palette.primary).toEqual(DEFAULT_PALETTE.primary);
    expect(palette.secondary).toEqual(DEFAULT_PALETTE.secondary);
    expect(palette.accent).toEqual(DEFAULT_PALETTE.accent);
  });
});
