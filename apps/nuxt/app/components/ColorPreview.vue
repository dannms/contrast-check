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
    class="mt-12 border-t border-hairline pt-8 md:mt-16"
  >
    <div class="flex flex-wrap items-baseline gap-x-4">
      <h2 id="preview-heading" class="text-xs/4 text-ink-muted">Preview</h2>
      <span class="text-xs/4 text-ink-muted">your text color, unaltered</span>
    </div>
    <div
      data-testid="specimen"
      class="mt-6 flex flex-col gap-4"
      :style="{ color: fg }"
    >
      <p class="text-4xl/10 font-light tracking-tight md:text-5xl/12">
        Pack my box with five dozen liquor jugs.
      </p>
      <p class="text-2xl/8 font-medium">
        Large text, 24px. Pack my box with five dozen liquor jugs.
      </p>
      <p class="max-w-prose text-base/6">
        Normal text, 16px. The quick brown fox jumps over the lazy dog.
      </p>
    </div>
  </section>
</template>
