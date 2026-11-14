type PreviewProps = {
  /** The chosen text color, shown unaltered. */
  fg: string;
};

/** Specimen in the raw text color, directly on the surface. It is what is being tested. */
export function Preview({ fg }: PreviewProps) {
  return (
    <section
      aria-labelledby="preview-heading"
      className="mt-preview-top flex flex-col gap-6 border-t border-hairline pt-rule"
    >
      <div className="flex flex-wrap items-baseline gap-x-4">
        <h2 id="preview-heading" className="text-label text-ink-muted">
          Preview
        </h2>
        <span className="text-label text-ink-muted">
          your text color, unaltered
        </span>
      </div>
      <div
        data-testid="specimen"
        className="flex flex-col gap-4"
        style={{ color: fg }}
      >
        <p className="text-spec-lg">Pack my box with five dozen liquor jugs.</p>
        <p className="text-spec-md">
          Large text, 24px. Pack my box with five dozen liquor jugs.
        </p>
        <p className="max-w-prose text-spec-body">
          Normal text, 16px. The quick brown fox jumps over the lazy dog.
        </p>
      </div>
    </section>
  );
}
