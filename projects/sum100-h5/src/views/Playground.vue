<template>
  <div class="playground">
    <div class="header">
      <h1>Sum-100 求解器</h1>
      <p class="description">
        输入数字序列和目标值，求解器会找到所有可能的表达式组合。<br>
        例如：<code>1 2 3 4 5 6 7 8 9 = 100</code>
      </p>
    </div>
    
    <div class="input-section">
      <div class="input-group">
        <input
          ref="inputRef"
          v-model="inputValue"
          type="text"
          placeholder="输入数字序列和目标值，如：1 2 3 4 5 6 7 8 9 = 100"
          class="expression-input"
          :disabled="isRunning"
          @keyup.enter="handleSolve"
        >
        <button
          class="solve-button"
          :class="{
            'running': isRunning,
            'completed': isCompleted
          }"
          @click="handleButtonClick"
        >
          <span v-if="!isRunning && !isCompleted">求解</span>
          <span v-else-if="isRunning">停止</span>
          <span v-else>完成</span>
        </button>
      </div>
      
      <div class="options">
        <label>
          <input v-model="enableConcatenation" type="checkbox" :disabled="isRunning">
          启用数字连接（如123）
        </label>
        <label>
          <input v-model="showSteps" type="checkbox">
          显示计算步骤
        </label>
      </div>
    </div>
    
    <!-- 进度显示 -->
    <div v-if="isRunning || progress" class="progress-section">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: `${(progress?.progress || 0) * 100}%` }"
        ></div>
      </div>
      <div class="progress-stats">
        <span>尝试次数: {{ (progress?.attempts || 0).toLocaleString() }}</span>
        <span>找到解: {{ solutions.length }}</span>
        <span v-if="progress?.eta">预计剩余: {{ Math.round((progress.eta || 0) / 1000) }}s</span>
        <span>进度: {{ Math.round((progress?.progress || 0) * 100) }}%</span>
      </div>
    </div>
    
    <!-- 错误显示 -->
    <div v-if="error" class="error-section">
      <div class="error-message">
        <i class="icon-error">⚠️</i>
        {{ error }}
      </div>
    </div>
    
    <!-- 解决方案显示 -->
    <div v-if="solutions.length > 0" class="solutions-section">
      <h2>找到的解 ({{ solutions.length }})</h2>
      <div class="solutions-list">
        <div 
          v-for="(solution, index) in solutions" 
          :key="index"
          class="solution-item"
        >
          <div class="solution-header">
            <span class="solution-number">解 {{ index + 1 }}</span>
            <div class="solution-meta">
              <span>尝试: {{ solution.attempts }}</span>
              <span>耗时: {{ solution.duration }}ms</span>
            </div>
          </div>
          <div 
            ref="solutionRefs"
            class="solution-expression"
            :data-latex="getSolutionLatex(solution)"
          ></div>
        </div>
      </div>
    </div>
    
    <!-- 示例 -->
    <div v-if="!isRunning && solutions.length === 0" class="examples-section">
      <h2>示例</h2>
      <div class="examples-list">
        <div 
          v-for="example in examples" 
          :key="example.input"
          class="example-item"
          @click="loadExample(example.input)"
        >
          <code>{{ example.input }}</code>
          <span class="example-description">{{ example.description }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { renderToLatex, SolutionResult } from 'sum100-ts';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { WorkerMessage, WorkerResponse } from '../sum100.worker';

// 响应式数据
const inputValue = ref('1 2 3 4 5 6 7 8 9 = 100');
const isRunning = ref(false);
const isCompleted = ref(false);
const enableConcatenation = ref(true);
const showSteps = ref(false);
const progress = ref<any>(null);
const solutions = ref<SolutionResult[]>([]);
const error = ref('');
const inputRef = ref<HTMLInputElement>();
const solutionRefs = ref<HTMLElement[]>([]);

// Worker相关
let worker: Worker | null = null;

// 示例数据
const examples = [
  {
    input: '1 2 3 4 5 6 7 8 9 = 100',
    description: '经典的1到9求100问题'
  },
  {
    input: '1 2 3 = 6',
    description: '简单的加法'
  },
  {
    input: '1 2 3 4 = 10',
    description: '多种解法'
  },
  {
    input: '2 3 4 = 24',
    description: '24点游戏'
  }
];

// 生命周期
onMounted(() => {
  initWorker();
  inputRef.value?.focus();
});

onUnmounted(() => {
  if (worker) {
    worker.terminate();
  }
});

// 监听解决方案变化，渲染LaTeX
watch(solutions, async () => {
  await nextTick();
  renderSolutions();
}, { deep: true });

// 初始化Worker
function initWorker() {
  worker = new Worker(
    new URL('../sum100.worker.ts', import.meta.url),
    { type: 'module' }
  );
  
  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const { type, payload } = event.data;
    
    switch (type) {
      case 'progress':
        if (payload?.progress) {
          progress.value = payload.progress;
        }
        break;
        
      case 'solution':
        if (payload?.solution) {
          solutions.value.push(payload.solution);
        }
        break;
        
      case 'complete':
        isRunning.value = false;
        isCompleted.value = true;
        progress.value = null;
        setTimeout(() => {
          isCompleted.value = false;
        }, 2000);
        break;
        
      case 'error':
        isRunning.value = false;
        isCompleted.value = false;
        error.value = payload?.error || 'Unknown error';
        progress.value = null;
        break;
    }
  };
  
  worker.onerror = (err) => {
    console.error('Worker error:', err);
    error.value = 'Worker执行出错';
    isRunning.value = false;
  };
}

// 处理按钮点击
function handleButtonClick() {
  if (isRunning.value) {
    handleStop();
  } else if (!isCompleted.value) {
    handleSolve();
  }
}

// 开始求解
function handleSolve() {
  if (!inputValue.value.trim()) {
    error.value = '请输入表达式';
    return;
  }
  
  // 重置状态
  error.value = '';
  solutions.value = [];
  progress.value = null;
  isRunning.value = true;
  isCompleted.value = false;
  
  // 发送求解消息给Worker
  if (worker) {
    const message: WorkerMessage = {
      type: 'solve',
      payload: {
        input: inputValue.value,
        maxAttempts: 100000,
        timeout: 30000
      }
    };
    worker.postMessage(message);
  }
}

// 停止求解
function handleStop() {
  if (worker) {
    const message: WorkerMessage = { type: 'cancel' };
    worker.postMessage(message);
  }
  isRunning.value = false;
}

// 加载示例
function loadExample(example: string) {
  inputValue.value = example;
  error.value = '';
  solutions.value = [];
  inputRef.value?.focus();
}

// 获取解决方案的LaTeX
function getSolutionLatex(solution: SolutionResult): string {
  try {
    return renderToLatex(solution, { showSteps: showSteps.value });
  } catch (err) {
    console.error('LaTeX rendering error:', err);
    return solution.expression.toString();
  }
}

// 渲染解决方案
function renderSolutions() {
  solutionRefs.value.forEach((el, index) => {
    if (el && solutions.value[index]) {
      const latex = el.dataset.latex;
      if (latex) {
        try {
          katex.render(latex, el, {
            displayMode: true,
            throwOnError: false
          });
        } catch (err) {
          console.error('KaTeX rendering error:', err);
          el.textContent = solutions.value[index].expression.toString();
        }
      }
    }
  });
}
</script>

<style scoped>
.playground {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.description {
  color: #7f8c8d;
  font-size: 1.1rem;
  line-height: 1.6;
}

.description code {
  background: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-family: 'Monaco', 'Consolas', monospace;
}

.input-section {
  margin-bottom: 2rem;
}

.input-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.expression-input {
  flex: 1;
  padding: 1rem;
  font-size: 1.1rem;
  border: 2px solid #e9ecef;
  border-radius: 0.5rem;
  transition: border-color 0.3s;
}

.expression-input:focus {
  outline: none;
  border-color: #3498db;
}

.expression-input:disabled {
  background: #f8f9fa;
  color: #6c757d;
}

.solve-button {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 100px;
}

.solve-button:not(.running):not(.completed) {
  background: #3498db;
  color: white;
}

.solve-button:not(.running):not(.completed):hover {
  background: #2980b9;
}

.solve-button.running {
  background: #e74c3c;
  color: white;
}

.solve-button.running:hover {
  background: #c0392b;
}

.solve-button.completed {
  background: #95a5a6;
  color: white;
  cursor: not-allowed;
}

.options {
  display: flex;
  gap: 2rem;
}

.options label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #5a6c7d;
  cursor: pointer;
}

.options input[type="checkbox"] {
  transform: scale(1.2);
}

.progress-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  transition: width 0.3s;
}

.progress-stats {
  display: flex;
  gap: 2rem;
  font-size: 0.9rem;
  color: #5a6c7d;
}

.error-section {
  margin-bottom: 2rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #fee;
  color: #c0392b;
  border-radius: 0.5rem;
  border-left: 4px solid #e74c3c;
}

.solutions-section {
  margin-bottom: 2rem;
}

.solutions-section h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.solutions-list {
  display: grid;
  gap: 1rem;
}

.solution-item {
  padding: 1.5rem;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.solution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.solution-number {
  font-weight: 600;
  color: #3498db;
}

.solution-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #7f8c8d;
}

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

.examples-section {
  margin-top: 3rem;
}

.examples-section h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.examples-list {
  display: grid;
  gap: 0.5rem;
}

.example-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background 0.3s;
}

.example-item:hover {
  background: #e9ecef;
}

.example-item code {
  font-family: 'Monaco', 'Consolas', monospace;
  font-weight: 600;
}

.example-description {
  color: #7f8c8d;
  font-size: 0.9rem;
}
</style>