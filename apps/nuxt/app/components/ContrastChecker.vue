<script setup lang="ts">
import {
  buildQuery,
  evaluate,
  formatRatio,
  parseHex,
  type SuggestionTarget,
  suggestTextColor,
  toHex,
} from "@contrast-check/core";

const props = defineProps<{
  initialFg: string;
  initialBg: string;
}>();

const fgText = ref(props.initialFg);
const bgText = ref(props.initialBg);
const target = ref<SuggestionTarget>("AA");
const message = ref("");

const fg = computed(() => parseHex(fgText.value));
const bg = computed(() => parseHex(bgText.value));
const evaluation = computed(() =>
  fg.value && bg.value ? evaluate(fg.value, bg.value) : null,
);

// Keep the address bar in sync so the current state can be shared.
onMounted(() => {
  watch(
    [fgText, bgText],
    ([fgValue, bgValue]) => {
      const query = buildQuery(fgValue, bgValue);
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${query}`,
      );
    },
    { immediate: true },
  );
});

function changeFg(value: string) {
  fgText.value = value;
  message.value = "";
}

function changeBg(value: string) {
  bgText.value = value;
  message.value = "";
}

function changeTarget(value: SuggestionTarget) {
  target.value = value;
  message.value = "";
}

function swap() {
  [fgText.value, bgText.value] = [bgText.value, fgText.value];
  message.value = "";
}

function suggest() {
  if (!fg.value || !bg.value) return;
  const suggestion = suggestTextColor(fg.value, bg.value, target.value);
  if (!suggestion) {
    message.value = `No text color with this hue and saturation can reach ${target.value} on this background. Try a different background.`;
    return;
  }
  if (suggestion.hex === fgText.value.toUpperCase()) {
    message.value = `The text color already meets ${target.value}.`;
    return;
  }
  fgText.value = suggestion.hex;
  message.value = `Text color set to ${suggestion.hex}, ${formatRatio(suggestion.ratio)}, meeting ${target.value}.`;
}
</script>

<template>
  <main
    class="mx-auto flex w-full max-w-3xl flex-col gap-section px-gutter py-section"
  >
    <header class="flex flex-col gap-tight">
      <h1 class="text-3xl font-bold">Contrast Check</h1>
      <p class="text-muted">
        Check text and background colors against WCAG 2.2 contrast criteria.
      </p>
    </header>

    <fieldset class="flex flex-col gap-gutter border-0 p-0">
      <legend class="mb-gutter text-xl font-semibold">Colors</legend>
      <div class="grid gap-stack sm:grid-cols-2">
        <ColorField
          id="fg"
          label="Text"
          :model-value="fgText"
          @update:model-value="changeFg"
        />
        <ColorField
          id="bg"
          label="Background"
          :model-value="bgText"
          @update:model-value="changeBg"
        />
      </div>
      <div>
        <button
          type="button"
          class="h-11 cursor-pointer rounded-control border border-edge bg-page px-gutter font-semibold text-ink"
          @click="swap"
        >
          Swap colors
        </button>
      </div>
    </fieldset>

    <ColorPreview v-if="fg && bg" :fg="toHex(fg)" :bg="toHex(bg)" />
    <ContrastResults :evaluation="evaluation" />
    <SuggestPanel
      :target="target"
      :disabled="!evaluation"
      :message="message"
      @update:target="changeTarget"
      @suggest="suggest"
    />
  </main>
</template>
