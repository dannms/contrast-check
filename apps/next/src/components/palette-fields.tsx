import type { PaletteView, ViewAction } from "@contrast-check/core";
import type { Dispatch } from "react";

type Props = {
  fields: PaletteView["fields"];
  dispatch: Dispatch<ViewAction>;
};

// Stacked with hairlines up to lg; from lg the columns are separated by a divider
// centered in the gap, so both sides have equal space.
const firstGroup = "pb-4 lg:pb-0";
const nextGroup =
  "relative border-t border-hairline py-4 lg:border-t-0 lg:py-0 lg:before:absolute lg:before:inset-y-0 lg:before:-left-4 lg:before:border-l lg:before:border-hairline";

/** Five role groups: label, hex input with its own "#", a circular picker and an always-present error line. */
export function PaletteFields({ fields, dispatch }: Props) {
  return (
    <fieldset className="m-0 mt-8 grid min-w-0 border-0 p-0 md:mt-10 lg:grid-cols-5 lg:gap-x-8">
      <legend className="sr-only">Palette</legend>
      {fields.map((f, index) => {
        const hintId = `${f.id}-hint`;
        const errorId = `${f.id}-error`;
        return (
          <div key={f.role} className={index === 0 ? firstGroup : nextGroup}>
            <label htmlFor={f.id} className="block text-xs/4 text-ink-muted">
              {f.label}
            </label>
            <div className="mt-2 flex items-center gap-4">
              <input
                id={f.id}
                type="text"
                value={f.draft}
                onChange={(e) =>
                  dispatch({
                    type: "draft",
                    role: f.role,
                    text: e.target.value,
                  })
                }
                aria-invalid={f.invalid}
                aria-describedby={`${hintId} ${errorId}`}
                autoComplete="off"
                spellCheck={false}
                size={7}
                maxLength={7}
                className="min-w-0 flex-1 rounded-none border-0 border-b border-line bg-transparent p-0 pb-2 text-4xl leading-none font-light text-ink aria-[invalid=true]:border-ink lg:text-3xl"
              />
              <input
                type="color"
                aria-label={`${f.label} color picker`}
                value={f.pickerHex}
                onChange={(e) =>
                  dispatch({
                    type: "pick",
                    role: f.role,
                    hex: e.target.value.toUpperCase(),
                  })
                }
                className="cc-swatch size-12 shrink-0 cursor-pointer appearance-none overflow-hidden rounded-full border border-line bg-transparent p-0 lg:size-10"
              />
            </div>
            <p id={hintId} className="sr-only">
              Hex, like #1A2B3C or #ABC
            </p>
            <p
              id={errorId}
              className="mt-2 min-h-4 text-xs/4 font-medium text-ink"
            >
              {f.error}
            </p>
          </div>
        );
      })}
    </fieldset>
  );
}
