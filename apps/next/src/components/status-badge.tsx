/** Pass/Fail indicator: icon plus word, same ink for both, never color alone. */
export function StatusBadge({ pass }: { pass: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-medium">
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 20 20"
        className="size-icon"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <title>{pass ? "Pass" : "Fail"}</title>
        {pass ? (
          <path d="M4 10.5l4 4 8-9" />
        ) : (
          <path d="M5 5l10 10M15 5L5 15" />
        )}
      </svg>
      {pass ? "Pass" : "Fail"}
    </span>
  );
}
