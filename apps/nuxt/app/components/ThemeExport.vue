<script setup lang="ts">
import type { PaletteView } from "@contrast-check/core";

defineProps<{ exportText: string; copy: PaletteView["copy"] }>();
const emit = defineEmits<{ copy: [] }>();
</script>

<template>
  <section class="mt-10 border-t border-hairline pt-8">
    <div class="flex items-center justify-between gap-4">
      <p class="text-xs/4 text-ink-muted">Export · Tailwind CSS v4 theme</p>
      <button
        type="button"
        data-testid="copy-button"
        :class="`${FILLED_BUTTON} inline-flex min-w-28 items-center justify-center gap-2`"
        @click="emit('copy')"
      >
        <svg
          v-if="copy.state === 'copied'"
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="size-4 shrink-0"
        >
          <path d="m3 8.5 3.5 3.5L13 4.5" />
        </svg>
        {{ copy.buttonLabel }}
      </button>
      <span
        data-testid="copy-announcement"
        aria-live="polite"
        class="sr-only"
        >{{ copy.announcement }}</span
      >
    </div>
    <p data-testid="copy-error" class="mt-2 min-h-4 text-xs/4 text-ink">
      {{ copy.error }}
    </p>
    <section
      tabindex="0"
      aria-label="Tailwind theme"
      data-testid="export-code"
      class="mt-4 max-h-96 overflow-auto rounded-xs border border-line p-4 text-xs/4"
    >
      <pre><code>{{ exportText }}</code></pre>
    </section>
  </section>
</template>
