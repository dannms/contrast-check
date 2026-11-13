import { type Evaluation, formatRatio, summarize } from "@contrast-check/core";
import { StatusBadge } from "./status-badge";

type ResultsProps = {
  evaluation: Evaluation | null;
};

/** Contrast ratio and per-criterion results, plus a concise live summary. */
export function Results({ evaluation }: ResultsProps) {
  return (
    <section
      aria-labelledby="results-heading"
      className="flex flex-col gap-gutter"
    >
      <h2 id="results-heading" className="text-xl font-semibold">
        Results
      </h2>
      <p
        data-testid="live-summary"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {evaluation
          ? summarize(evaluation)
          : "Enter two valid hex colors to see the contrast ratio."}
      </p>
      <div className="flex flex-col gap-gutter">
        {evaluation ? (
          <>
            <p>
              <span className="block text-muted">Contrast ratio</span>
              <span
                data-testid="ratio"
                className="block font-mono text-ratio font-bold leading-none"
              >
                {formatRatio(evaluation.ratio)}
              </span>
            </p>
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">WCAG 2.2 contrast criteria</caption>
              <thead>
                <tr className="border-b border-rule text-muted">
                  <th scope="col" className="py-tight pr-gutter font-semibold">
                    Criterion
                  </th>
                  <th scope="col" className="py-tight pr-gutter font-semibold">
                    Minimum
                  </th>
                  <th scope="col" className="py-tight font-semibold">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody>
                {evaluation.criteria.map((c) => (
                  <tr
                    key={c.id}
                    data-testid={c.id}
                    className="border-b border-rule"
                  >
                    <th scope="row" className="py-tight pr-gutter font-normal">
                      {c.label}
                    </th>
                    <td className="py-tight pr-gutter font-mono">
                      {c.threshold}:1
                    </td>
                    <td className="py-tight">
                      <StatusBadge pass={c.pass} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p>Enter two valid hex colors to see the contrast ratio.</p>
        )}
      </div>
    </section>
  );
}
