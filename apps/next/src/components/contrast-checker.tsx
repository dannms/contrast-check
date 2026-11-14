"use client";

import {
  buildQuery,
  deriveTheme,
  evaluate,
  formatRatio,
  parseHex,
  type Rgb,
  relativeLuminance,
  type SuggestionTarget,
  suggestTextColor,
  themeToCssVars,
  toHex,
} from "@contrast-check/core";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { ColorField } from "./color-field";
import { Preview } from "./preview";
import { Results } from "./results";
import { SuggestPanel } from "./suggest-panel";

type ContrastCheckerProps = {
  initialFg: string;
  initialBg: string;
};

// Surfaces darker than this get native controls in their dark variant.
const DARK_SURFACE_LUMINANCE = 0.18;

const BLACK: Rgb = { r: 0, g: 0, b: 0 };

// Groups of the top row: stacked with hairlines on mobile, columns from 768px.
const firstGroup = "pb-group md:pb-0";
const nextGroup =
  "border-t border-hairline pt-group pb-group md:border-t-0 md:border-l md:py-0 md:pl-column";
const lastGroup =
  "border-t border-hairline pt-group md:border-t-0 md:border-l md:pt-0 md:pl-column";

export function ContrastChecker({
  initialFg,
  initialBg,
}: ContrastCheckerProps) {
  const [fgText, setFgText] = useState(initialFg);
  const [bgText, setBgText] = useState(initialBg);
  const [target, setTarget] = useState<SuggestionTarget>("AA");
  const [message, setMessage] = useState("");
  const [flashing, setFlashing] = useState(false);
  const [lastFg, setLastFg] = useState(initialFg);
  const [lastBg, setLastBg] = useState(initialBg);

  const fg = parseHex(fgText);
  const bg = parseHex(bgText);
  const evaluation = fg && bg ? evaluate(fg, bg) : null;

  // The theme keeps the last valid color of each field while typing.
  const themeFg = fg ? toHex(fg) : lastFg;
  const themeBg = bg ? toHex(bg) : lastBg;
  if (themeFg !== lastFg) setLastFg(themeFg);
  if (themeBg !== lastBg) setLastBg(themeBg);

  const theme = useMemo(
    () => deriveTheme(parseHex(themeFg) ?? BLACK, parseHex(themeBg) ?? BLACK),
    [themeFg, themeBg],
  );
  const colorScheme =
    relativeLuminance(parseHex(theme.surface) ?? BLACK) < DARK_SURFACE_LUMINANCE
      ? "dark"
      : "light";
  const themeVars = themeToCssVars(theme);

  // Mirror the theme on <html> so overscroll shows the surface color.
  useEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(themeToCssVars(theme))) {
      root.style.setProperty(name, value);
    }
    root.style.backgroundColor = theme.surface;
    root.style.colorScheme = colorScheme;
  }, [theme, colorScheme]);

  // Keep the address bar in sync so the current state can be shared.
  useEffect(() => {
    const query = buildQuery(fgText, bgText);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query}`,
    );
  }, [fgText, bgText]);

  const changeFg = (value: string) => {
    setFgText(value);
    setMessage("");
  };
  const changeBg = (value: string) => {
    setBgText(value);
    setMessage("");
  };

  const swap = () => {
    setFgText(bgText);
    setBgText(fgText);
    setMessage("");
  };

  const suggest = () => {
    if (!fg || !bg) return;
    const suggestion = suggestTextColor(fg, bg, target);
    if (!suggestion) {
      setMessage(
        `No text color with this hue and saturation can reach ${target} on this background. Try a different background.`,
      );
      return;
    }
    if (suggestion.hex === fgText.toUpperCase()) {
      setMessage(`The text color already meets ${target}.`);
      return;
    }
    setFgText(suggestion.hex);
    setFlashing(true);
    setMessage(
      `Text color set to ${suggestion.hex}, ${formatRatio(suggestion.ratio)}, meeting ${target}.`,
    );
  };

  return (
    <div
      data-testid="app-root"
      style={{ ...themeVars, colorScheme } as CSSProperties}
      className="min-h-dvh bg-surface text-ink"
    >
      <div className="mx-auto flex w-full max-w-page flex-col px-gutter pt-page-top pb-page-bottom">
        <main>
          <header className="flex items-baseline justify-between">
            <h1 className="text-title">Contrast Check</h1>
            <p className="text-label text-ink-muted">WCAG 2.2</p>
          </header>

          <div className="mt-row-top md:grid md:grid-cols-3">
            <fieldset className="m-0 grid min-w-0 border-0 p-0 md:col-span-2 md:grid-cols-2">
              <legend className="sr-only">Colors</legend>
              <ColorField
                id="fg"
                label="Text"
                value={fgText}
                onChange={changeFg}
                className={firstGroup}
                flashing={flashing}
                onFlashEnd={() => setFlashing(false)}
              />
              <ColorField
                id="bg"
                label="Background"
                value={bgText}
                onChange={changeBg}
                className={nextGroup}
              />
            </fieldset>
            <div className={`flex flex-col gap-2 ${lastGroup}`}>
              <p aria-hidden="true" className="text-label text-ink-muted">
                Actions
              </p>
              <button
                type="button"
                onClick={swap}
                className="cc-outline cc-press h-control w-full cursor-pointer rounded-control border border-line bg-transparent px-4 text-ui text-ink md:w-auto md:self-start"
              >
                Swap colors
              </button>
              <SuggestPanel
                target={target}
                onTargetChange={(t) => {
                  setTarget(t);
                  setMessage("");
                }}
                onSuggest={suggest}
                disabled={!evaluation}
                message={message}
              />
            </div>
          </div>

          <Results evaluation={evaluation} />
          {fg && bg ? <Preview fg={toHex(fg)} /> : null}
        </main>

        <footer className="mt-footer-top flex flex-wrap gap-x-2 text-label text-ink-muted">
          <span>Contrast Check</span>
          <span aria-hidden="true">·</span>
          <a
            href="https://contrast-check-next.vercel.app"
            className="underline underline-offset-3"
          >
            Next.js
          </a>
          <span aria-hidden="true">·</span>
          <a
            href="https://contrast-check-nuxt.vercel.app"
            className="underline underline-offset-3"
          >
            Nuxt
          </a>
          <span aria-hidden="true">·</span>
          <a
            href="https://github.com/dannms/contrast-check"
            className="underline underline-offset-3"
          >
            GitHub
          </a>
        </footer>
      </div>
    </div>
  );
}
