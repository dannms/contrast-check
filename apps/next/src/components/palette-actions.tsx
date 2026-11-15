import type { Level, PaletteView, ViewAction } from "@contrast-check/core";
import type { Dispatch } from "react";

const PRESS =
  "transition-transform duration-150 ease-press active:scale-97 motion-reduce:transition-none motion-reduce:active:scale-100";

export const OUTLINE_BUTTON = `cc-outline h-12 cursor-pointer rounded-xs border border-line bg-transparent px-4 text-sm/6 text-ink lg:h-10 ${PRESS}`;
export const FILLED_BUTTON = `h-12 cursor-pointer rounded-xs bg-button px-4 text-sm/6 text-button-label lg:h-10 ${PRESS}`;

type Props = {
  options: PaletteView["options"];
  dispatch: Dispatch<ViewAction>;
};

/** The global actions: swap, level and the accent-as-text switch. */
export function PaletteActions({ options, dispatch }: Props) {
  return (
    <div className="mt-6 flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-x-6 md:gap-y-2">
      <button
        type="button"
        onClick={() => dispatch({ type: "swap" })}
        className={`${OUTLINE_BUTTON} w-full md:w-auto`}
      >
        Swap text and background
      </button>

      <div className="flex flex-col md:flex-row md:items-center md:gap-2">
        <label htmlFor="level" className="text-xs/4 text-ink-muted">
          Level
        </label>
        <div className="relative mt-2 md:mt-0 md:w-32">
          <select
            id="level"
            value={options.level}
            onChange={(e) =>
              dispatch({ type: "level", level: e.target.value as Level })
            }
            className="cc-outline h-12 w-full cursor-pointer appearance-none rounded-xs border border-line bg-transparent pr-10 pl-4 text-sm/6 text-ink forced-colors:appearance-auto lg:h-10"
          >
            <option value="AA">AA</option>
            <option value="AAA">AAA</option>
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 forced-colors:hidden"
          >
            <path d="m4 6 4 4 4-4" />
          </svg>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={options.accentAsText}
        onClick={() =>
          dispatch({ type: "accentAsText", on: !options.accentAsText })
        }
        className="group flex h-12 cursor-pointer items-center gap-2 text-sm/6 text-ink lg:h-10"
      >
        <span
          aria-hidden="true"
          className="relative h-4 w-8 shrink-0 rounded-full border border-line group-aria-checked:border-ink group-aria-checked:bg-ink"
        >
          <span className="absolute top-px left-0 size-3 rounded-full bg-ink transition-transform duration-150 ease-press group-aria-checked:translate-x-4 group-aria-checked:bg-surface motion-reduce:transition-none" />
        </span>
        Accent as text
      </button>
    </div>
  );
}
