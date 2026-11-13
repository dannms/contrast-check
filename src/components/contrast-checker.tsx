"use client";

import { useEffect, useState } from "react";
import {
  evaluate,
  formatRatio,
  parseHex,
  type SuggestionTarget,
  suggestTextColor,
  toHex,
} from "@/lib/color";
import { buildQuery } from "@/lib/url-state";
import { ColorField } from "./color-field";
import { Preview } from "./preview";
import { Results } from "./results";
import { SuggestPanel } from "./suggest-panel";

type ContrastCheckerProps = {
  initialFg: string;
  initialBg: string;
};

export function ContrastChecker({
  initialFg,
  initialBg,
}: ContrastCheckerProps) {
  const [fgText, setFgText] = useState(initialFg);
  const [bgText, setBgText] = useState(initialBg);
  const [target, setTarget] = useState<SuggestionTarget>("AA");
  const [message, setMessage] = useState("");

  const fg = parseHex(fgText);
  const bg = parseHex(bgText);
  const evaluation = fg && bg ? evaluate(fg, bg) : null;

  // Keep the address bar in sync so the current state can be shared.
  useEffect(() => {
    const query = buildQuery(fgText, bgText);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query}`,
    );
  }, [fgText, bgText]);

  const changeFg = (value: string) => {
    setFgText(value);
    setMessage("");
  };
  const changeBg = (value: string) => {
    setBgText(value);
    setMessage("");
  };

  const swap = () => {
    setFgText(bgText);
    setBgText(fgText);
    setMessage("");
  };

  const suggest = () => {
    if (!fg || !bg) return;
    const suggestion = suggestTextColor(fg, bg, target);
    if (!suggestion) {
      setMessage(
        `No text color with this hue and saturation can reach ${target} on this background. Try a different background.`,
      );
      return;
    }
    if (suggestion.hex === fgText.toUpperCase()) {
      setMessage(`The text color already meets ${target}.`);
      return;
    }
    setFgText(suggestion.hex);
    setMessage(
      `Text color set to ${suggestion.hex}, ${formatRatio(suggestion.ratio)}, meeting ${target}.`,
    );
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-section px-gutter py-section">
      <header className="flex flex-col gap-tight">
        <h1 className="text-3xl font-bold">Contrast Check</h1>
        <p className="text-muted">
          Check text and background colors against WCAG 2.2 contrast criteria.
        </p>
      </header>

      <fieldset className="flex flex-col gap-gutter border-0 p-0">
        <legend className="mb-gutter text-xl font-semibold">Colors</legend>
        <div className="grid gap-stack sm:grid-cols-2">
          <ColorField id="fg" label="Text" value={fgText} onChange={changeFg} />
          <ColorField
            id="bg"
            label="Background"
            value={bgText}
            onChange={changeBg}
          />
        </div>
        <div>
          <button
            type="button"
            onClick={swap}
            className="h-11 cursor-pointer rounded-control border border-edge bg-page px-gutter font-semibold text-ink"
          >
            Swap colors
          </button>
        </div>
      </fieldset>

      {fg && bg ? <Preview fg={toHex(fg)} bg={toHex(bg)} /> : null}
      <Results evaluation={evaluation} />
      <SuggestPanel
        target={target}
        onTargetChange={(t) => {
          setTarget(t);
          setMessage("");
        }}
        onSuggest={suggest}
        disabled={!evaluation}
        message={message}
      />
    </main>
  );
}
