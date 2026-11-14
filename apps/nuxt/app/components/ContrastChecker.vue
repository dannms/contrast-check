<script setup lang="ts">
import {
  buildQuery,
  deriveTheme,
  evaluate,
  formatRatio,
  parseHex,
  type Rgb,
  relativeLuminance,
  type SuggestionTarget,
  suggestTextColor,
  themeToCssVars,
  toHex,
} from "@contrast-check/core";

const props = defineProps<{
  initialFg: string;
  initialBg: string;
}>();

// Surfaces darker than this get native controls in their dark variant.
const DARK_SURFACE_LUMINANCE = 0.18;
// Same duration as --duration-flash in the shared tokens.
const FLASH_MS = 200;

const BLACK: Rgb = { r: 0, g: 0, b: 0 };

// Groups of the top row: stacked with hairlines on mobile, columns from 768px.
const firstGroup = "pb-6 md:pb-0";
const nextGroup =
  "border-t border-hairline py-6 md:border-t-0 md:border-l md:py-0 md:pl-8";
const lastGroup =
  "border-t border-hairline pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-8";

const fgText = ref(props.initialFg);
const bgText = ref(props.initialBg);
const target = ref<SuggestionTarget>("AA");
const message = ref("");
const flashing = ref(false);
const lastFg = ref(props.initialFg);
const lastBg = ref(props.initialBg);

const fg = computed(() => parseHex(fgText.value));
const bg = computed(() => parseHex(bgText.value));
const evaluation = computed(() =>
  fg.value && bg.value ? evaluate(fg.value, bg.value) : null,
);

// The theme keeps the last valid color of each field while typing.
watch(fg, (value) => {
  if (value) lastFg.value = toHex(value);
});
watch(bg, (value) => {
  if (value) lastBg.value = toHex(value);
});
const themeFg = computed(() => (fg.value ? toHex(fg.value) : lastFg.value));
const themeBg = computed(() => (bg.value ? toHex(bg.value) : lastBg.value));

const theme = computed(() =>
  deriveTheme(parseHex(themeFg.value) ?? BLACK, parseHex(themeBg.value) ?? BLACK),
);
const colorScheme = computed(() =>
  relativeLuminance(parseHex(theme.value.surface) ?? BLACK) <
  DARK_SURFACE_LUMINANCE
    ? "dark"
    : "light",
);
const rootStyle = computed(() => ({
  ...themeToCssVars(theme.value),
  colorScheme: colorScheme.value,
}));

onMounted(() => {
  // Mirror the theme on <html> so overscroll shows the surface color.
  watch(
    [theme, colorScheme],
    ([nextTheme, scheme]) => {
      const root = document.documentElement;
      for (const [name, value] of Object.entries(themeToCssVars(nextTheme))) {
        root.style.setProperty(name, value);
      }
      root.style.backgroundColor = nextTheme.surface;
      root.style.colorScheme = scheme;
    },
    { immediate: true },
  );

  // Keep the address bar in sync so the current state can be shared.
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

let flashTimer: ReturnType<typeof setTimeout> | undefined;

async function flash() {
  clearTimeout(flashTimer);
  flashing.value = false;
  await nextTick();
  flashing.value = true;
  flashTimer = setTimeout(() => {
    flashing.value = false;
  }, FLASH_MS);
}

onBeforeUnmount(() => clearTimeout(flashTimer));

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
  flash();
  message.value = `Text color set to ${suggestion.hex}, ${formatRatio(suggestion.ratio)}, meeting ${target.value}.`;
}
</script>

<template>
  <div
    data-testid="app-root"
    :style="rootStyle"
    class="min-h-dvh bg-surface text-ink"
  >
    <div
      class="mx-auto flex w-full max-w-6xl flex-col px-4 pt-6 pb-12 md:px-8 md:pt-8 lg:px-12"
    >
      <main>
        <header class="flex items-baseline justify-between">
          <h1 class="text-sm/6 font-medium">Contrast Check</h1>
          <p class="text-xs/4 text-ink-muted">WCAG 2.2</p>
        </header>

        <div class="mt-8 md:mt-10 md:grid md:grid-cols-3 md:items-start lg:grid-cols-5">
          <fieldset
            class="m-0 grid min-w-0 border-0 p-0 md:col-span-2 md:grid-cols-2 lg:col-span-3"
          >
            <legend class="sr-only">Colors</legend>
            <ColorField
              id="fg"
              label="Text"
              :model-value="fgText"
              :class="firstGroup"
              :flashing="flashing"
              @update:model-value="changeFg"
            />
            <ColorField
              id="bg"
              label="Background"
              :model-value="bgText"
              :class="nextGroup"
              @update:model-value="changeBg"
            />
          </fieldset>
          <div
            class="flex flex-col gap-2 lg:col-span-2 lg:grid lg:auto-cols-max"
            :class="lastGroup"
          >
            <p aria-hidden="true" class="text-xs/4 text-ink-muted lg:col-start-1 lg:row-start-1">
              Actions
            </p>
            <button
              type="button"
              class="cc-outline h-12 w-full cursor-pointer rounded-xs border border-line bg-transparent px-4 text-sm/6 text-ink transition-transform duration-150 ease-press active:scale-97 motion-reduce:transition-none motion-reduce:active:scale-100 md:w-auto md:self-start lg:relative lg:z-10 lg:col-start-1 lg:row-start-2 lg:h-10 lg:w-full lg:self-start"
              @click="swap"
            >
              Swap colors
            </button>
            <SuggestPanel
              :target="target"
              :disabled="!evaluation"
              :message="message"
              @update:target="changeTarget"
              @suggest="suggest"
            />
          </div>
        </div>

        <ContrastResults :evaluation="evaluation" />
        <ColorPreview v-if="fg && bg" :fg="toHex(fg)" />
      </main>

      <footer class="mt-16 flex flex-wrap gap-x-2 text-xs/4 text-ink-muted">
        <span>Contrast Check</span>
        <span aria-hidden="true">·</span>
        <a
          href="https://contrast-check-next.vercel.app"
          class="underline underline-offset-4"
        >
          Next.js
        </a>
        <span aria-hidden="true">·</span>
        <a
          href="https://contrast-check-nuxt.vercel.app"
          class="underline underline-offset-4"
        >
          Nuxt
        </a>
        <span aria-hidden="true">·</span>
        <a
          href="https://github.com/dannms/contrast-check"
          class="underline underline-offset-4"
        >
          GitHub
        </a>
      </footer>
    </div>
  </div>
</template>
