import { parseHex, toHex } from "@contrast-check/core";

type ColorFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** Plays the short tint flash on the input (after a suggestion is applied). */
  flashing?: boolean;
  onFlashEnd?: () => void;
};

/** Hex text input kept in sync with a native color picker shown as a circle. */
export function ColorField({
  id,
  label,
  value,
  onChange,
  className = "",
  flashing = false,
  onFlashEnd,
}: ColorFieldProps) {
  const rgb = parseHex(value);
  const invalid = rgb === null;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-label text-ink-muted">
        {label}
      </label>
      <div className="flex items-center justify-between gap-4 md:justify-start">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onAnimationEnd={onFlashEnd}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${hintId} ${errorId}` : hintId}
          autoComplete="off"
          spellCheck={false}
          maxLength={7}
          className={`w-hex min-w-0 rounded-none border-0 border-b border-line bg-transparent p-0 pb-1.5 text-input text-ink aria-[invalid=true]:border-ink ${flashing ? "cc-flash" : ""}`}
        />
        <input
          type="color"
          aria-label={`${label} color picker`}
          value={rgb ? toHex(rgb).toLowerCase() : "#000000"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="cc-swatch shrink-0"
        />
      </div>
      <p id={hintId} className="text-label text-ink-muted">
        Hex, like #1A2B3C or #ABC
      </p>
      {invalid && (
        <p id={errorId} className="text-label font-medium text-ink">
          Enter a valid hex color, such as #1A2B3C or #ABC.
        </p>
      )}
    </div>
  );
}
