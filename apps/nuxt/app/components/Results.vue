<script setup lang="ts">
import { type Evaluation, formatRatio, summarize } from "@contrast-check/core";

/** Contrast ratio and per-criterion results, plus a concise live summary. */
const props = defineProps<{
  evaluation: Evaluation | null;
}>();

const summary = computed(() =>
  props.evaluation
    ? summarize(props.evaluation)
    : "Enter two valid hex colors to see the contrast ratio.",
);
</script>

<template>
  <section aria-labelledby="results-heading" class="flex flex-col gap-gutter">
    <h2 id="results-heading" class="text-xl font-semibold">Results</h2>
    <p
      data-testid="live-summary"
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
    >
      {{ summary }}
    </p>
    <div class="flex flex-col gap-gutter">
      <template v-if="evaluation">
        <p>
          <span class="block text-muted">Contrast ratio</span>
          <span
            data-testid="ratio"
            class="block font-mono text-ratio font-bold leading-none"
          >
            {{ formatRatio(evaluation.ratio) }}
          </span>
        </p>
        <table class="w-full border-collapse text-left">
          <caption class="sr-only">
            WCAG 2.2 contrast criteria
          </caption>
          <thead>
            <tr class="border-b border-rule text-muted">
              <th scope="col" class="py-tight pr-gutter font-semibold">
                Criterion
              </th>
              <th scope="col" class="py-tight pr-gutter font-semibold">
                Minimum
              </th>
              <th scope="col" class="py-tight font-semibold">Result</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in evaluation.criteria"
              :key="c.id"
              :data-testid="c.id"
              class="border-b border-rule"
            >
              <th scope="row" class="py-tight pr-gutter font-normal">
                {{ c.label }}
              </th>
              <td class="py-tight pr-gutter font-mono">{{ c.threshold }}:1</td>
              <td class="py-tight">
                <StatusBadge :pass="c.pass" />
              </td>
            </tr>
          </tbody>
        </table>
      </template>
      <p v-else>Enter two valid hex colors to see the contrast ratio.</p>
    </div>
  </section>
</template>
