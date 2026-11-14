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
  <section aria-labelledby="suggest-heading" class="flex flex-col gap-2">
    <h2 id="suggest-heading" class="sr-only">Suggestion</h2>
    <div class="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-end">
      <div class="flex flex-col gap-2">
        <label for="target" class="text-label text-ink-muted">Target level</label>
        <select
          id="target"
          v-model="target"
          class="h-control w-full rounded-control border border-line bg-transparent px-4 text-ui text-ink md:w-auto"
        >
          <option value="AA">AA normal text (4.5:1)</option>
          <option value="AAA">AAA normal text (7:1)</option>
        </select>
      </div>
      <button
        type="button"
        :disabled="disabled"
        class="cc-press h-control w-full cursor-pointer rounded-control bg-ink px-4 text-ui text-surface disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
        @click="emit('suggest')"
      >
        Suggest accessible text color
      </button>
    </div>
    <p class="text-label text-ink-muted">
      Changes only the lightness of your text color.
    </p>
    <p aria-live="polite" class="min-h-6 text-label text-ink-muted">
      {{ message }}
    </p>
  </section>
</template>
