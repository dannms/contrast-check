import { parseHex, toHex } from "./color";
import {
  type Palette,
  type PaletteOptions,
  ROLES,
  type Role,
  type RoleColor,
} from "./palette";

/** The default palette: it passes AA on every pair, with accent as text. */
export const DEFAULT_PALETTE: Palette = {
  text: { seed: "#1C1D22", active: "#1C1D22" },
  background: { seed: "#FAFAF7", active: "#FAFAF7" },
  primary: { seed: "#2F5BD8", active: "#2F5BD8" },
  secondary: { seed: "#E9ECF5", active: "#E9ECF5" },
  accent: { seed: "#C2410C", active: "#C2410C" },
};

export const DEFAULT_PALETTE_OPTIONS: PaletteOptions = {
  level: "AA",
  accentAsText: true,
};

type QueryParams = Record<string, string | string[] | undefined>;

const firstValue = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

/** Reads "seed" or "seed.active" (hex without #). Null when the seed is invalid. */
function roleFromParam(value: string | undefined): RoleColor | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length > 2) return null;
  const seed = parseHex(parts[0] ?? "");
  if (!seed) return null;
  const seedHex = toHex(seed);
  const active = parts[1] === undefined ? null : parseHex(parts[1]);
  return { seed: seedHex, active: active ? toHex(active) : seedHex };
}

/**
 * Reads the palette state from query params. Every value is validated on its
 * own: an invalid or missing role falls back to the default for that role, and
 * nothing throws. The legacy `fg` and `bg` params still load as text and background.
 */
export function parsePaletteQuery(params: QueryParams): {
  palette: Palette;
  options: PaletteOptions;
} {
  const legacy: Partial<Record<Role, string>> = {
    text: firstValue(params.fg),
    background: firstValue(params.bg),
  };
  const palette = { ...DEFAULT_PALETTE };
  for (const role of ROLES) {
    const raw = firstValue(params[role]) ?? legacy[role];
    palette[role] = roleFromParam(raw) ?? DEFAULT_PALETTE[role];
  }

  const level = firstValue(params.level)?.toUpperCase();
  const accentText = firstValue(params.accentText);
  return {
    palette,
    options: {
      level: level === "AAA" ? "AAA" : DEFAULT_PALETTE_OPTIONS.level,
      accentAsText:
        accentText === "0"
          ? false
          : accentText === "1"
            ? true
            : DEFAULT_PALETTE_OPTIONS.accentAsText,
    },
  };
}

const hexForUrl = (hex: string): string => hex.replace("#", "").toLowerCase();

/**
 * Builds "?text=...&background=...&primary=...&secondary=...&accent=...&level=...&accentText=0|1".
 * Each role is "seed", or "seed.active" when the active color differs; hex is
 * lowercase, without #.
 */
export function buildPaletteQuery(
  palette: Palette,
  options: PaletteOptions,
): string {
  const params = new URLSearchParams();
  for (const role of ROLES) {
    const { seed, active } = palette[role];
    params.set(
      role,
      active === seed
        ? hexForUrl(seed)
        : `${hexForUrl(seed)}.${hexForUrl(active)}`,
    );
  }
  params.set("level", options.level);
  params.set("accentText", options.accentAsText ? "1" : "0");
  return `?${params.toString()}`;
}
