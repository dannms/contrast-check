<script setup lang="ts">
import {
  initialViewState,
  type Palette,
  type PaletteOptions,
  paletteView,
  reduce,
  type ViewAction,
} from "@contrast-check/core";

const props = defineProps<{ palette: Palette; options: PaletteOptions }>();

// One state: the core reduces it and the view is derived from it.
const state = shallowRef(initialViewState(props.palette, props.options));
const view = computed(() => paletteView(state.value));

// After a fix the button disappears: the focus goes to the pair button instead.
async function dispatch(action: ViewAction) {
  state.value = reduce(state.value, action);
  if (action.type !== "fix") return;
  await nextTick();
  if (document.querySelector(`[data-fix="${action.pair}"]`)) return;
  document
    .querySelector<HTMLElement>(`[data-pair-button="${action.pair}"]`)
    ?.focus();
}

// The result shows on the button and goes back to idle after two seconds.
let copyTimer: ReturnType<typeof setTimeout> | undefined;
onBeforeUnmount(() => clearTimeout(copyTimer));

async function copy() {
  clearTimeout(copyTimer);
  const ok = await copyText(
    view.value.exportText,
    document.getElementById("export-code"),
  );
  dispatch({ type: "copied", ok });
  copyTimer = setTimeout(() => dispatch({ type: "copyReset" }), 2000);
}

// Tells the tests (and anything else) that the handlers are attached.
const hydrated = ref(false);

const rootStyle = computed(() => ({
  ...view.value.cssVars,
  colorScheme: view.value.colorScheme,
}));

onMounted(() => {
  hydrated.value = true;

  // Mirror the theme on <html> so overscroll shows the surface color.
  watch(
    view,
    (next) => {
      const root = document.documentElement;
      for (const [name, value] of Object.entries(next.cssVars)) {
        root.style.setProperty(name, value);
      }
      root.style.backgroundColor = next.cssVars["--cc-surface"] ?? "";
      root.style.colorScheme = next.colorScheme;
    },
    { immediate: true },
  );

  // Keep the address bar in sync so the current state can be shared.
  watch(
    () => view.value.query,
    (query) => {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${query}`,
      );
    },
    { immediate: true },
  );
});
</script>

<template>
  <div
    data-testid="app-root"
    :data-hydrated="hydrated ? 'true' : 'false'"
    :style="rootStyle"
    class="min-h-dvh bg-surface text-ink"
  >
    <div
      class="mx-auto flex w-full max-w-7xl flex-col px-4 pt-6 pb-12 md:px-8 md:pt-8 lg:px-12"
    >
      <main>
        <header class="flex items-baseline justify-between">
          <h1 class="text-sm/6 font-medium">Contrast Check</h1>
          <p class="text-xs/4 text-ink-muted">WCAG 2.2</p>
        </header>

        <PaletteFields :fields="view.fields" @dispatch="dispatch" />
        <PaletteActions :options="view.options" @dispatch="dispatch" />
        <PairResults :view="view" @dispatch="dispatch" />
        <ScaleStrips :scales="view.scales" @dispatch="dispatch" />

        <div class="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-16">
          <PalettePreview :preview="view.preview" />
          <ThemeExport
            :export-text="view.exportText"
            :copy="view.copy"
            @copy="copy"
          />
        </div>
      </main>

      <footer class="mt-16 flex flex-wrap gap-x-2 text-xs/4 text-ink-muted">
        <span>Contrast Check</span>
        <span aria-hidden="true">·</span>
        <a
          href="https://contrast-check-next.vercel.app"
          class="underline underline-offset-4"
          >Next.js</a
        >
        <span aria-hidden="true">·</span>
        <a
          href="https://contrast-check-nuxt.vercel.app"
          class="underline underline-offset-4"
          >Nuxt</a
        >
        <span aria-hidden="true">·</span>
        <a
          href="https://github.com/dannms/contrast-check"
          class="underline underline-offset-4"
          >GitHub</a
        >
      </footer>
    </div>
  </div>
</template>
