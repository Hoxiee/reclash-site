<script setup lang="ts">
/*
 * The ReClash glyph: three parallel capsules (1.5 : 3 : 1) centred on one axis and leaning 20°.
 * Each capsule is a round-capped stroke on a path 25% longer than the bar, normalised by
 * pathLength, so CSS and springs morph it between a dot (dash 0) and an overshoot (dash 1)
 * by dash length alone; the nominal bar is dash 0.8. Colours follow the brand hue (brand.css).
 */
withDefaults(defineProps<{ mono?: boolean }>(), { mono: false })
const id = useId()
const bars = [
  { x: -101.2, h: 86.25 },
  { x: 0, h: 172.5 },
  { x: 101.2, h: 57.5 },
]
</script>

<template>
  <svg class="bm" :class="{ 'is-mono': mono }" viewBox="-166 -166 332 332" aria-hidden="true" focusable="false">
    <defs v-if="!mono">
      <linearGradient v-for="(_, index) in bars" :id="`${id}-${index + 1}`" :key="index" gradientUnits="userSpaceOnUse" x1="0" y1="-184" x2="0" y2="184">
        <stop offset="0" :style="`stop-color:var(--mk-${index + 1}a)`" />
        <stop offset="1" :style="`stop-color:var(--mk-${index + 1}b)`" />
      </linearGradient>
    </defs>
    <g transform="translate(4 0) rotate(-20)">
      <path
        v-for="(bar, index) in bars" :key="index" :class="`bm-bar bm-${index + 1}`" :style="`--n:${index}`"
        :d="`M${bar.x} ${bar.h}V${-bar.h}`" pathLength="1" :stroke="mono ? 'currentColor' : `url(#${id}-${index + 1})`"
      />
    </g>
  </svg>
</template>
