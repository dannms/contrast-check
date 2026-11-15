import {
  formatRatio,
  parseHex,
  type Rgb,
  relativeLuminance,
  toHex,
  verdictForRatio,
} from "./color";
import { toTailwindTheme } from "./export";
import {
  checkPalette,
  fixPair,
  type Level,
  labelColorFor,
  type PairId,
  type PairResult,
  type Palette,
  type PaletteOptions,
  paletteVerdict,
  ROLES,
  type Role,
} from "./palette";
import { annotateScale, type StepName, scaleFor, type Use } from "./scale";
import { deriveTheme, themeToCssVars } from "./theme";
import { buildPaletteQuery } from "./url-state";

export type ViewState = {
  palette: Palette;
  options: PaletteOptions;
  /** What the person typed in each field; may be invalid or partial. */
  drafts: Record<Role, string>;
  focus: PairId;
  message: string;
};

export type ViewAction =
  | { type: "draft"; role: Role; text: string }
  | { type: "pick"; role: Role; hex: string }
  | { type: "step"; role: Role; hex: string }
  | { type: "swap" }
  | { type: "level"; level: Level }
  | { type: "accentAsText"; on: boolean }
  | { type: "focus"; pair: PairId }
  | { type: "fix"; pair: PairId }
  | { type: "copied"; ok: boolean };

type UseLabel = "AAA" | "AA" | "Large · UI" | "Decor";

export type PaletteView = {
  cssVars: Record<string, string>;
  colorScheme: "light" | "dark";
  fields: {
    role: Role;
    id: string;
    label: string;
    draft: string;
    invalid: boolean;
    error: string;
    pickerHex: string;
  }[];
  options: PaletteOptions;
  paletteVerdict: string;
  focus: { pair: PairId; label: string; ratio: string; verdict: string };
  pairs: {
    id: PairId;
    label: string;
    ratio: string;
    minimum: string;
    meta: string;
    pass: boolean;
    focused: boolean;
    fixLabel: string;
  }[];
  liveSummary: string;
  message: string;
  scales: {
    role: Role;
    label: string;
    steps: {
      name: StepName;
      hex: string;
      ratio: string;
      use: Use;
      useLabel: UseLabel;
      checked: boolean;
      tabbable: boolean;
      ariaLabel: string;
    }[];
  }[];
  preview: {
    text: string;
    background: string;
    primary: string;
    primaryLabel: string;
    secondary: string;
    secondaryLabel: string;
    accent: string;
    highlight: "copy" | "panel" | "save" | "chip" | "link";
  };
  exportText: string;
  query: string;
};

const BLACK: Rgb = { r: 0, g: 0, b: 0 };
const rgbOf = (hex: string): Rgb => parseHex(hex) ?? BLACK;
const hexOf = (hex: string): string => toHex(rgbOf(hex));
const capitalize = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1);

const INVALID_HEX = "Enter 3 or 6 hex digits, like 1A2B3C.";
const DARK_SURFACE_LUMINANCE = 0.18;
const FIRST_FOCUS: PairId = "text-on-background";

export function initialViewState(
  palette: Palette,
  options: PaletteOptions,
): ViewState {
  const drafts = Object.fromEntries(
    ROLES.map((role) => [role, hexOf(palette[role].active)]),
  ) as Record<Role, string>;
  return { palette, options, drafts, focus: FIRST_FOCUS, message: "" };
}

const withRole = (
  state: ViewState,
  role: Role,
  color: { seed: string; active: string },
  draft: string,
): ViewState => ({
  ...state,
  palette: { ...state.palette, [role]: color },
  drafts: { ...state.drafts, [role]: draft },
  message: "",
});

/** Pure state transition. Never mutates; unknown pairs leave the state as it is. */
export function reduce(state: ViewState, action: ViewAction): ViewState {
  switch (action.type) {
    case "draft": {
      const rgb = parseHex(action.text);
      if (!rgb) {
        return {
          ...state,
          drafts: { ...state.drafts, [action.role]: action.text },
          message: "",
        };
      }
      const hex = toHex(rgb);
      return withRole(
        state,
        action.role,
        { seed: hex, active: hex },
        action.text,
      );
    }
    case "pick": {
      const hex = hexOf(action.hex);
      return withRole(state, action.role, { seed: hex, active: hex }, hex);
    }
    case "step": {
      const hex = hexOf(action.hex);
      const seed = state.palette[action.role].seed;
      return withRole(state, action.role, { seed, active: hex }, hex);
    }
    case "swap": {
      const { text, background } = state.palette;
      return {
        ...state,
        palette: { ...state.palette, text: background, background: text },
        drafts: {
          ...state.drafts,
          text: state.drafts.background,
          background: state.drafts.text,
        },
        message: "",
      };
    }
    case "level":
      return {
        ...state,
        options: { ...state.options, level: action.level },
        message: "",
      };
    case "accentAsText":
      return {
        ...state,
        options: { ...state.options, accentAsText: action.on },
        focus:
          !action.on && state.focus === "accent-as-text"
            ? FIRST_FOCUS
            : state.focus,
        message: "",
      };
    case "focus": {
      const known = checkPalette(state.palette, state.options).some(
        (r) => r.id === action.pair,
      );
      return known ? { ...state, focus: action.pair, message: "" } : state;
    }
    case "fix": {
      const results = checkPalette(state.palette, state.options);
      const pair = results.find((r) => r.id === action.pair);
      if (!pair) return state;
      const result = fixPair(state.palette, action.pair, state.options);
      if (result.palette) {
        const role = pair.fixRole;
        const active = result.palette[role].active;
        return {
          ...state,
          palette: result.palette,
          drafts: { ...state.drafts, [role]: active },
          focus: action.pair,
          message: `${capitalize(role)} set to ${active}.`,
        };
      }
      const [first, ...rest] = result.blockedBy;
      const blocker = results.find((r) => r.id === first);
      // The plan has no copy for "no lightness reaches the target at all"; this line covers it.
      const message = blocker
        ? `Can't fix without breaking ${blocker.label}${
            rest.length > 0 ? ` and ${rest.length} more` : ""
          }.`
        : "Can't fix this pair with this color.";
      return { ...state, message };
    }
    case "copied":
      return {
        ...state,
        message: action.ok
          ? "Theme copied."
          : "Copy failed. Select the code and copy it.",
      };
  }
}

const USE_LABEL: Record<Use, UseLabel> = {
  "text-aaa": "AAA",
  "text-aa": "AA",
  "large-ui": "Large · UI",
  decorative: "Decor",
};

const USE_SPOKEN: Record<Use, string> = {
  "text-aaa": "AAA text",
  "text-aa": "AA text",
  "large-ui": "large text and UI",
  decorative: "decorative",
};

const HIGHLIGHT: Record<PairId, PaletteView["preview"]["highlight"]> = {
  "text-on-background": "copy",
  "label-on-secondary": "panel",
  "label-on-primary": "save",
  "primary-vs-background": "save",
  "accent-vs-background": "chip",
  "accent-as-text": "link",
};

/** Primary with its label when its label pair and its pair against the background pass, otherwise ink on surface. */
function chromeButton(
  results: PairResult[],
  palette: Palette,
  themeVars: Record<string, string>,
): Record<string, string> {
  const primary = hexOf(palette.primary.active);
  const label = labelColorFor(primary, palette);
  const passes = ["label-on-primary", "primary-vs-background"].every(
    (id) => results.find((r) => r.id === id)?.pass === true,
  );
  return {
    "--cc-button": passes ? primary : (themeVars["--cc-ink"] ?? primary),
    "--cc-button-label": passes ? label : (themeVars["--cc-surface"] ?? label),
  };
}

/** Everything the screen shows, already formatted. */
export function paletteView(state: ViewState): PaletteView {
  const { palette, options } = state;
  const results = checkPalette(palette, options);
  const verdictLine = paletteVerdict(results, options.level);
  const focused = results.find((r) => r.id === state.focus) ?? results[0];
  const focusRatio = focused?.ratio ?? 1;
  const focusLabel = focused?.label ?? "";

  const themeVars = themeToCssVars(
    deriveTheme(rgbOf(palette.text.active), rgbOf(palette.background.active)),
  );

  const fields = ROLES.map((role) => {
    const invalid = parseHex(state.drafts[role]) === null;
    return {
      role,
      id: `role-${role}`,
      label: capitalize(role),
      draft: state.drafts[role],
      invalid,
      error: invalid ? INVALID_HEX : "",
      pickerHex: hexOf(palette[role].active).toLowerCase(),
    };
  });

  const scales = ROLES.map((role) => {
    const against =
      role === "background" ? palette.text.active : palette.background.active;
    const steps = annotateScale(scaleFor(palette[role].seed), against);
    const active = hexOf(palette[role].active);
    const hasChecked = steps.some((s) => s.hex === active);
    return {
      role,
      label: `${capitalize(role)} scale`,
      steps: steps.map((s) => {
        const checked = s.hex === active;
        const ratio = formatRatio(s.ratio);
        const useLabel = USE_LABEL[s.use];
        return {
          name: s.name,
          hex: s.hex,
          ratio,
          use: s.use,
          useLabel,
          checked,
          tabbable: hasChecked ? checked : s.name === 50,
          ariaLabel: `${s.name}, ${s.hex}, ${ratio}, ${USE_SPOKEN[s.use]}`,
        };
      }),
    };
  });

  const primary = hexOf(palette.primary.active);
  const secondary = hexOf(palette.secondary.active);

  return {
    cssVars: { ...themeVars, ...chromeButton(results, palette, themeVars) },
    colorScheme:
      relativeLuminance(rgbOf(palette.background.active)) <
      DARK_SURFACE_LUMINANCE
        ? "dark"
        : "light",
    fields,
    options,
    paletteVerdict: verdictLine,
    focus: {
      pair: focused?.id ?? FIRST_FOCUS,
      label: focusLabel,
      ratio: focusRatio.toFixed(2),
      verdict: verdictForRatio(focusRatio),
    },
    pairs: results.map((r) => {
      const ratio = formatRatio(r.ratio);
      const minimum = `${r.threshold}:1`;
      return {
        id: r.id,
        label: r.label,
        ratio,
        minimum,
        meta: `${ratio} · min ${minimum}`,
        pass: r.pass,
        focused: r.id === focused?.id,
        fixLabel: `Fix ${r.label.toLowerCase()}`,
      };
    }),
    liveSummary: `${focusLabel}, ${focusRatio.toFixed(2)} to 1. ${verdictLine}.`,
    message: state.message,
    scales,
    preview: {
      text: hexOf(palette.text.active),
      background: hexOf(palette.background.active),
      primary,
      primaryLabel: labelColorFor(primary, palette),
      secondary,
      secondaryLabel: labelColorFor(secondary, palette),
      accent: hexOf(palette.accent.active),
      highlight: HIGHLIGHT[focused?.id ?? FIRST_FOCUS],
    },
    exportText: toTailwindTheme(palette, options),
    query: buildPaletteQuery(palette, options),
  };
}
