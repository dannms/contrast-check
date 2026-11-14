import type { SuggestionTarget } from "@contrast-check/core";

export type SuggestionMessage = {
  kind: "applied" | "met" | "impossible";
  text: string;
};

type SuggestPanelProps = {
  target: SuggestionTarget;
  onTargetChange: (target: SuggestionTarget) => void;
  onSuggest: () => void;
  disabled: boolean;
  message: SuggestionMessage | null;
};

/** Check, information circle or warning triangle, one per message state. */
function MessageIcon({ kind }: { kind: SuggestionMessage["kind"] }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {kind === "applied" && <path d="M4 10.5l4 4 8-9" />}
      {kind === "met" && (
        <>
          <circle cx="10" cy="10" r="8" />
          <path d="M10 9v5M10 6h.01" />
        </>
      )}
      {kind === "impossible" && (
        <>
          <path d="M10 3L2 17h16L10 3z" />
          <path d="M10 8v4M10 14.5h.01" />
        </>
      )}
    </svg>
  );
}

// From lg this section spans the two columns and four rows of the Actions grid
// and inherits them with subgrid, so the label and the select sit in column
// 2, Suggest spans both columns and the DOM order stays Swap, select, Suggest.
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
      className="flex flex-col gap-2 lg:col-span-2 lg:col-start-1 lg:row-span-4 lg:row-start-1 lg:grid lg:grid-cols-subgrid lg:grid-rows-subgrid"
    >
      <h2 id="suggest-heading" className="sr-only">
        Suggestion
      </h2>
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-end lg:col-span-2 lg:row-span-3 lg:row-start-1 lg:grid lg:grid-cols-subgrid lg:grid-rows-subgrid lg:items-start">
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:grid lg:grid-rows-subgrid">
          <label htmlFor="target" className="block text-xs/4 text-ink-muted">
            Target level
          </label>
          <div className="relative mt-2 lg:mt-0">
            <select
              id="target"
              value={target}
              onChange={(e) =>
                onTargetChange(e.target.value as SuggestionTarget)
              }
              className="block h-12 w-full appearance-none rounded-xs border border-line bg-transparent pr-10 pl-4 text-sm/6 text-ink forced-colors:appearance-auto md:w-auto lg:h-10 lg:w-full"
            >
              <option value="AA">AA normal text (4.5:1)</option>
              <option value="AAA">AAA normal text (7:1)</option>
            </select>
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 16 16"
              className="pointer-events-none absolute inset-y-0 right-4 my-auto size-4 forced-colors:hidden"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
          </div>
        </div>
        <button
          type="button"
          onClick={onSuggest}
          disabled={disabled}
          className="h-12 w-full cursor-pointer rounded-xs bg-ink px-4 text-sm/6 text-surface transition-transform duration-150 ease-press active:scale-97 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100 md:w-auto lg:col-span-2 lg:row-start-3 lg:h-10 lg:w-full"
        >
          Suggest accessible text color
        </button>
      </div>
      <div className="lg:col-span-2 lg:row-start-4">
        <div aria-live="polite">
          {message && (
            <p className="mb-2 flex gap-2 text-sm/6 text-ink">
              <span className="flex h-6 shrink-0 items-center">
                <MessageIcon kind={message.kind} />
              </span>
              {message.text}
            </p>
          )}
        </div>
        <p className="text-xs/4 text-ink-muted">
          Changes only the lightness of your text color.
        </p>
      </div>
    </section>
  );
}
