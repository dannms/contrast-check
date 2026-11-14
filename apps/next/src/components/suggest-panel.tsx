import type { SuggestionTarget } from "@contrast-check/core";

type SuggestPanelProps = {
  target: SuggestionTarget;
  onTargetChange: (target: SuggestionTarget) => void;
  onSuggest: () => void;
  disabled: boolean;
  message: string;
};

// From lg the section and its controls row are "contents", so the select and
// the Suggest button join the Actions row next to Swap while the DOM order stays.
export function SuggestPanel({
  target,
  onTargetChange,
  onSuggest,
  disabled,
  message,
}: SuggestPanelProps) {
  return (
    <section
      aria-labelledby="suggest-heading"
      className="flex flex-col gap-2 lg:contents"
    >
      <h2 id="suggest-heading" className="sr-only">
        Suggestion
      </h2>
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-end lg:contents">
        <div>
          <label htmlFor="target" className="block text-xs/4 text-ink-muted">
            Target level
          </label>
          <select
            id="target"
            value={target}
            onChange={(e) => onTargetChange(e.target.value as SuggestionTarget)}
            className="mt-2 h-12 w-full rounded-xs border border-line bg-transparent px-4 text-sm/6 text-ink md:w-auto lg:h-10"
          >
            <option value="AA">AA normal text (4.5:1)</option>
            <option value="AAA">AAA normal text (7:1)</option>
          </select>
        </div>
        <button
          type="button"
          onClick={onSuggest}
          disabled={disabled}
          className="h-12 w-full cursor-pointer rounded-xs bg-ink px-4 text-sm/6 text-surface transition-transform duration-150 ease-press active:scale-97 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100 md:w-auto lg:h-10 lg:basis-full"
        >
          Suggest accessible text color
        </button>
      </div>
      <p className="text-xs/4 text-ink-muted lg:basis-full">
        Changes only the lightness of your text color.
      </p>
      <p
        aria-live="polite"
        className="min-h-4 text-xs/4 text-ink-muted lg:basis-full"
      >
        {message}
      </p>
    </section>
  );
}
