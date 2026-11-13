type PreviewProps = {
  fg: string;
  bg: string;
};

/** Live sample of the chosen colors at normal (16px) and large (24px bold) sizes. */
export function Preview({ fg, bg }: PreviewProps) {
  return (
    <section
      aria-labelledby="preview-heading"
      className="flex flex-col gap-gutter"
    >
      <h2 id="preview-heading" className="text-xl font-semibold">
        Preview
      </h2>
      <div
        className="flex flex-col gap-gutter rounded-control border border-edge p-stack"
        style={{ color: fg, backgroundColor: bg }}
      >
        <p className="text-sample">
          Normal text, 16px. The quick brown fox jumps over the lazy dog.
        </p>
        <p className="text-sample-large font-bold">
          Large text, 24px bold. Pack my box with five dozen liquor jugs.
        </p>
      </div>
    </section>
  );
}
