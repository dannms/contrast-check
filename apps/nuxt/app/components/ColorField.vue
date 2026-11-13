<script setup lang="ts">
import { parseHex, toHex } from "@contrast-check/core";

const props = defineProps<{
  id: string;
  label: string;
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
  <div class="flex flex-col gap-tight">
    <label :for="id" class="font-semibold">
      {{ label }}
    </label>
    <div class="flex items-center gap-tight">
      <input
        :id="id"
        v-model="model"
        type="text"
        :aria-invalid="invalid ? 'true' : 'false'"
        :aria-describedby="invalid ? `${hintId} ${errorId}` : hintId"
        autocomplete="off"
        spellcheck="false"
        maxlength="7"
        class="h-11 w-full min-w-0 rounded-control border border-edge bg-page px-3 font-mono text-ink aria-[invalid=true]:border-fail aria-[invalid=true]:border-2"
      />
      <input
        type="color"
        :aria-label="`${label} color picker`"
        :value="pickerValue"
        class="h-11 w-14 shrink-0 cursor-pointer rounded-control border border-edge bg-page p-1"
        @input="onPick"
      />
    </div>
    <p :id="hintId" class="text-sm text-muted">Hex, like #1A2B3C or #ABC</p>
    <p v-if="invalid" :id="errorId" class="text-sm font-semibold text-fail">
      Enter a valid hex color, such as #1A2B3C or #ABC.
    </p>
  </div>
</template>
