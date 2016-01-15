<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script setup lang="ts">

</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #f5f7fa;
  color: #2c3e50;
  line-height: 1.6;
}

#app {
  min-height: 100vh;
}

/* KaTeX样式覆盖 */
.katex {
  font-size: 1.1em;
}

.katex-display {
  margin: 0.5em 0;
}
</style>