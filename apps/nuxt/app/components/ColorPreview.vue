<script setup lang="ts">
/** Live sample of the chosen colors at normal (16px) and large (24px bold) sizes. */
defineProps<{
  fg: string;
  bg: string;
}>();
</script>

<template>
  <section aria-labelledby="preview-heading" class="flex flex-col gap-gutter">
    <h2 id="preview-heading" class="text-xl font-semibold">Preview</h2>
    <div
      class="flex flex-col gap-gutter rounded-control border border-edge p-stack"
      :style="{ color: fg, backgroundColor: bg }"
    >
      <p class="text-sample">
        Normal text, 16px. The quick brown fox jumps over the lazy dog.
      </p>
      <p class="text-sample-large font-bold">
        Large text, 24px bold. Pack my box with five dozen liquor jugs.
      </p>
    </div>
  </section>
</template>
