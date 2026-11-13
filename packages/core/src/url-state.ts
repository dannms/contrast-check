import { parseHex, toHex } from "./color";

export const DEFAULT_FG = "#6B7280";
export const DEFAULT_BG = "#FFFFFF";

/** Reads a `fg`/`bg` query value (hex without #) and returns "#RRGGBB", or null. */
export function hexFromParam(
  value: string | string[] | undefined,
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const rgb = parseHex(raw);
  return rgb ? toHex(rgb) : null;
}

/** Builds a query string ("?fg=...&bg=...") from the colors that are valid. */
export function buildQuery(fgText: string, bgText: string): string {
  const params = new URLSearchParams();
  const fg = parseHex(fgText);
  const bg = parseHex(bgText);
  if (fg) params.set("fg", toHex(fg).slice(1).toLowerCase());
  if (bg) params.set("bg", toHex(bg).slice(1).toLowerCase());
  const query = params.toString();
  return query ? `?${query}` : "";
}
