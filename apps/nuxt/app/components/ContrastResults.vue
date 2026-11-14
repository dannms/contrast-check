<script setup lang="ts">
import { type Evaluation, formatRatio, summarize } from "@contrast-check/core";

/** The ratio as the focal point, a one-sentence live summary and the criteria table. */
const props = defineProps<{
  evaluation: Evaluation | null;
}>();

const ratioValue = computed(() =>
  props.evaluation ? (formatRatio(props.evaluation.ratio).split(":")[0] ?? "") : "",
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
    class="mt-results-top flex flex-col gap-12 border-t border-hairline pt-rule md:flex-row md:flex-wrap md:gap-x-16"
  >
    <h2 id="results-heading" class="sr-only">Results</h2>
    <div class="flex flex-col gap-4 md:shrink md:grow md:basis-ratio">
      <template v-if="evaluation">
        <p class="text-label text-ink-muted">Contrast ratio</p>
        <p data-testid="ratio" class="whitespace-nowrap text-ratio">{{ ratioValue }}<span class="text-ratio-unit tracking-normal text-ink-muted">:1</span></p>
      </template>
      <p
        data-testid="live-summary"
        aria-live="polite"
        aria-atomic="true"
        class="max-w-summary text-ui text-ink-muted"
      >
        {{ summary }}
      </p>
    </div>
    <div v-if="evaluation" class="md:shrink md:grow md:basis-criteria">
      <table class="w-full border-collapse text-left text-ui">
        <caption class="sr-only">WCAG 2.2 contrast criteria</caption>
        <thead>
          <tr class="text-label text-ink-muted">
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
            <th scope="row" class="py-row pr-4 font-normal">{{ c.label }}</th>
            <td class="py-row pr-4">{{ c.threshold }}:1</td>
            <td class="py-row">
              <StatusBadge :pass="c.pass" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
