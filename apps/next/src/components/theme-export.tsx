import type { PaletteView } from "@contrast-check/core";
import { FILLED_BUTTON } from "./palette-actions";

type Props = {
  exportText: PaletteView["exportText"];
  copy: PaletteView["copy"];
  onCopy: () => void;
};

/** The Tailwind v4 theme in a focusable, scrollable code region with a Copy button. */
export function ThemeExport({ exportText, copy, onCopy }: Props) {
  return (
    <section className="mt-10 border-t border-hairline pt-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs/4 text-ink-muted">
          Export · Tailwind CSS v4 theme
        </p>
        <button
          type="button"
          onClick={onCopy}
          data-testid="copy-button"
          className={`${FILLED_BUTTON} inline-flex min-w-28 items-center justify-center gap-2`}
        >
          {copy.state === "copied" && (
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="size-4 shrink-0"
            >
              <path d="m3 8.5 3.5 3.5L13 4.5" />
            </svg>
          )}
          {copy.buttonLabel}
        </button>
        <span
          data-testid="copy-announcement"
          aria-live="polite"
          className="sr-only"
        >
          {copy.announcement}
        </span>
      </div>
      <p data-testid="copy-error" className="mt-2 min-h-4 text-xs/4 text-ink">
        {copy.error}
      </p>
      <section
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable code region must be reachable by keyboard
        tabIndex={0}
        aria-label="Tailwind theme"
        data-testid="export-code"
        className="mt-4 max-h-96 overflow-auto rounded-xs border border-line p-4 text-xs/4"
      >
        <pre>
          <code>{exportText}</code>
        </pre>
      </section>
    </section>
  );
}
