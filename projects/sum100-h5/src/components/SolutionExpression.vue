<template>
  <div class="solution-expression" ref="expressionRef"></div>
</template>

<script setup lang="ts">
import {onMounted, ref, watch} from 'vue';
import {renderToLatex, SolutionResult} from 'sum100';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const props = defineProps<{ solution: SolutionResult }>();

const expressionRef = ref<HTMLElement | null>(null);

function renderKaTeX() {
  if (expressionRef.value && props.solution) {
    try {
      const latex = renderToLatex(props.solution);
      katex.render(latex, expressionRef.value, {
        displayMode: true,
        throwOnError: false
      });
    } catch (err) {
      console.error('KaTeX rendering error:', err);
      expressionRef.value.textContent = props.solution.expression.toString();
    }
  }
}

onMounted(() => {
  renderKaTeX();
});

watch(() => props.solution, () => {
  renderKaTeX();
}, {deep: true});
</script>

<style scoped>
.solution-expression {
  font-size: 1.2rem;
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.25rem;
  min-height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>