<script setup lang="ts">
import type { Level, PaletteView, ViewAction } from "@contrast-check/core";

defineProps<{ options: PaletteView["options"] }>();
const emit = defineEmits<{ dispatch: [action: ViewAction] }>();
</script>

<template>
  <div
    class="mt-6 flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-x-6 md:gap-y-2"
  >
    <button
      type="button"
      :class="`${OUTLINE_BUTTON} w-full md:w-auto`"
      @click="emit('dispatch', { type: 'swap' })"
    >
      Swap text and background
    </button>

    <div class="flex items-center gap-2">
      <label for="level" class="text-xs/4 text-ink-muted">Level</label>
      <div class="relative flex-1 md:w-32 md:flex-none">
        <select
          id="level"
          class="cc-outline h-12 w-full cursor-pointer appearance-none rounded-xs border border-line bg-transparent pr-10 pl-4 text-sm/6 text-ink forced-colors:appearance-auto lg:h-10"
          @change="
            emit('dispatch', {
              type: 'level',
              level: ($event.target as HTMLSelectElement).value as Level,
            })
          "
        >
          <option value="AA" :selected="options.level === 'AA'">AA</option>
          <option value="AAA" :selected="options.level === 'AAA'">AAA</option>
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 forced-colors:hidden"
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </div>
    </div>

    <button
      type="button"
      role="switch"
      :aria-checked="options.accentAsText ? 'true' : 'false'"
      class="group flex h-12 cursor-pointer items-center gap-2 text-sm/6 text-ink lg:h-10"
      @click="
        emit('dispatch', { type: 'accentAsText', on: !options.accentAsText })
      "
    >
      <span
        aria-hidden="true"
        class="relative h-4 w-8 shrink-0 rounded-full border border-line group-aria-checked:border-ink group-aria-checked:bg-ink"
      >
        <span
          class="absolute top-px left-0 size-3 rounded-full bg-ink transition-transform duration-150 ease-press group-aria-checked:translate-x-4 group-aria-checked:bg-surface motion-reduce:transition-none"
        />
      </span>
      Accent as text
    </button>
  </div>
</template>
