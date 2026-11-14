<script setup lang="ts">
import { type Evaluation, formatRatio, summarize } from "@contrast-check/core";

/** The ratio as the focal point, a one-sentence live summary and the criteria table. */
const props = defineProps<{
  evaluation: Evaluation | null;
}>();

const ratioValue = computed(() =>
  props.evaluation
    ? (formatRatio(props.evaluation.ratio).split(":")[0] ?? "")
    : "",
);

const summary = computed(() =>
  props.evaluation
    ? summarize(props.evaluation)
    : "Enter two valid hex colors to see the contrast ratio.",
);
</script>

<template>
  <section
    aria-labelledby="results-heading"
    class="mt-10 grid gap-y-8 border-t border-hairline pt-8 md:mt-12 md:grid-cols-2 md:gap-x-16"
  >
    <h2 id="results-heading" class="sr-only">Results</h2>
    <div>
      <template v-if="evaluation">
        <p class="text-xs/4 text-ink-muted">Contrast ratio</p>
        <p data-testid="ratio" class="mt-2 text-7xl leading-none font-light tracking-tighter whitespace-nowrap md:text-8xl lg:tall:text-9xl">{{ ratioValue }}<span class="text-3xl tracking-normal text-ink-muted md:text-4xl lg:tall:text-5xl">:1</span></p>
      </template>
      <p
        data-testid="live-summary"
        aria-live="polite"
        aria-atomic="true"
        class="mt-4 max-w-md text-sm/6 text-ink-muted"
      >
        {{ summary }}
      </p>
    </div>
    <div v-if="evaluation">
      <table class="w-full border-collapse text-left text-sm/6">
        <caption class="sr-only">WCAG 2.2 contrast criteria</caption>
        <thead>
          <tr class="text-xs/4 text-ink-muted">
            <th scope="col" class="pr-4 pb-2 font-normal">Criterion</th>
            <th scope="col" class="pr-4 pb-2 font-normal">Minimum</th>
            <th scope="col" class="pb-2 font-normal">Result</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="c in evaluation.criteria"
            :key="c.id"
            :data-testid="c.id"
            class="border-t border-hairline"
          >
            <th scope="row" class="py-2 pr-4 font-normal">{{ c.label }}</th>
            <td class="py-2 pr-4">{{ c.threshold }}:1</td>
            <td class="py-2">
              <StatusBadge :pass="c.pass" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
