import { describe, expect, it } from "vitest";
import { contrastRatio, parseHex } from "./color";
import { toTailwindTheme } from "./export";
import {
  checkPalette,
  fixPair,
  labelColorFor,
  type Palette,
  type PaletteOptions,
  ROLES,
  type Role,
} from "./palette";
import {
  buildPaletteQuery,
  DEFAULT_PALETTE,
  DEFAULT_PALETTE_OPTIONS,
} from "./url-state";
import {
  initialViewState,
  paletteView,
  reduce,
  type ViewAction,
  type ViewState,
} from "./view";

const makePalette = (colors: Record<Role, string>): Palette =>
  Object.fromEntries(
    ROLES.map((role) => [role, { seed: colors[role], active: colors[role] }]),
  ) as Palette;

const start = (
  palette: Palette = DEFAULT_PALETTE,
  options: PaletteOptions = DEFAULT_PALETTE_OPTIONS,
): ViewState => initialViewState(palette, options);

const run = (state: ViewState, ...actions: ViewAction[]): ViewState =>
  actions.reduce(reduce, state);

const rgb = (hex: string) => {
  const parsed = parseHex(hex);
  if (!parsed) throw new Error(`bad fixture ${hex}`);
  return parsed;
};

describe("paletteView", () => {
  it("describes the default palette", () => {
    const view = paletteView(start());
    expect(view.paletteVerdict).toBe("Passes AA · 6 of 6 pairs");
    expect(view.focus).toEqual({
      pair: "text-on-background",
      label: "Text on background",
      ratio: "16.09",
      verdict: "Passes AAA for all text.",
    });
    expect(view.pairs).toHaveLength(6);
    expect(view.liveSummary).toBe(
      "Text on background, 16.09 to 1. Passes AA · 6 of 6 pairs.",
    );
    expect(view.exportText).toBe(
      toTailwindTheme(DEFAULT_PALETTE, DEFAULT_PALETTE_OPTIONS),
    );
    expect(view.query).toBe(
      buildPaletteQuery(DEFAULT_PALETTE, DEFAULT_PALETTE_OPTIONS),
    );
  });

  it("starts the drafts at the active hex, with focus on text and no message", () => {
    const state = start();
    expect(state.focus).toBe("text-on-background");
    expect(state.message).toBe("");
    expect(state.drafts.primary).toBe("#2F5BD8");
  });

  it("formats the pair rows", () => {
    const row = paletteView(start()).pairs.find(
      (p) => p.id === "primary-vs-background",
    );
    expect(row).toEqual({
      id: "primary-vs-background",
      label: "Primary against background",
      ratio: "5.56:1",
      minimum: "3:1",
      meta: "5.56:1 · min 3:1",
      pass: true,
      focused: false,
      fixLabel: "Fix primary against background",
    });
  });

  it("describes the fields", () => {
    const fields = paletteView(start()).fields;
    expect(fields.map((f) => f.id)).toEqual([
      "role-text",
      "role-background",
      "role-primary",
      "role-secondary",
      "role-accent",
    ]);
    expect(fields[2]).toMatchObject({
      role: "primary",
      label: "Primary",
      draft: "#2F5BD8",
      invalid: false,
      error: "",
      pickerHex: "#2f5bd8",
    });
  });
});

describe("reduce", () => {
  it("draft with a valid hex sets seed and active and keeps the typed text", () => {
    const state = run(
      { ...start(), message: "old" },
      { type: "draft", role: "text", text: "777" },
    );
    expect(state.palette.text).toEqual({ seed: "#777777", active: "#777777" });
    expect(state.drafts.text).toBe("777");
    expect(state.message).toBe("");
  });

  it("pick sets seed, active and draft to the uppercase hex", () => {
    const state = run(start(), {
      type: "pick",
      role: "accent",
      hex: "#aabbcc",
    });
    expect(state.palette.accent).toEqual({
      seed: "#AABBCC",
      active: "#AABBCC",
    });
    expect(state.drafts.accent).toBe("#AABBCC");
  });

  it("step changes only the active color and marks the step in the scale", () => {
    const base = start();
    const seed = base.palette.primary.seed;
    const scale = paletteView(base).scales.find((s) =>
      s.label.startsWith("Primary"),
    );
    const step700 = scale?.steps.find((s) => s.name === 700);
    expect(step700).toBeDefined();
    const state = run(base, {
      type: "step",
      role: "primary",
      hex: step700?.hex ?? "",
    });
    expect(state.palette.primary.seed).toBe(seed);
    expect(state.palette.primary.active).toBe(step700?.hex);
    expect(state.drafts.primary).toBe(step700?.hex);
    const after = paletteView(state).scales.find((s) =>
      s.label.startsWith("Primary"),
    );
    const checked = after?.steps.filter((s) => s.checked) ?? [];
    expect(checked.map((s) => s.name)).toEqual([700]);
    expect(after?.steps.filter((s) => s.tabbable).map((s) => s.name)).toEqual([
      700,
    ]);
  });

  it("a role whose active color is off its scale has no checked step and step 50 is tabbable", () => {
    const state = run(start(), {
      type: "step",
      role: "primary",
      hex: "#123456",
    });
    const scale = paletteView(state).scales.find((s) =>
      s.label.startsWith("Primary"),
    );
    expect(scale?.steps.some((s) => s.checked)).toBe(false);
    expect(scale?.steps.filter((s) => s.tabbable).map((s) => s.name)).toEqual([
      50,
    ]);
  });

  it("swap exchanges seed, active and draft of text and background", () => {
    const fixed = start(
      {
        ...DEFAULT_PALETTE,
        text: { seed: "#1C1D22", active: "#2A2B30" },
      },
      DEFAULT_PALETTE_OPTIONS,
    );
    const state = run(fixed, { type: "swap" });
    expect(state.palette.background).toEqual({
      seed: "#1C1D22",
      active: "#2A2B30",
    });
    expect(state.palette.text).toEqual(fixed.palette.background);
    expect(state.drafts.background).toBe("#2A2B30");
    expect(state.drafts.text).toBe("#FAFAF7");
    const scale = paletteView(state).scales.find((s) =>
      s.label.startsWith("Background"),
    );
    expect(scale?.steps.some((s) => s.hex === "#1C1D22")).toBe(true);
  });

  it("turning accent as text off moves the focus away from that pair", () => {
    const state = run(
      start(),
      { type: "focus", pair: "accent-as-text" },
      { type: "accentAsText", on: false },
    );
    expect(state.focus).toBe("text-on-background");
    expect(paletteView(state).pairs).toHaveLength(5);
  });

  it("level AAA raises the text minimum and leaves the UI minimum", () => {
    const view = paletteView(run(start(), { type: "level", level: "AAA" }));
    const minimum = (id: string) =>
      view.pairs.find((p) => p.id === id)?.minimum;
    expect(minimum("text-on-background")).toBe("7:1");
    expect(minimum("primary-vs-background")).toBe("3:1");
  });

  it("a partial hex keeps the last valid palette and produces no NaN", () => {
    const state = run(start(), { type: "draft", role: "primary", text: "#12" });
    expect(state.palette).toEqual(DEFAULT_PALETTE);
    const view = paletteView(state);
    const field = view.fields.find((f) => f.role === "primary");
    expect(field?.invalid).toBe(true);
    expect(field?.error).toBe("Enter 3 or 6 hex digits, like 1A2B3C.");
    expect(field?.draft).toBe("#12");
    expect(JSON.stringify(view)).not.toContain("NaN");
  });

  it("fix changes only the active color of the role and announces it", () => {
    const palette = makePalette({
      text: "#1C1D22",
      background: "#FAFAF7",
      primary: "#2F5BD8",
      secondary: "#E9ECF5",
      accent: "#F97316",
    });
    const before = start(palette);
    const state = run(before, {
      type: "fix",
      pair: "accent-vs-background",
    });
    expect(state.palette.accent.seed).toBe("#F97316");
    expect(state.palette.accent.active).not.toBe("#F97316");
    const pair = checkPalette(state.palette, state.options).find(
      (r) => r.id === "accent-vs-background",
    );
    expect(pair?.pass).toBe(true);
    expect(state.message).toBe(`Accent set to ${state.palette.accent.active}.`);
    expect(state.focus).toBe("accent-vs-background");
    expect(state.drafts.accent).toBe(state.palette.accent.active);
  });

  it("fixes a role by its strictest failing pair", () => {
    const orange = makePalette({
      text: "#1C1D22",
      background: "#FAFAF7",
      primary: "#2F5BD8",
      secondary: "#E9ECF5",
      accent: "#F97316",
    });
    const state = run(start(orange), {
      type: "fix",
      pair: "accent-vs-background",
    });
    const after = checkPalette(state.palette, state.options);
    const pass = (id: string) => after.find((r) => r.id === id)?.pass;
    expect(pass("accent-vs-background")).toBe(true);
    expect(pass("accent-as-text")).toBe(true);
    expect(state.focus).toBe("accent-vs-background");
    expect(state.message).toBe(`Accent set to ${state.palette.accent.active}.`);
  });

  it("with accent as text off the same fix only asks for 3:1", () => {
    const orange = makePalette({
      text: "#1C1D22",
      background: "#FAFAF7",
      primary: "#2F5BD8",
      secondary: "#E9ECF5",
      accent: "#F97316",
    });
    const state = run(start(orange, { level: "AA", accentAsText: false }), {
      type: "fix",
      pair: "accent-vs-background",
    });
    const pair = checkPalette(state.palette, state.options).find(
      (r) => r.id === "accent-vs-background",
    );
    expect(pair?.pass).toBe(true);
    expect(pair?.ratio).toBeLessThan(4.5);
  });

  it("a blocked fix leaves the palette and says what it would break", () => {
    const blocked = makePalette({
      text: "#CCCCCC",
      background: "#808080",
      primary: "#303030",
      secondary: "#E9ECF5",
      accent: "#101010",
    });
    const state = run(start(blocked), {
      type: "fix",
      pair: "text-on-background",
    });
    expect(state.palette).toEqual(blocked);
    expect(state.message).toBe("Can't fix without breaking Label on primary.");
  });

  it("the blocked message counts the other pairs", () => {
    const blocked = makePalette({
      text: "#CCCCCC",
      background: "#808080",
      primary: "#303030",
      secondary: "#E9ECF5",
      accent: "#101010",
    });
    const view = paletteView(
      run(
        { ...start(blocked), message: "" },
        {
          type: "fix",
          pair: "text-on-background",
        },
      ),
    );
    expect(view.message.startsWith("Can't fix without breaking ")).toBe(true);
    expect(view.message.endsWith(".")).toBe(true);
  });

  it("a fix blocked by several pairs names the first and counts the rest", () => {
    const blocked = makePalette({
      text: "#CCCCCC",
      background: "#808080",
      primary: "#303030",
      secondary: "#383838",
      accent: "#101010",
    });
    // Preconditions: the text pair fails, and the text color is the label on both fills.
    const pairs = checkPalette(blocked, DEFAULT_PALETTE_OPTIONS);
    const pass = (id: string) => pairs.find((p) => p.id === id)?.pass;
    expect(pass("text-on-background")).toBe(false);
    expect(pass("label-on-primary")).toBe(true);
    expect(pass("label-on-secondary")).toBe(true);
    const result = fixPair(
      blocked,
      "text-on-background",
      DEFAULT_PALETTE_OPTIONS,
    );
    expect(result.palette).toBeNull();
    expect(result).toMatchObject({
      blockedBy: ["label-on-primary", "label-on-secondary"],
    });

    const state = run(start(blocked), {
      type: "fix",
      pair: "text-on-background",
    });
    expect(state.palette).toEqual(blocked);
    expect(state.message).toBe(
      "Can't fix without breaking Label on primary and 1 more.",
    );
  });

  it("copy starts idle with no announcement", () => {
    expect(paletteView(start()).copy).toEqual({
      state: "idle",
      announcement: "",
    });
  });

  it("copied success announces, without touching the message", () => {
    const fixed = run(
      start(
        makePalette({
          text: "#1C1D22",
          background: "#FAFAF7",
          primary: "#2F5BD8",
          secondary: "#E9ECF5",
          accent: "#F97316",
        }),
      ),
      { type: "fix", pair: "accent-vs-background" },
    );
    expect(fixed.message).toMatch(/^Accent set to #/);
    const state = run(fixed, { type: "copied", ok: true });
    expect(state.message).toBe(fixed.message);
    expect(paletteView(state).copy).toEqual({
      state: "copied",
      announcement: "Theme copied.",
    });
  });

  it("copied failure announces that the code is selected", () => {
    const state = run(start(), { type: "copied", ok: false });
    expect(state.message).toBe("");
    expect(paletteView(state).copy).toEqual({
      state: "failed",
      announcement:
        "Copy failed. The code is selected, copy it with your keyboard.",
    });
  });

  it("copyReset goes back to idle and leaves the message alone", () => {
    const copied = run(start(), { type: "copied", ok: true });
    expect(run(copied, { type: "copyReset" }).copy).toBe("idle");
    const withMessage = { ...copied, message: "Accent set to #AABBCC." };
    expect(reduce(withMessage, { type: "copyReset" }).message).toBe(
      "Accent set to #AABBCC.",
    );
  });

  it("any other action brings copy back to idle and clears the message", () => {
    const copied = {
      ...run(start(), { type: "copied", ok: true }),
      message: "Accent set to #AABBCC.",
    };
    for (const action of [
      { type: "focus", pair: "label-on-primary" },
      { type: "level", level: "AAA" },
      { type: "swap" },
      { type: "accentAsText", on: false },
    ] as const) {
      const next = reduce(copied, action);
      expect(next.copy).toBe("idle");
      expect(next.message).toBe("");
    }
    const failed = run(start(), { type: "copied", ok: false });
    expect(run(failed, { type: "swap" }).copy).toBe("idle");
  });

  it("focus ignores unknown pairs", () => {
    const state = start();
    expect(reduce(state, { type: "focus", pair: "nope" as never })).toBe(state);
    expect(reduce(state, { type: "fix", pair: "nope" as never })).toBe(state);
  });
});

describe("preview", () => {
  it("highlights the part that uses the pair in focus", () => {
    const highlight = (pair: Parameters<typeof reduce>[1]) =>
      paletteView(run(start(), pair)).preview.highlight;
    expect(highlight({ type: "focus", pair: "text-on-background" })).toBe(
      "copy",
    );
    expect(highlight({ type: "focus", pair: "label-on-secondary" })).toBe(
      "panel",
    );
    expect(highlight({ type: "focus", pair: "label-on-primary" })).toBe("save");
    expect(highlight({ type: "focus", pair: "primary-vs-background" })).toBe(
      "save",
    );
    expect(highlight({ type: "focus", pair: "accent-vs-background" })).toBe(
      "chip",
    );
    expect(highlight({ type: "focus", pair: "accent-as-text" })).toBe("link");
  });

  it("carries the exact colors and label colors", () => {
    const { preview } = paletteView(start());
    expect(preview).toMatchObject({
      text: "#1C1D22",
      background: "#FAFAF7",
      primary: "#2F5BD8",
      secondary: "#E9ECF5",
      accent: "#C2410C",
      primaryLabel: labelColorFor("#2F5BD8", DEFAULT_PALETTE),
      secondaryLabel: labelColorFor("#E9ECF5", DEFAULT_PALETTE),
    });
  });
});

describe("chrome buttons", () => {
  it("use primary and its label when label-on-primary and primary-against-background pass", () => {
    const vars = paletteView(start()).cssVars;
    expect(vars["--cc-button"]).toBe("#2F5BD8");
    expect(vars["--cc-button-label"]).toBe(
      labelColorFor("#2F5BD8", DEFAULT_PALETTE),
    );
    const light = makePalette({
      text: "#1C1D22",
      background: "#FAFAF7",
      primary: "#93C5FD",
      secondary: "#E9ECF5",
      accent: "#C2410C",
    });
    // The label passes (9.33:1) but the primary is 1.72:1 against the background.
    const pairs = checkPalette(light, DEFAULT_PALETTE_OPTIONS);
    expect(pairs.find((p) => p.id === "label-on-primary")?.pass).toBe(true);
    expect(pairs.find((p) => p.id === "primary-vs-background")?.pass).toBe(
      false,
    );
    const lightVars = paletteView(start(light)).cssVars;
    expect(lightVars["--cc-button"]).toBe(lightVars["--cc-ink"]);
    expect(lightVars["--cc-button-label"]).toBe(lightVars["--cc-surface"]);
  });

  it("fall back to ink on surface when label-on-primary fails", () => {
    const failing = makePalette({
      text: "#777777",
      background: "#FFFFFF",
      primary: "#808080",
      secondary: "#E9ECF5",
      accent: "#C2410C",
    });
    const label = labelColorFor("#808080", failing);
    expect(contrastRatio(rgb(label), rgb("#808080"))).toBeLessThan(4.5);
    const vars = paletteView(start(failing)).cssVars;
    expect(vars["--cc-button"]).toBe(vars["--cc-ink"]);
    expect(vars["--cc-button-label"]).toBe(vars["--cc-surface"]);
  });

  it("expose the five theme variables", () => {
    const vars = paletteView(start()).cssVars;
    for (const key of [
      "--cc-surface",
      "--cc-ink",
      "--cc-ink-muted",
      "--cc-line",
      "--cc-hairline",
    ]) {
      expect(vars[key]).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it("report the color scheme from the surface luminance", () => {
    expect(paletteView(start()).colorScheme).toBe("light");
    const dark = makePalette({
      text: "#F5F5F4",
      background: "#12151C",
      primary: "#5B7BB5",
      secondary: "#1E2430",
      accent: "#F97316",
    });
    expect(paletteView(start(dark)).colorScheme).toBe("dark");
  });
});

describe("scales", () => {
  it("annotate the background strip against the text and the others against the background", () => {
    const view = paletteView(start());
    const strip = (prefix: string) =>
      view.scales.find((s) => s.label.startsWith(prefix));
    const bgStep = strip("Background")?.steps.find((s) => s.name === 950);
    const expectedBg = contrastRatio(
      rgb(bgStep?.hex ?? "#000000"),
      rgb(DEFAULT_PALETTE.text.active),
    );
    expect(bgStep?.ratio).toBe(expectedBg.toFixed(2));

    const primaryStep = strip("Primary")?.steps.find((s) => s.name === 950);
    const expectedPrimary = contrastRatio(
      rgb(primaryStep?.hex ?? "#000000"),
      rgb(DEFAULT_PALETTE.background.active),
    );
    expect(primaryStep?.ratio).toBe(expectedPrimary.toFixed(2));
  });

  it("shows only the number as the step ratio", () => {
    const steps = paletteView(start()).scales.flatMap((s) => s.steps);
    for (const step of steps) {
      expect(step.ratio).toMatch(/^\d+\.\d{2}$/);
      expect("useLabel" in step).toBe(false);
    }
  });

  it("name each step with its hex, ratio and use spelled out", () => {
    const steps = paletteView(start()).scales.flatMap((s) => s.steps);
    const spoken = {
      "text-aaa": "AAA text",
      "text-aa": "AA text",
      "large-ui": "large text and UI",
      decorative: "decorative",
    } as const;
    for (const step of steps) {
      expect(step.ariaLabel).toBe(
        `${step.name}, ${step.hex}, ${step.ratio}:1, ${spoken[step.use]}`,
      );
    }
    expect(new Set(steps.map((s) => s.use))).toEqual(
      new Set(["text-aaa", "text-aa", "large-ui", "decorative"]),
    );
    const primary600 = paletteView(start()).scales[2]?.steps.find(
      (s) => s.name === 600,
    );
    expect(primary600?.ariaLabel).toBe("600, #2F5BD8, 5.56:1, AA text");
  });
});
