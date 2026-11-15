"use client";

import {
  initialViewState,
  type PairId,
  type Palette,
  type PaletteOptions,
  paletteView,
  reduce,
  type ViewAction,
} from "@contrast-check/core";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { PairResults } from "./pair-results";
import { PaletteActions } from "./palette-actions";
import { PaletteFields } from "./palette-fields";
import { PalettePreview } from "./palette-preview";
import { ScaleStrips } from "./scale-strips";
import { ThemeExport } from "./theme-export";

type Props = { palette: Palette; options: PaletteOptions };

/** Holds the state, renders the view of the core and does the browser-only work. */
export function PaletteApp({ palette, options }: Props) {
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    initialViewState(palette, options),
  );
  const view = useMemo(() => paletteView(state), [state]);

  // After a fix the button disappears: the focus goes to the pair button instead.
  const pendingFocus = useRef<PairId | null>(null);
  const act = useCallback((action: ViewAction) => {
    if (action.type === "fix") pendingFocus.current = action.pair;
    dispatch(action);
  }, []);
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs after each state change to move the focus
  useEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    pendingFocus.current = null;
    if (document.querySelector(`[data-fix="${id}"]`)) return;
    document.querySelector<HTMLElement>(`[data-pair-button="${id}"]`)?.focus();
  }, [state]);

  // Mirror the theme on <html> so overscroll shows the surface color.
  useEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(view.cssVars)) {
      root.style.setProperty(name, value);
    }
    root.style.backgroundColor = view.cssVars["--cc-surface"] ?? "";
    root.style.colorScheme = view.colorScheme;
  }, [view.cssVars, view.colorScheme]);

  // Keep the address bar in sync so the current state can be shared.
  useEffect(() => {
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${view.query}`,
    );
  }, [view.query]);

  // The "Copied" feedback goes back to "Copy" after two seconds.
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  const copy = async () => {
    clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(view.exportText);
      act({ type: "copied", ok: true });
      copyTimer.current = setTimeout(() => act({ type: "copyReset" }), 2000);
    } catch {
      act({ type: "copied", ok: false });
    }
  };

  return (
    <div
      data-testid="app-root"
      style={
        { ...view.cssVars, colorScheme: view.colorScheme } as CSSProperties
      }
      className="min-h-dvh bg-surface text-ink"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 pt-6 pb-12 md:px-8 md:pt-8 lg:px-12">
        <main>
          <header className="flex items-baseline justify-between">
            <h1 className="text-sm/6 font-medium">Contrast Check</h1>
            <p className="text-xs/4 text-ink-muted">WCAG 2.2</p>
          </header>

          <PaletteFields fields={view.fields} dispatch={act} />
          <PaletteActions options={view.options} dispatch={act} />
          <PairResults view={view} dispatch={act} />
          <ScaleStrips scales={view.scales} dispatch={act} />

          <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-16">
            <PalettePreview preview={view.preview} />
            <ThemeExport
              exportText={view.exportText}
              copy={view.copy}
              onCopy={copy}
            />
          </div>
        </main>

        <footer className="mt-16 flex flex-wrap gap-x-2 text-xs/4 text-ink-muted">
          <span>Contrast Check</span>
          <span aria-hidden="true">·</span>
          <a
            href="https://contrast-check-next.vercel.app"
            className="underline underline-offset-4"
          >
            Next.js
          </a>
          <span aria-hidden="true">·</span>
          <a
            href="https://contrast-check-nuxt.vercel.app"
            className="underline underline-offset-4"
          >
            Nuxt
          </a>
          <span aria-hidden="true">·</span>
          <a
            href="https://github.com/dannms/contrast-check"
            className="underline underline-offset-4"
          >
            GitHub
          </a>
        </footer>
      </div>
    </div>
  );
}
