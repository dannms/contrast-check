import type { PaletteView } from "@contrast-check/core";

type Props = { preview: PaletteView["preview"] };

const DASHED = "outline-2 outline-dashed outline-offset-4 outline-ink";

/** A settings screen in the exact colors of the palette. Nothing here takes focus. */
export function PalettePreview({ preview: p }: Props) {
  const on = (part: PaletteView["preview"]["highlight"]) =>
    p.highlight === part ? DASHED : "";

  return (
    <section className="mt-10 border-t border-hairline pt-8 lg:mt-10">
      <p className="text-xs/4 text-ink-muted">
        Preview · your colors, unaltered
      </p>
      <div
        data-testid="preview"
        style={{ color: p.text }}
        className="mt-6 flex flex-col gap-6"
      >
        <div className={`flex flex-col gap-6 ${on("copy")}`}>
          <p className="text-4xl/10 font-light tracking-tight">
            Notification settings
          </p>
          <p className="max-w-prose text-base/6">
            Choose how and when you hear from us. You can change these at any
            time.
          </p>
        </div>

        <div
          style={{ backgroundColor: p.secondary, color: p.secondaryLabel }}
          className={`max-w-xl rounded-xs p-6 ${on("panel")}`}
        >
          <p className="text-base/6 font-medium">Email updates</p>
          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center">
            <span className="text-base/6 md:w-40">Send to</span>
            <span className="flex h-10 flex-1 items-center rounded-xs border border-current px-3 text-base/6">
              name@example.com
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center">
            <span className="text-base/6 md:w-40">How often</span>
            <span className="flex h-10 flex-1 items-center rounded-xs border border-current px-3 text-base/6">
              Weekly digest
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <span
            style={{ backgroundColor: p.primary, color: p.primaryLabel }}
            className={`inline-flex h-10 items-center rounded-xs px-4 text-base/6 ${on("save")}`}
          >
            Save changes
          </span>
          <span
            style={{ borderColor: p.text }}
            className="inline-flex h-10 items-center rounded-xs border px-4 text-base/6"
          >
            Cancel
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <span
            style={{ borderColor: p.accent, color: p.accent }}
            className={`inline-flex h-8 items-center rounded-xs border px-3 text-sm/6 ${on("chip")}`}
          >
            New
          </span>
          <span
            style={{ color: p.accent }}
            className={`text-base/6 underline underline-offset-4 ${on("link")}`}
          >
            Read what changed
          </span>
        </div>
      </div>
    </section>
  );
}
