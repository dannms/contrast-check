import type { PaletteView, ViewAction } from "@contrast-check/core";
import type { Dispatch } from "react";
import { FILLED_BUTTON } from "./palette-actions";

type Props = {
  view: Pick<
    PaletteView,
    "focus" | "pairs" | "paletteVerdict" | "message" | "liveSummary" | "options"
  >;
  dispatch: Dispatch<ViewAction>;
};

function ResultIcon({ pass }: { pass: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="size-4 shrink-0"
    >
      {pass ? (
        <path d="m3 8.5 3.5 3.5L13 4.5" />
      ) : (
        <path d="m4 4 8 8M12 4l-8 8" />
      )}
    </svg>
  );
}

/** The pair in focus (ratio, verdict, message), the pairs table and the hidden live summary. */
export function PairResults({ view, dispatch }: Props) {
  const { focus, pairs, paletteVerdict, message, liveSummary, options } = view;
  const [whole = "", fraction = ""] = focus.ratio.split(".");

  return (
    <>
      <section
        aria-labelledby="results-heading"
        className="mt-8 grid gap-y-8 border-t border-hairline pt-8 lg:grid-cols-5 lg:gap-x-16"
      >
        <h2 id="results-heading" className="sr-only">
          Results
        </h2>
        <div className="lg:col-span-2">
          <p className="text-xs/4 text-ink-muted">In focus · {focus.label}</p>
          <p
            data-testid="focus-ratio"
            className="mt-2 text-7xl leading-none font-light tracking-tighter whitespace-nowrap md:text-8xl lg:tall:text-9xl"
          >
            {whole}.{fraction}
            <span className="text-3xl tracking-normal text-ink-muted md:text-4xl lg:tall:text-5xl">
              :1
            </span>
          </p>
          <p
            data-testid="focus-verdict"
            className="mt-4 min-h-12 max-w-md text-sm/6 text-ink"
          >
            {focus.verdict}
          </p>
          <p
            data-testid="message"
            aria-live="polite"
            className="mt-2 min-h-12 text-sm/6 text-ink"
          >
            {message}
          </p>
        </div>

        <div className="lg:col-span-3">
          <p data-testid="palette-verdict" className="text-sm/6 font-medium">
            {paletteVerdict}
          </p>
          <table className="mt-4 w-full border-separate border-spacing-0 text-left text-sm/6">
            <caption className="sr-only">
              Palette pairs at {options.level}
            </caption>
            <thead>
              <tr className="text-xs/4 text-ink-muted">
                <th scope="col" className="pr-4 pb-2 font-normal">
                  Pair
                </th>
                <th
                  scope="col"
                  className="hidden pr-4 pb-2 font-normal md:table-cell"
                >
                  Ratio
                </th>
                <th
                  scope="col"
                  className="hidden pr-4 pb-2 font-normal md:table-cell"
                >
                  Minimum
                </th>
                <th scope="col" className="pr-4 pb-2 font-normal">
                  Result
                </th>
                <th scope="col" className="w-16 pb-2 font-normal">
                  <span className="sr-only">Fix</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pairs.map((pair) => (
                <tr key={pair.id} data-testid={`pair-${pair.id}`}>
                  <td className="h-12 border-t border-hairline lg:h-10 pr-4">
                    <button
                      type="button"
                      data-pair-button={pair.id}
                      aria-pressed={pair.focused}
                      onClick={() => dispatch({ type: "focus", pair: pair.id })}
                      className="block w-full cursor-pointer text-left"
                    >
                      <span
                        data-testid="pair-name"
                        className={
                          pair.focused
                            ? "font-medium underline underline-offset-4"
                            : ""
                        }
                      >
                        {pair.label}
                      </span>
                      <span
                        data-testid="pair-meta"
                        className="block text-xs/4 text-ink-muted md:hidden"
                      >
                        {pair.meta}
                      </span>
                    </button>
                  </td>
                  <td className="hidden h-12 border-t border-hairline lg:h-10 pr-4 md:table-cell">
                    {pair.ratio}
                  </td>
                  <td className="hidden h-12 border-t border-hairline lg:h-10 pr-4 md:table-cell">
                    {pair.minimum}
                  </td>
                  <td className="h-12 border-t border-hairline lg:h-10 pr-4">
                    <span className="flex items-center gap-2 font-medium">
                      <ResultIcon pass={pair.pass} />
                      {pair.pass ? "Pass" : "Fail"}
                    </span>
                  </td>
                  <td className="h-12 border-t border-hairline lg:h-10 w-16 text-right">
                    {pair.pass ? null : (
                      <button
                        type="button"
                        data-fix={pair.id}
                        aria-label={pair.fixLabel}
                        onClick={() => dispatch({ type: "fix", pair: pair.id })}
                        className={`${FILLED_BUTTON} -my-px`}
                      >
                        Fix
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p
        data-testid="live-summary"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveSummary}
      </p>
    </>
  );
}
