<script setup lang="ts">
import { parsePaletteQuery } from "@contrast-check/core";

// Read the palette on the server so the first paint already has the shared colors.
const { searchParams } = useRequestURL();
const { palette, options } = parsePaletteQuery(
  Object.fromEntries(searchParams.entries()),
);
</script>

<template>
  <PaletteApp :palette="palette" :options="options" />
</template>
