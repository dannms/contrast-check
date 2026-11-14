import { describe, expect, it } from "vitest";
import { toTailwindTheme } from "./export";
import { type Palette, type PaletteOptions, ROLES, type Role } from "./palette";
import { SCALE_STEPS, scaleFor } from "./scale";

const makePalette = (colors: Record<Role, string>): Palette =>
  Object.fromEntries(
    ROLES.map((role) => [role, { seed: colors[role], active: colors[role] }]),
  ) as Palette;

const EXAMPLE = makePalette({
  text: "#1C1D22",
  background: "#FAFAF7",
  primary: "#2F5BD8",
  secondary: "#E9ECF5",
  accent: "#C2410C",
});

const AA: PaletteOptions = { level: "AA", accentAsText: true };

describe("toTailwindTheme", () => {
  const css = toTailwindTheme(EXAMPLE, AA);

  it("starts with a comment with the verdict, the level and the accent flag", () => {
    expect(css.startsWith("/*")).toBe(true);
    const header = css.slice(0, css.indexOf("*/"));
    expect(header).toContain("Passes AA · 6 of 6 pairs");
    expect(header).toContain("AA");
    expect(header).toContain("accent as text: on");
    const off = toTailwindTheme(EXAMPLE, { level: "AAA", accentAsText: false });
    expect(off.slice(0, off.indexOf("*/"))).toContain("accent as text: off");
    expect(off.slice(0, off.indexOf("*/"))).toContain("AAA");
  });

  it("has a theme block with 55 scale variables built from the seeds", () => {
    expect(css).toContain("@theme {");
    const lines = css.match(
      /--color-(text|background|primary|secondary|accent)-(50|100|200|300|400|500|600|700|800|900|950): oklch\([^)]+\);/g,
    );
    expect(lines).toHaveLength(55);
    const primary = scaleFor("#2F5BD8");
    for (const step of primary) {
      expect(css).toContain(`--color-primary-${step.name}: ${step.oklch};`);
    }
  });

  it("aliases each role to the step that holds its active color", () => {
    for (const role of ROLES) {
      const seed = EXAMPLE[role].seed;
      const step = scaleFor(seed).find((s) => s.hex === seed);
      expect(step).toBeDefined();
      expect(css).toContain(
        `--color-${role}: var(--color-${role}-${step?.name});`,
      );
    }
  });

  it("uses the literal oklch value when the active color is not a step", () => {
    const fixed: Palette = {
      ...EXAMPLE,
      text: { seed: "#1C1D22", active: "#2A2B30" },
    };
    const out = toTailwindTheme(fixed, AA);
    expect(out).toMatch(/--color-text: oklch\([^)]+\);/);
    expect(out).not.toContain("--color-text: var(");
  });

  it("ends each alias with its ratio on the background", () => {
    const aliases = css
      .split("\n")
      .filter((line) =>
        /^\s*--color-(text|background|primary|secondary|accent): /.test(line),
      );
    expect(aliases).toHaveLength(5);
    for (const line of aliases) {
      expect(line).toMatch(/\/\* \d+\.\d{2}:1 on background \*\/$/);
    }
  });

  it("produces no NaN for gray seeds", () => {
    const gray = makePalette({
      text: "#808080",
      background: "#808080",
      primary: "#808080",
      secondary: "#808080",
      accent: "#808080",
    });
    const out = toTailwindTheme(gray, AA);
    expect(out).not.toContain("NaN");
    expect(out.match(/oklch\(/g)?.length).toBeGreaterThanOrEqual(55);
  });

  it("lists every step name for every role", () => {
    for (const role of ROLES) {
      for (const step of SCALE_STEPS) {
        expect(css).toContain(`--color-${role}-${step}: oklch(`);
      }
    }
  });

  it("matches the snapshot for a fixed palette", () => {
    expect(css).toMatchInlineSnapshot(`
      "/* Passes AA · 6 of 6 pairs. Level AA, accent as text: on. */
      @theme {
        --color-text-50: oklch(0.970 0.0013 286.38);
        --color-text-100: oklch(0.931 0.0029 264.54);
        --color-text-200: oklch(0.870 0.0056 274.96);
        --color-text-300: oklch(0.790 0.0085 278.60);
        --color-text-400: oklch(0.700 0.0087 278.57);
        --color-text-500: oklch(0.610 0.0093 271.26);
        --color-text-600: oklch(0.521 0.0082 268.48);
        --color-text-700: oklch(0.439 0.0082 277.00);
        --color-text-800: oklch(0.369 0.0068 286.06);
        --color-text-900: oklch(0.301 0.0056 271.23);
        --color-text-950: oklch(0.232 0.0097 276.64);
        --color-background-50: oklch(0.984 0.0040 106.47);
        --color-background-100: oklch(0.931 0.0013 106.43);
        --color-background-200: oklch(0.870 0.0014 106.43);
        --color-background-300: oklch(0.791 0.0042 106.49);
        --color-background-400: oklch(0.699 0.0029 106.47);
        --color-background-500: oklch(0.609 0.0030 106.49);
        --color-background-600: oklch(0.520 0.0031 106.51);
        --color-background-700: oklch(0.441 0.0048 106.60);
        --color-background-800: oklch(0.371 0.0034 106.56);
        --color-background-900: oklch(0.301 0.0018 106.51);
        --color-background-950: oklch(0.239 0.0019 106.54);
        --color-primary-50: oklch(0.969 0.0144 264.50);
        --color-primary-100: oklch(0.930 0.0334 265.23);
        --color-primary-200: oklch(0.869 0.0637 265.46);
        --color-primary-300: oklch(0.789 0.1059 265.68);
        --color-primary-400: oklch(0.701 0.1558 265.22);
        --color-primary-500: oklch(0.609 0.1986 265.38);
        --color-primary-600: oklch(0.518 0.1980 265.21);
        --color-primary-700: oklch(0.441 0.1683 265.19);
        --color-primary-800: oklch(0.370 0.1397 265.42);
        --color-primary-900: oklch(0.300 0.1082 264.97);
        --color-primary-950: oklch(0.240 0.0786 264.69);
        --color-secondary-50: oklch(0.970 0.0017 247.84);
        --color-secondary-100: oklch(0.943 0.0125 271.28);
        --color-secondary-200: oklch(0.870 0.0072 268.54);
        --color-secondary-300: oklch(0.789 0.0101 273.32);
        --color-secondary-400: oklch(0.699 0.0121 269.50);
        --color-secondary-500: oklch(0.610 0.0126 269.47);
        --color-secondary-600: oklch(0.521 0.0116 267.28);
        --color-secondary-700: oklch(0.439 0.0117 273.16);
        --color-secondary-800: oklch(0.371 0.0089 268.42);
        --color-secondary-900: oklch(0.300 0.0061 258.35);
        --color-secondary-950: oklch(0.239 0.0059 271.17);
        --color-accent-50: oklch(0.970 0.0151 37.88);
        --color-accent-100: oklch(0.930 0.0370 38.69);
        --color-accent-200: oklch(0.870 0.0717 38.91);
        --color-accent-300: oklch(0.789 0.1254 38.31);
        --color-accent-400: oklch(0.700 0.1652 38.45);
        --color-accent-500: oklch(0.611 0.1738 38.56);
        --color-accent-600: oklch(0.553 0.1739 38.40);
        --color-accent-700: oklch(0.440 0.1431 38.34);
        --color-accent-800: oklch(0.370 0.1200 38.43);
        --color-accent-900: oklch(0.299 0.0956 38.40);
        --color-accent-950: oklch(0.239 0.0693 39.03);
        --color-text: var(--color-text-950); /* 16.09:1 on background */
        --color-background: var(--color-background-50); /* 1.00:1 on background */
        --color-primary: var(--color-primary-600); /* 5.56:1 on background */
        --color-secondary: var(--color-secondary-100); /* 1.13:1 on background */
        --color-accent: var(--color-accent-600); /* 4.95:1 on background */
      }
      "
    `);
  });
});
