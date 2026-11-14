<script setup lang="ts">
import type { PaletteView, ViewAction } from "@contrast-check/core";

type Scale = PaletteView["scales"][number];

defineProps<{ scales: PaletteView["scales"] }>();
const emit = defineEmits<{ dispatch: [action: ViewAction] }>();

const buttons = new Map<string, HTMLButtonElement>();

function setButton(role: string, index: number, el: unknown) {
  const key = `${role}-${index}`;
  if (el instanceof HTMLButtonElement) buttons.set(key, el);
  else buttons.delete(key);
}

function onKeyDown(event: KeyboardEvent, scale: Scale) {
  const items = scale.steps;
  const current = Number((event.target as HTMLElement).dataset.index);
  if (Number.isNaN(current)) return;
  let next = current;
  if (event.key === "ArrowRight" || event.key === "ArrowDown")
    next = (current + 1) % items.length;
  else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
    next = (current - 1 + items.length) % items.length;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = items.length - 1;
  else return;
  event.preventDefault();
  const step = items[next];
  if (!step) return;
  emit("dispatch", { type: "step", role: scale.role, hex: step.hex });
  buttons.get(`${scale.role}-${next}`)?.focus();
}
</script>

<template>
  <section class="mt-10 border-t border-hairline pt-8">
    <p class="text-xs/4 text-ink-muted">
      Scales · 11 steps from each seed, in OKLCH
    </p>
    <div class="mt-6 grid gap-y-6">
      <div
        v-for="scale in scales"
        :key="scale.role"
        class="lg:grid lg:grid-cols-scale lg:gap-x-6"
      >
        <p aria-hidden="true" class="text-xs/4 text-ink-muted">
          {{ scale.label }}
        </p>
        <div
          role="radiogroup"
          :aria-label="scale.label"
          class="mt-2 grid grid-cols-6 gap-x-1 gap-y-2 md:grid-cols-11 md:gap-1 lg:mt-0"
          @keydown="onKeyDown($event, scale)"
        >
          <!-- biome-ignore lint/a11y/useSemanticElements: a radio group of colored swatches, not form radios -->
          <button
            v-for="(step, index) in scale.steps"
            :key="step.name"
            :ref="(el) => setButton(scale.role, index, el)"
            type="button"
            role="radio"
            :aria-checked="step.checked ? 'true' : 'false'"
            :aria-label="step.ariaLabel"
            :tabindex="step.tabbable ? 0 : -1"
            :data-index="index"
            class="group block min-w-0 cursor-pointer text-left"
            @click="
              emit('dispatch', { type: 'step', role: scale.role, hex: step.hex })
            "
          >
            <span
              aria-hidden="true"
              :style="{ backgroundColor: step.hex, borderColor: step.hex }"
              class="block h-12 rounded-xs border group-aria-checked:outline-2 group-aria-checked:outline-offset-2 group-aria-checked:outline-ink"
            />
            <span
              aria-hidden="true"
              class="mt-2 block text-xs/4 group-aria-checked:font-medium"
              >{{ step.name }}</span
            >
            <span
              aria-hidden="true"
              class="flex flex-wrap items-center gap-x-1 text-xs/4 text-ink-muted"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                class="size-3 shrink-0"
              >
                <path
                  v-if="step.use === 'text-aaa' || step.use === 'text-aa'"
                  d="m2 6.5 2.5 2.5L10 3.5"
                />
                <rect
                  v-else-if="step.use === 'large-ui'"
                  x="2.5"
                  y="2.5"
                  width="7"
                  height="7"
                />
                <path v-else d="M2.5 6h7" />
              </svg>
              {{ step.useLabel }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
