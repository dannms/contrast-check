import { parseHex, toHex } from "@contrast-check/core";

type ColorFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

/** Hex text input kept in sync with a native color picker. */
export function ColorField({ id, label, value, onChange }: ColorFieldProps) {
  const rgb = parseHex(value);
  const invalid = rgb === null;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-tight">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <div className="flex items-center gap-tight">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${hintId} ${errorId}` : hintId}
          autoComplete="off"
          spellCheck={false}
          maxLength={7}
          className="h-11 w-full min-w-0 rounded-control border border-edge bg-page px-3 font-mono text-ink aria-[invalid=true]:border-fail aria-[invalid=true]:border-2"
        />
        <input
          type="color"
          aria-label={`${label} color picker`}
          value={rgb ? toHex(rgb).toLowerCase() : "#000000"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-11 w-14 shrink-0 cursor-pointer rounded-control border border-edge bg-page p-1"
        />
      </div>
      <p id={hintId} className="text-sm text-muted">
        Hex, like #1A2B3C or #ABC
      </p>
      {invalid && (
        <p id={errorId} className="text-sm font-semibold text-fail">
          Enter a valid hex color, such as #1A2B3C or #ABC.
        </p>
      )}
    </div>
  );
}
