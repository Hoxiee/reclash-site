<script setup lang="ts">
// Prerendered first-paint cover. brand.css shows it only under html.js; useSiteMotion opens it.
const letters = Array.from('ReClash')
</script>

<template>
  <div class="loader" aria-hidden="true">
    <div class="loader-core">
      <BrandMark class="loader-mark" />
      <span class="loader-word"><span v-for="(letter, index) in letters" :key="index" :style="{ '--i': index }">{{ letter }}</span></span>
    </div>
  </div>
</template>
