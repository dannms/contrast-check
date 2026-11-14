<script lang="ts">
export type SuggestionMessage = {
  kind: "applied" | "met" | "impossible";
  text: string;
};
</script>

<script setup lang="ts">
import type { SuggestionTarget } from "@contrast-check/core";

defineProps<{
  disabled: boolean;
  message: SuggestionMessage | null;
}>();

const emit = defineEmits<{
  suggest: [];
}>();

const target = defineModel<SuggestionTarget>("target", { required: true });
</script>

<template>
  <!-- From lg this section spans the two columns and four rows of the Actions grid
       and inherits them with subgrid, so the label and the select sit in column
       2, Suggest spans both columns and the DOM order stays Swap, select, Suggest. -->
  <section
    aria-labelledby="suggest-heading"
    class="flex flex-col gap-2 lg:col-span-2 lg:col-start-1 lg:row-span-4 lg:row-start-1 lg:grid lg:grid-cols-subgrid lg:grid-rows-subgrid"
  >
    <h2 id="suggest-heading" class="sr-only">Suggestion</h2>
    <div
      class="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-end lg:col-span-2 lg:row-span-3 lg:row-start-1 lg:grid lg:grid-cols-subgrid lg:grid-rows-subgrid lg:items-start"
    >
      <div
        class="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:grid lg:grid-rows-subgrid"
      >
        <label for="target" class="block text-xs/4 text-ink-muted"
          >Target level</label
        >
        <div class="relative mt-2 lg:mt-0">
          <select
            id="target"
            v-model="target"
            class="block h-12 w-full appearance-none rounded-xs border border-line bg-transparent pr-10 pl-4 text-sm/6 text-ink forced-colors:appearance-auto md:w-auto lg:h-10 lg:w-full"
          >
            <option value="AA">AA normal text (4.5:1)</option>
            <option value="AAA">AAA normal text (7:1)</option>
          </select>
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 16 16"
            class="pointer-events-none absolute inset-y-0 right-4 my-auto size-4 forced-colors:hidden"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </div>
      </div>
      <button
        type="button"
        :disabled="disabled"
        class="h-12 w-full cursor-pointer rounded-xs bg-ink px-4 text-sm/6 text-surface transition-transform duration-150 ease-press active:scale-97 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100 md:w-auto lg:col-span-2 lg:row-start-3 lg:h-10 lg:w-full"
        @click="emit('suggest')"
      >
        Suggest accessible text color
      </button>
    </div>
    <div class="lg:col-span-2 lg:row-start-4">
      <div aria-live="polite">
        <p v-if="message" class="mb-2 flex gap-2 text-sm/6 text-ink">
          <span class="flex h-6 shrink-0 items-center">
            <!-- Check, information circle or warning triangle, one per message state. -->
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 20 20"
              class="size-4"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path v-if="message.kind === 'applied'" d="M4 10.5l4 4 8-9" />
              <template v-else-if="message.kind === 'met'">
                <circle cx="10" cy="10" r="8" />
                <path d="M10 9v5M10 6h.01" />
              </template>
              <template v-else>
                <path d="M10 3L2 17h16L10 3z" />
                <path d="M10 8v4M10 14.5h.01" />
              </template>
            </svg>
          </span>
          {{ message.text }}
        </p>
      </div>
      <p class="text-xs/4 text-ink-muted">
        Changes only the lightness of your text color.
      </p>
    </div>
  </section>
</template>
