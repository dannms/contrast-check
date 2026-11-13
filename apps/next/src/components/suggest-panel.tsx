import type { SuggestionTarget } from "@/lib/color";

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
    <section
      aria-labelledby="suggest-heading"
      className="flex flex-col gap-gutter"
    >
      <h2 id="suggest-heading" className="text-xl font-semibold">
        Suggestion
      </h2>
      <p className="text-muted">
        Keeps the hue and saturation of the text color and adjusts only its
        lightness until the target is met.
      </p>
      <div className="flex flex-wrap items-end gap-gutter">
        <div className="flex flex-col gap-tight">
          <label htmlFor="target" className="font-semibold">
            Target level
          </label>
          <select
            id="target"
            value={target}
            onChange={(e) => onTargetChange(e.target.value as SuggestionTarget)}
            className="h-11 rounded-control border border-edge bg-page px-3 text-ink"
          >
            <option value="AA">AA normal text (4.5:1)</option>
            <option value="AAA">AAA normal text (7:1)</option>
          </select>
        </div>
        <button
          type="button"
          onClick={onSuggest}
          disabled={disabled}
          className="h-11 cursor-pointer rounded-control bg-accent px-gutter font-semibold text-on-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          Suggest accessible text color
        </button>
      </div>
      <p aria-live="polite" className="min-h-6">
        {message}
      </p>
    </section>
  );
}
