<script setup lang="ts">
import { parseHex, toHex } from "@contrast-check/core";

/** Hex text input kept in sync with a native color picker shown as a circle. */
const props = defineProps<{
  id: string;
  label: string;
  /** Plays the short tint flash on the input (after a suggestion is applied). */
  flashing?: boolean;
}>();

const model = defineModel<string>({ required: true });

const rgb = computed(() => parseHex(model.value));
const invalid = computed(() => rgb.value === null);
const hintId = computed(() => `${props.id}-hint`);
const errorId = computed(() => `${props.id}-error`);
const pickerValue = computed(() =>
  rgb.value ? toHex(rgb.value).toLowerCase() : "#000000",
);

function onPick(event: Event) {
  model.value = (event.target as HTMLInputElement).value.toUpperCase();
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <label :for="id" class="text-label text-ink-muted">{{ label }}</label>
    <div class="flex items-center justify-between gap-4 md:justify-start">
      <input
        :id="id"
        v-model="model"
        type="text"
        :aria-invalid="invalid ? 'true' : 'false'"
        :aria-describedby="invalid ? `${hintId} ${errorId}` : hintId"
        autocomplete="off"
        spellcheck="false"
        maxlength="7"
        class="w-hex min-w-0 rounded-none border-0 border-b border-line bg-transparent p-0 pb-1.5 text-input text-ink aria-[invalid=true]:border-ink"
        :class="{ 'cc-flash': flashing }"
      />
      <input
        type="color"
        :aria-label="`${label} color picker`"
        :value="pickerValue"
        class="cc-swatch shrink-0"
        @input="onPick"
      />
    </div>
    <p :id="hintId" class="sr-only">Hex, like #1A2B3C or #ABC</p>
    <p v-if="invalid" :id="errorId" class="text-label font-medium text-ink">
      Enter a valid hex color, such as #1A2B3C or #ABC.
    </p>
  </div>
</template>
