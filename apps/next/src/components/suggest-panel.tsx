import type { SuggestionTarget } from "@contrast-check/core";

type SuggestPanelProps = {
  target: SuggestionTarget;
  onTargetChange: (target: SuggestionTarget) => void;
  onSuggest: () => void;
  disabled: boolean;
  message: string;
};

export function SuggestPanel({
  target,
  onTargetChange,
  onSuggest,
  disabled,
  message,
}: SuggestPanelProps) {
  return (
    <section aria-labelledby="suggest-heading" className="flex flex-col gap-2">
      <h2 id="suggest-heading" className="sr-only">
        Suggestion
      </h2>
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-end">
        <div className="flex flex-col gap-2">
          <label htmlFor="target" className="text-label text-ink-muted">
            Target level
          </label>
          <select
            id="target"
            value={target}
            onChange={(e) => onTargetChange(e.target.value as SuggestionTarget)}
            className="h-control w-full rounded-control border border-line bg-transparent px-4 text-ui text-ink md:w-auto"
          >
            <option value="AA">AA normal text (4.5:1)</option>
            <option value="AAA">AAA normal text (7:1)</option>
          </select>
        </div>
        <button
          type="button"
          onClick={onSuggest}
          disabled={disabled}
          className="cc-press h-control w-full cursor-pointer rounded-control bg-ink px-4 text-ui text-surface disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
        >
          Suggest accessible text color
        </button>
      </div>
      <p aria-live="polite" className="min-h-6 text-label text-ink-muted">
        {message}
      </p>
      <p className="max-w-summary text-label text-ink-muted">
        Keeps the hue and saturation of the text color and adjusts only its
        lightness until the target is met.
      </p>
    </section>
  );
}
