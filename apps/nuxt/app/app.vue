<script setup lang="ts">
import { DEFAULT_BG, DEFAULT_FG, hexFromParam } from "@contrast-check/core";

// Read ?fg= and ?bg= on the server so the first paint already has the shared colors.
const { searchParams } = useRequestURL();
const initialFg =
  hexFromParam(searchParams.get("fg") ?? undefined) ?? DEFAULT_FG;
const initialBg =
  hexFromParam(searchParams.get("bg") ?? undefined) ?? DEFAULT_BG;
</script>

<template>
  <ContrastChecker :initial-fg="initialFg" :initial-bg="initialBg" />
</template>
