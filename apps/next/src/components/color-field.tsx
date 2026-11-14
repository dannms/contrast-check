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
    <div className={className}>
      <label htmlFor={id} className="block text-xs/4 text-ink-muted">
        {label}
      </label>
      <div className="mt-2 flex items-center gap-4 md:gap-2 lg:gap-4">
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
          size={7}
          maxLength={7}
          className={`min-w-0 flex-1 rounded-none border-0 border-b border-line bg-transparent p-0 pb-2 text-4xl leading-none font-light text-ink aria-[invalid=true]:border-ink xl:text-5xl ${flashing ? "animate-flash motion-reduce:animate-none" : ""}`}
        />
        <input
          type="color"
          aria-label={`${label} color picker`}
          value={rgb ? toHex(rgb).toLowerCase() : "#000000"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="cc-swatch size-12 shrink-0 cursor-pointer appearance-none overflow-hidden rounded-full border border-line bg-transparent p-0"
        />
      </div>
      <p id={hintId} className="sr-only">
        Hex, like #1A2B3C or #ABC
      </p>
      {invalid && (
        <p id={errorId} className="mt-2 text-xs/4 font-medium text-ink">
          Enter a valid hex color, such as #1A2B3C or #ABC.
        </p>
      )}
    </div>
  );
}
