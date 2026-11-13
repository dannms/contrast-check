import { type Evaluation, formatRatio, summarize } from "@contrast-check/core";
import { StatusBadge } from "./status-badge";

type ResultsProps = {
  evaluation: Evaluation | null;
};

/** The ratio as the focal point, a one-sentence live summary and the criteria table. */
export function Results({ evaluation }: ResultsProps) {
  const [ratioValue = ""] = evaluation
    ? formatRatio(evaluation.ratio).split(":")
    : [];

  return (
    <section
      aria-labelledby="results-heading"
      className="mt-results-top flex flex-col gap-12 border-t border-hairline pt-rule md:flex-row md:flex-wrap md:gap-x-16"
    >
      <h2 id="results-heading" className="sr-only">
        Results
      </h2>
      <div className="flex flex-col gap-4 md:shrink md:grow md:basis-ratio">
        {evaluation && (
          <>
            <p className="text-label text-ink-muted">Contrast ratio</p>
            <p data-testid="ratio" className="whitespace-nowrap text-ratio">
              {ratioValue}
              <span className="text-ratio-unit tracking-normal text-ink-muted">
                :1
              </span>
            </p>
          </>
        )}
        <p
          data-testid="live-summary"
          aria-live="polite"
          aria-atomic="true"
          className="max-w-summary text-ui text-ink-muted"
        >
          {evaluation
            ? summarize(evaluation)
            : "Enter two valid hex colors to see the contrast ratio."}
        </p>
      </div>
      {evaluation && (
        <div className="md:shrink md:grow md:basis-criteria">
          <table className="w-full border-collapse text-left text-ui">
            <caption className="sr-only">WCAG 2.2 contrast criteria</caption>
            <thead>
              <tr className="text-label text-ink-muted">
                <th scope="col" className="pr-4 pb-2 font-normal">
                  Criterion
                </th>
                <th scope="col" className="pr-4 pb-2 font-normal">
                  Minimum
                </th>
                <th scope="col" className="pb-2 font-normal">
                  Result
                </th>
              </tr>
            </thead>
            <tbody>
              {evaluation.criteria.map((c) => (
                <tr
                  key={c.id}
                  data-testid={c.id}
                  className="border-t border-hairline"
                >
                  <th scope="row" className="py-row pr-4 font-normal">
                    {c.label}
                  </th>
                  <td className="py-row pr-4">{c.threshold}:1</td>
                  <td className="py-row">
                    <StatusBadge pass={c.pass} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
