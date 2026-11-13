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
  <section aria-labelledby="suggest-heading" class="flex flex-col gap-gutter">
    <h2 id="suggest-heading" class="text-xl font-semibold">Suggestion</h2>
    <p class="text-muted">
      Keeps the hue and saturation of the text color and adjusts only its
      lightness until the target is met.
    </p>
    <div class="flex flex-wrap items-end gap-gutter">
      <div class="flex flex-col gap-tight">
        <label for="target" class="font-semibold">Target level</label>
        <select
          id="target"
          v-model="target"
          class="h-11 rounded-control border border-edge bg-page px-3 text-ink"
        >
          <option value="AA">AA normal text (4.5:1)</option>
          <option value="AAA">AAA normal text (7:1)</option>
        </select>
      </div>
      <button
        type="button"
        :disabled="disabled"
        class="h-11 cursor-pointer rounded-control bg-accent px-gutter font-semibold text-on-accent disabled:cursor-not-allowed disabled:opacity-60"
        @click="emit('suggest')"
      >
        Suggest accessible text color
      </button>
    </div>
    <p aria-live="polite" class="min-h-6">{{ message }}</p>
  </section>
</template>
