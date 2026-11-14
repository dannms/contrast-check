<script setup lang="ts">
defineProps<{ exportText: string }>();
const emit = defineEmits<{ copy: [] }>();
</script>

<template>
  <section class="mt-10 border-t border-hairline pt-8">
    <div class="flex items-center justify-between gap-4">
      <p class="text-xs/4 text-ink-muted">Export · Tailwind CSS v4 theme</p>
      <button type="button" :class="FILLED_BUTTON" @click="emit('copy')">
        Copy
      </button>
    </div>
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
