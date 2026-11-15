<script setup lang="ts">
import type { PaletteView, ViewAction } from "@contrast-check/core";

defineProps<{
  view: Pick<
    PaletteView,
    "focus" | "pairs" | "paletteVerdict" | "message" | "liveSummary" | "options"
  >;
}>();
const emit = defineEmits<{ dispatch: [action: ViewAction] }>();
</script>

<template>
  <section
    aria-labelledby="results-heading"
    class="mt-8 grid gap-y-8 border-t border-hairline pt-8 lg:grid-cols-5 lg:gap-x-16"
  >
    <h2 id="results-heading" class="sr-only">Results</h2>
    <div class="lg:col-span-2">
      <p class="text-xs/4 text-ink-muted">In focus · {{ view.focus.label }}</p>
      <p
        data-testid="focus-ratio"
        class="mt-2 text-7xl leading-none font-light tracking-tighter whitespace-nowrap md:text-8xl lg:tall:text-9xl"
      >
        {{ view.focus.ratio
        }}<span
          class="text-3xl tracking-normal text-ink-muted md:text-4xl lg:tall:text-5xl"
          >:1</span
        >
      </p>
      <p data-testid="focus-verdict" class="mt-4 max-w-md text-sm/6 text-ink">
        {{ view.focus.verdict }}
      </p>
      <p
        data-testid="message"
        aria-live="polite"
        class="mt-2 min-h-12 text-sm/6 text-ink"
      >
        {{ view.message }}
      </p>
    </div>

    <div class="lg:col-span-3">
      <p data-testid="palette-verdict" class="text-sm/6 font-medium">
        {{ view.paletteVerdict }}
      </p>
      <table class="mt-4 w-full border-collapse text-left text-sm/6">
        <caption class="sr-only">
          Palette pairs at {{ view.options.level }}
        </caption>
        <thead>
          <tr class="text-xs/4 text-ink-muted">
            <th scope="col" class="pr-4 pb-2 font-normal">Pair</th>
            <th scope="col" class="hidden pr-4 pb-2 font-normal md:table-cell">
              Ratio
            </th>
            <th scope="col" class="hidden pr-4 pb-2 font-normal md:table-cell">
              Minimum
            </th>
            <th scope="col" class="pr-4 pb-2 font-normal">Result</th>
            <th scope="col" class="pb-2 font-normal">
              <span class="sr-only">Fix</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="pair in view.pairs"
            :key="pair.id"
            :data-testid="`pair-${pair.id}`"
            class="h-12 border-t border-hairline lg:h-10"
          >
            <td class="pr-4">
              <button
                type="button"
                :data-pair-button="pair.id"
                :aria-pressed="pair.focused ? 'true' : 'false'"
                :class="`block w-full cursor-pointer text-left ${
                  pair.focused ? 'font-medium underline underline-offset-4' : ''
                }`"
                @click="emit('dispatch', { type: 'focus', pair: pair.id })"
              >
                {{ pair.label
                }}<span
                  class="block text-xs/4 font-normal text-ink-muted no-underline md:hidden"
                  >{{ pair.meta }}</span
                >
              </button>
            </td>
            <td class="hidden pr-4 md:table-cell">{{ pair.ratio }}</td>
            <td class="hidden pr-4 md:table-cell">{{ pair.minimum }}</td>
            <td class="pr-4">
              <span class="flex items-center gap-2 font-medium">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  class="size-4 shrink-0"
                >
                  <path v-if="pair.pass" d="m3 8.5 3.5 3.5L13 4.5" />
                  <path v-else d="m4 4 8 8M12 4l-8 8" />
                </svg>
                {{ pair.pass ? "Pass" : "Fail" }}
              </span>
            </td>
            <td class="text-right">
              <button
                v-if="!pair.pass"
                type="button"
                :data-fix="pair.id"
                :aria-label="pair.fixLabel"
                :class="FILLED_BUTTON"
                @click="emit('dispatch', { type: 'fix', pair: pair.id })"
              >
                Fix
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
  <p
    data-testid="live-summary"
    aria-live="polite"
    aria-atomic="true"
    class="sr-only"
  >
    {{ view.liveSummary }}
  </p>
</template>
