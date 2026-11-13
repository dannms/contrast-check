import { describe, expect, it } from "vitest";
import { contrastRatio, parseHex, type Rgb, rgbToHsl } from "./color";
import { deriveTheme, fadeToward, mix, themeToCssVars } from "./theme";

const rgb = (hex: string): Rgb => {
  const parsed = parseHex(hex);
  if (!parsed) throw new Error(`bad fixture ${hex}`);
  return parsed;
};

const PAIRS: ReadonlyArray<[fg: string, bg: string]> = [
  ["#777777", "#FFFFFF"],
  ["#FF3211", "#FFFFFF"],
  ["#5B7BB5", "#12151C"],
  ["#EEEEEE", "#FFFFFF"],
  ["#808080", "#808080"],
  ["#000000", "#FFFFFF"],
  ["#FFFFFF", "#000000"],
  ["#FFFF00", "#FFFFFF"],
];

const ratio = (a: string, b: string) => contrastRatio(rgb(a), rgb(b));

const between = (value: number, a: number, b: number) =>
  value >= Math.min(a, b) && value <= Math.max(a, b);

describe("mix", () => {
  it("interpolates in sRGB", () => {
    const black = rgb("#000000");
    const white = rgb("#FFFFFF");
    expect(mix(black, white, 0)).toEqual(black);
    expect(mix(black, white, 1)).toEqual(white);
    expect(mix(black, white, 0.5)).toEqual({ r: 128, g: 128, b: 128 });
  });
});

describe("fadeToward", () => {
  it("stops at the lightest tone that still meets the ratio", () => {
    const faded = fadeToward(rgb("#000000"), rgb("#FFFFFF"), 4.6);
    expect(contrastRatio(faded, rgb("#FFFFFF"))).toBeGreaterThanOrEqual(4.6);
    const oneStepFurther = { r: faded.r + 1, g: faded.g + 1, b: faded.b + 1 };
    expect(contrastRatio(oneStepFurther, rgb("#FFFFFF"))).toBeLessThan(4.6);
  });

  it("returns the ink unchanged when it already falls short", () => {
    const ink = rgb("#808080");
    expect(fadeToward(ink, rgb("#808080"), 4.6)).toEqual(ink);
  });
});

describe("deriveTheme", () => {
  for (const [fg, bg] of PAIRS) {
    describe(`${fg} on ${bg}`, () => {
      const theme = deriveTheme(rgb(fg), rgb(bg));
      const passesAa = ratio(fg, bg) >= 4.5;

      it("keeps the chosen background as the surface", () => {
        expect(theme.surface).toBe(bg);
      });

      if (passesAa) {
        it("uses the exact chosen text color as ink", () => {
          expect(theme.ink).toBe(fg);
        });
      } else {
        it("adjusts ink to at least 4.5:1", () => {
          expect(ratio(theme.ink, bg)).toBeGreaterThanOrEqual(4.5);
        });

        const { s } = rgbToHsl(rgb(fg));
        const adjusted = !["#141416", "#FAFAF7"].includes(theme.ink);
        if (s > 0 && adjusted) {
          it("preserves the hue of a chromatic text color", () => {
            const diff = Math.abs(
              rgbToHsl(rgb(theme.ink)).h - rgbToHsl(rgb(fg)).h,
            );
            expect(Math.min(diff, 360 - diff)).toBeLessThan(4);
          });
        }
      }

      it("keeps muted ink, line and tint legible", () => {
        expect(ratio(theme.inkMuted, bg)).toBeGreaterThanOrEqual(4.5);
        expect(ratio(theme.line, bg)).toBeGreaterThanOrEqual(3);
        expect(ratio(theme.ink, theme.tint)).toBeGreaterThanOrEqual(4.5);
      });

      it("places hairline and tint between ink and surface", () => {
        const ink = rgb(theme.ink);
        const surface = rgb(bg);
        for (const role of [theme.hairline, theme.tint]) {
          const c = rgb(role);
          expect(between(c.r, ink.r, surface.r)).toBe(true);
          expect(between(c.g, ink.g, surface.g)).toBe(true);
          expect(between(c.b, ink.b, surface.b)).toBe(true);
        }
      });

      it("returns uppercase #RRGGBB values", () => {
        for (const value of Object.values(theme)) {
          expect(value).toMatch(/^#[0-9A-F]{6}$/);
        }
      });
    });
  }

  it("falls back to near-black or near-white when no tone of the text color reaches 4.5:1", () => {
    // Mid-gray on mid-gray: no lightness of the same gray works, but a darker tone does.
    const theme = deriveTheme(rgb("#808080"), rgb("#808080"));
    expect(ratio(theme.ink, "#808080")).toBeGreaterThanOrEqual(4.5);
  });
});

describe("themeToCssVars", () => {
  it("maps every role to its custom property", () => {
    const theme = deriveTheme(rgb("#777777"), rgb("#FFFFFF"));
    expect(themeToCssVars(theme)).toEqual({
      "--cc-surface": theme.surface,
      "--cc-ink": theme.ink,
      "--cc-ink-muted": theme.inkMuted,
      "--cc-line": theme.line,
      "--cc-hairline": theme.hairline,
      "--cc-tint": theme.tint,
    });
  });
});
