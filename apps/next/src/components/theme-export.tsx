import type { PaletteView } from "@contrast-check/core";
import { ICON_BUTTON } from "./palette-actions";

type Props = {
  exportText: PaletteView["exportText"];
  copy: PaletteView["copy"];
  onCopy: () => void;
};

const ICON_CLASS = "size-4 shrink-0";

/** The icon shows what a click does, or what just happened. The swap is instant. */
function CopyIcon({ state }: { state: PaletteView["copy"]["state"] }) {
  if (state === "copied") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className={ICON_CLASS}
      >
        <path d="m3 8.5 3.5 3.5L13 4.5" />
      </svg>
    );
  }
  if (state === "failed") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className={ICON_CLASS}
      >
        <path d="M8 2.5 14 13H2L8 2.5Z" />
        <path d="M8 6.5v3M8 11.5h.01" />
      </svg>
    );
  }
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={ICON_CLASS}
    >
      <rect x="5.5" y="5.5" width="8" height="8" rx="1" />
      <path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
    </svg>
  );
}

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
          aria-label="Copy theme"
          data-state={copy.state}
          data-testid="copy-button"
          className={ICON_BUTTON}
        >
          <CopyIcon state={copy.state} />
        </button>
        <span
          data-testid="copy-announcement"
          aria-live="polite"
          className="sr-only"
        >
          {copy.announcement}
        </span>
      </div>
      <section
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable code region must be reachable by keyboard
        tabIndex={0}
        id="export-code"
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
