<script setup lang="ts">
/** Specimen in the raw text color, directly on the surface. It is what is being tested. */
defineProps<{
  /** The chosen text color, shown unaltered. */
  fg: string;
}>();
</script>

<template>
  <section
    aria-labelledby="preview-heading"
    class="mt-preview-top flex flex-col gap-6 border-t border-hairline pt-rule"
  >
    <div class="flex flex-wrap items-baseline gap-x-4">
      <h2 id="preview-heading" class="text-label text-ink-muted">Preview</h2>
      <span class="text-label text-ink-muted">your text color, unaltered</span>
    </div>
    <div
      data-testid="specimen"
      class="flex flex-col gap-4"
      :style="{ color: fg }"
    >
      <p class="text-spec-lg">Pack my box with five dozen liquor jugs.</p>
      <p class="text-spec-md">
        Large text, 24px. Pack my box with five dozen liquor jugs.
      </p>
      <p class="max-w-prose text-spec-body">
        Normal text, 16px. The quick brown fox jumps over the lazy dog.
      </p>
    </div>
  </section>
</template>
