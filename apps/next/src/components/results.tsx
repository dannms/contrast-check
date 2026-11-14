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
      className="mt-10 grid gap-y-8 border-t border-hairline pt-8 md:mt-12 md:grid-cols-2 md:gap-x-16"
    >
      <h2 id="results-heading" className="sr-only">
        Results
      </h2>
      <div>
        {evaluation && (
          <>
            <p className="text-xs/4 text-ink-muted">Contrast ratio</p>
            <p
              data-testid="ratio"
              className="mt-2 text-7xl leading-none font-light tracking-tighter whitespace-nowrap md:text-8xl lg:tall:text-9xl"
            >
              {ratioValue}
              <span className="text-3xl tracking-normal text-ink-muted md:text-4xl lg:tall:text-5xl">
                :1
              </span>
            </p>
          </>
        )}
        <p
          data-testid="live-summary"
          aria-live="polite"
          aria-atomic="true"
          className="mt-4 max-w-md text-sm/6 text-ink-muted"
        >
          {evaluation
            ? summarize(evaluation)
            : "Enter two valid hex colors to see the contrast ratio."}
        </p>
      </div>
      {evaluation && (
        <div>
          <table className="w-full border-collapse text-left text-sm/6">
            <caption className="sr-only">WCAG 2.2 contrast criteria</caption>
            <thead>
              <tr className="text-xs/4 text-ink-muted">
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
                  <th scope="row" className="py-2 pr-4 font-normal">
                    {c.label}
                  </th>
                  <td className="py-2 pr-4">{c.threshold}:1</td>
                  <td className="py-2">
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
