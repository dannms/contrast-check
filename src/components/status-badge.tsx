/** Pass/Fail indicator: icon plus text, never color alone. */
export function StatusBadge({ pass }: { pass: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-tight font-semibold ${pass ? "text-pass" : "text-fail"}`}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 20 20"
        width="20"
        height="20"
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
