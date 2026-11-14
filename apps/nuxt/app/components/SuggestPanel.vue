<script setup lang="ts">
import type { SuggestionTarget } from "@contrast-check/core";

defineProps<{
  disabled: boolean;
  message: string;
}>();

const emit = defineEmits<{
  suggest: [];
}>();

const target = defineModel<SuggestionTarget>("target", { required: true });
</script>

<template>
  <!-- From lg this section spans the two columns and five rows of the Actions grid
       and inherits them with subgrid, so the label and the select sit in column
       2, Suggest spans both columns and the DOM order stays Swap, select, Suggest. -->
  <section
    aria-labelledby="suggest-heading"
    class="flex flex-col gap-2 lg:col-span-2 lg:col-start-1 lg:row-span-5 lg:row-start-1 lg:grid lg:grid-cols-subgrid lg:grid-rows-subgrid"
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
        <select
          id="target"
          v-model="target"
          class="mt-2 h-12 w-full rounded-xs border border-line bg-transparent px-4 text-sm/6 text-ink md:w-auto lg:mt-0 lg:h-10 lg:w-full"
        >
          <option value="AA">AA normal text (4.5:1)</option>
          <option value="AAA">AAA normal text (7:1)</option>
        </select>
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
    <p class="text-xs/4 text-ink-muted lg:col-span-2 lg:row-start-4">
      Changes only the lightness of your text color.
    </p>
    <p
      aria-live="polite"
      class="min-h-4 text-xs/4 text-ink-muted lg:col-span-2 lg:row-start-5"
    >
      {{ message }}
    </p>
  </section>
</template>
