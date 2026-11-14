<script setup lang="ts">
import type { PaletteView } from "@contrast-check/core";

const props = defineProps<{ preview: PaletteView["preview"] }>();

const DASHED = "outline-2 outline-dashed outline-offset-4 outline-ink";
const on = (part: PaletteView["preview"]["highlight"]) =>
  props.preview.highlight === part ? DASHED : "";
</script>

<template>
  <section class="mt-10 border-t border-hairline pt-8 lg:mt-10">
    <p class="text-xs/4 text-ink-muted">Preview · your colors, unaltered</p>
    <div
      data-testid="preview"
      :style="{ color: preview.text }"
      class="mt-6 flex flex-col gap-6"
    >
      <div :class="`flex flex-col gap-6 ${on('copy')}`">
        <p class="text-4xl/10 font-light tracking-tight">
          Notification settings
        </p>
        <p class="max-w-prose text-base/6">
          Choose how and when you hear from us. You can change these at any
          time.
        </p>
      </div>

      <div
        :style="{
          backgroundColor: preview.secondary,
          color: preview.secondaryLabel,
        }"
        :class="`max-w-xl rounded-xs p-6 ${on('panel')}`"
      >
        <p class="text-base/6 font-medium">Email updates</p>
        <div class="mt-4 flex flex-col gap-2 md:flex-row md:items-center">
          <span class="text-base/6 md:w-40">Send to</span>
          <span
            class="flex h-10 flex-1 items-center rounded-xs border border-current px-3 text-base/6"
            >name@example.com</span
          >
        </div>
        <div class="mt-4 flex flex-col gap-2 md:flex-row md:items-center">
          <span class="text-base/6 md:w-40">How often</span>
          <span
            class="flex h-10 flex-1 items-center rounded-xs border border-current px-3 text-base/6"
            >Weekly digest</span
          >
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-4">
        <span
          :style="{
            backgroundColor: preview.primary,
            color: preview.primaryLabel,
          }"
          :class="`inline-flex h-10 items-center rounded-xs px-4 text-base/6 ${on('save')}`"
          >Save changes</span
        >
        <span
          :style="{ borderColor: preview.text }"
          class="inline-flex h-10 items-center rounded-xs border px-4 text-base/6"
          >Cancel</span
        >
      </div>

      <div class="flex flex-wrap items-center gap-4">
        <span
          :style="{ borderColor: preview.accent, color: preview.accent }"
          :class="`inline-flex h-8 items-center rounded-xs border px-3 text-sm/6 ${on('chip')}`"
          >New</span
        >
        <span
          :style="{ color: preview.accent }"
          :class="`text-base/6 underline underline-offset-4 ${on('link')}`"
          >Read what changed</span
        >
      </div>
    </div>
  </section>
</template>
