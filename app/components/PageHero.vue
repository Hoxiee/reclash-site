<script setup lang="ts">
// Inner-page hero: headline, lede, tags and the small jelly ring driven by app/motion/pages.js.
withDefaults(defineProps<{ title: string, lede?: string, glyph?: string }>(), {
  lede: '', glyph: 'M160 200h84m0 0-30-30m30 30-30 30',
})
</script>

<template>
  <section class="ph"><div class="wrap ph-grid">
    <div>
      <p v-if="$slots.eyebrow" class="ph-eyebrow" data-fade><slot name="eyebrow" /></p>
      <h1 data-words>{{ title }}</h1>
      <p v-if="lede" class="lede" data-fade>{{ lede }}</p>
      <div v-if="$slots.tags" class="ph-tags" data-fade style="--d:120ms"><slot name="tags" /></div>
      <slot />
    </div>
    <svg class="ph-ring" viewBox="0 0 400 400" aria-hidden="true">
      <defs><linearGradient id="phG" x1="60" y1="60" x2="340" y2="340" gradientUnits="userSpaceOnUse"><stop offset="0" style="stop-color:var(--brand-2)" /><stop offset=".5" style="stop-color:var(--brand)" /><stop offset="1" style="stop-color:var(--brand-3)" /></linearGradient></defs>
      <circle class="glow" cx="200" cy="200" r="120" />
      <path class="rg" stroke-width="30" />
      <path class="glyph" :d="glyph" />
    </svg>
  </div></section>
</template>
