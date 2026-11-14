<script setup lang="ts">
/** Pass/Fail indicator: icon plus word, same ink for both, never color alone. */
defineProps<{ pass: boolean }>();
</script>

<template>
  <span class="inline-flex items-center gap-2 font-medium">
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      class="size-4"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <title>{{ pass ? "Pass" : "Fail" }}</title>
      <path v-if="pass" d="M4 10.5l4 4 8-9" />
      <path v-else d="M5 5l10 10M15 5L5 15" />
    </svg>
    {{ pass ? "Pass" : "Fail" }}
  </span>
</template>
