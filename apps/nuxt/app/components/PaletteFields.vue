<script setup lang="ts">
import type { PaletteView, ViewAction } from "@contrast-check/core";

defineProps<{ fields: PaletteView["fields"] }>();
const emit = defineEmits<{ dispatch: [action: ViewAction] }>();

// Stacked with hairlines up to lg; from lg the columns are separated by a divider
// centered in the gap, so both sides have equal space.
const firstGroup = "pb-4 lg:pb-0";
const nextGroup =
  "relative border-t border-hairline py-4 lg:border-t-0 lg:py-0 lg:before:absolute lg:before:inset-y-0 lg:before:-left-4 lg:before:border-l lg:before:border-hairline";
</script>

<template>
  <fieldset
    class="m-0 mt-8 grid min-w-0 border-0 p-0 md:mt-10 lg:grid-cols-5 lg:gap-x-8"
  >
    <legend class="sr-only">Palette</legend>
    <div
      v-for="(f, index) in fields"
      :key="f.role"
      :class="index === 0 ? firstGroup : nextGroup"
    >
      <label :for="f.id" class="block text-xs/4 text-ink-muted">{{
        f.label
      }}</label>
      <div class="mt-2 flex items-center gap-4">
        <input
          :id="f.id"
          type="text"
          :value="f.draft"
          :aria-invalid="f.invalid ? 'true' : 'false'"
          :aria-describedby="`${f.id}-hint ${f.id}-error`"
          autocomplete="off"
          spellcheck="false"
          size="7"
          maxlength="7"
          class="min-w-0 flex-1 rounded-none border-0 border-b border-line bg-transparent p-0 pb-2 text-4xl leading-none font-light text-ink aria-[invalid=true]:border-ink lg:text-3xl"
          @input="
            emit('dispatch', {
              type: 'draft',
              role: f.role,
              text: ($event.target as HTMLInputElement).value,
            })
          "
        />
        <input
          type="color"
          :aria-label="`${f.label} color picker`"
          :value="f.pickerHex"
          class="cc-swatch size-12 shrink-0 cursor-pointer appearance-none overflow-hidden rounded-full border border-line bg-transparent p-0 lg:size-10"
          @input="
            emit('dispatch', {
              type: 'pick',
              role: f.role,
              hex: ($event.target as HTMLInputElement).value.toUpperCase(),
            })
          "
        />
      </div>
      <p :id="`${f.id}-hint`" class="sr-only">Hex, like #1A2B3C or #ABC</p>
      <p
        :id="`${f.id}-error`"
        class="mt-2 min-h-4 text-xs/4 font-medium text-ink"
      >
        {{ f.error }}
      </p>
    </div>
  </fieldset>
</template>
