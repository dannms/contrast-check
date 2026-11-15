<script setup lang="ts">
import type { PaletteView } from "@contrast-check/core";

defineProps<{ exportText: string; copy: PaletteView["copy"] }>();
const emit = defineEmits<{ copy: [] }>();
</script>

<template>
  <section class="mt-10 border-t border-hairline pt-8">
    <div class="flex items-center justify-between gap-4">
      <p class="text-xs/4 text-ink-muted">Export · Tailwind CSS v4 theme</p>
      <!-- The icon shows what a click does, or what just happened. The swap is instant. -->
      <button
        type="button"
        aria-label="Copy theme"
        :data-state="copy.state"
        data-testid="copy-button"
        :class="ICON_BUTTON"
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
        <svg
          v-else-if="copy.state === 'failed'"
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="size-4 shrink-0"
        >
          <path d="M8 2.5 14 13H2L8 2.5Z" />
          <path d="M8 6.5v3M8 11.5h.01" />
        </svg>
        <svg
          v-else
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="size-4 shrink-0"
        >
          <rect x="5.5" y="5.5" width="8" height="8" rx="1" />
          <path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
        </svg>
      </button>
      <span
        data-testid="copy-announcement"
        aria-live="polite"
        class="sr-only"
        >{{ copy.announcement }}</span
      >
    </div>
    <section
      id="export-code"
      tabindex="0"
      aria-label="Tailwind theme"
      data-testid="export-code"
      class="mt-4 max-h-96 overflow-auto rounded-xs border border-line p-4 text-xs/4"
    >
      <pre><code>{{ exportText }}</code></pre>
    </section>
  </section>
</template>
