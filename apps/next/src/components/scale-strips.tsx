"use client";

import type { PaletteView, ViewAction } from "@contrast-check/core";
import { type Dispatch, type KeyboardEvent, useRef } from "react";

type Props = {
  scales: PaletteView["scales"];
  dispatch: Dispatch<ViewAction>;
};

/** Five strips of 11 steps; each strip is a radio group with roving tabindex. */
export function ScaleStrips({ scales, dispatch }: Props) {
  const refs = useRef<Record<string, (HTMLButtonElement | null)[]>>({});

  const onKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    scale: PaletteView["scales"][number],
  ) => {
    const items = scale.steps;
    const current = Number((event.target as HTMLElement).dataset.index);
    if (Number.isNaN(current)) return;
    let next = current;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      next = (current + 1) % items.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = (current - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;
    event.preventDefault();
    const step = items[next];
    if (!step) return;
    dispatch({ type: "step", role: scale.role, hex: step.hex });
    refs.current[scale.role]?.[next]?.focus();
  };

  return (
    <section className="mt-10 border-t border-hairline pt-8">
      <p className="text-xs/4 text-ink-muted">
        Scales · 11 steps from each seed, in OKLCH
      </p>
      <div className="mt-6 grid gap-y-6">
        {scales.map((scale) => (
          <div
            key={scale.role}
            className="lg:grid lg:grid-cols-scale lg:gap-x-6"
          >
            <p aria-hidden="true" className="text-xs/4 text-ink-muted">
              {scale.label}
            </p>
            <div
              role="radiogroup"
              aria-label={scale.label}
              onKeyDown={(e) => onKeyDown(e, scale)}
              className="mt-2 grid grid-cols-6 gap-x-1 gap-y-2 md:grid-cols-11 md:gap-1 lg:mt-0"
            >
              {scale.steps.map((step, index) => (
                // biome-ignore lint/a11y/useSemanticElements: see above
                <button
                  key={step.name}
                  ref={(el) => {
                    const list = refs.current[scale.role] ?? [];
                    list[index] = el;
                    refs.current[scale.role] = list;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={step.checked}
                  aria-label={step.ariaLabel}
                  tabIndex={step.tabbable ? 0 : -1}
                  data-index={index}
                  onClick={() =>
                    dispatch({ type: "step", role: scale.role, hex: step.hex })
                  }
                  className="group block min-w-0 cursor-pointer text-left"
                >
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: step.hex, borderColor: step.hex }}
                    className="block h-12 rounded-xs border group-aria-checked:outline-2 group-aria-checked:outline-offset-2 group-aria-checked:outline-ink"
                  />
                  <span
                    aria-hidden="true"
                    className="mt-2 block text-xs/4 group-aria-checked:font-medium"
                  >
                    {step.name}
                  </span>
                  <span
                    aria-hidden="true"
                    data-testid="step-ratio"
                    className="block text-xs/4 whitespace-nowrap text-ink-muted tabular-nums"
                  >
                    {step.ratio}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
