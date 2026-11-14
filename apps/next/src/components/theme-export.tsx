import type { PaletteView } from "@contrast-check/core";
import { FILLED_BUTTON } from "./palette-actions";

type Props = {
  exportText: PaletteView["exportText"];
  onCopy: () => void;
};

/** The Tailwind v4 theme in a focusable, scrollable code region with a Copy button. */
export function ThemeExport({ exportText, onCopy }: Props) {
  return (
    <section className="mt-10 border-t border-hairline pt-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs/4 text-ink-muted">
          Export · Tailwind CSS v4 theme
        </p>
        <button type="button" onClick={onCopy} className={FILLED_BUTTON}>
          Copy
        </button>
      </div>
      {/* biome-ignore lint/a11y/useSemanticElements: a <pre> keeps the code formatting and needs the region role to carry its name */}
      <pre
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable code region must be reachable by keyboard
        tabIndex={0}
        role="region"
        aria-label="Tailwind theme"
        data-testid="export-code"
        className="mt-4 max-h-96 overflow-auto rounded-xs border border-line p-4 text-xs/4"
      >
        <code>{exportText}</code>
      </pre>
    </section>
  );
}
