<script setup lang="ts">
import { pagePath } from '~~/shared/site/routes'
definePageMeta({ layout: 'ported' })
usePageMeta('gallery')
const { language, t } = useText()
</script>

<template>
<div>
<section class="ph"><div class="wrap ph-grid">
  <div>
    <h1 data-words>{{ t("ReClash в деле.", "ReClash in action.") }}</h1>
    <p class="lede" data-fade>{{ t("Скриншоты и короткие клипы: как выглядит клиент, что делает обход DPI и как провайдер настраивает вид под себя.", "Screenshots and short clips: what the client looks like, how DPI bypass works and how providers make it their own.") }}</p>
  </div>
  <svg class="ph-ring" viewBox="0 0 400 400" aria-hidden="true">
  <defs><linearGradient id="phG" x1="60" y1="60" x2="340" y2="340" gradientUnits="userSpaceOnUse"><stop offset="0" style="stop-color:var(--brand-2)"/><stop offset=".5" style="stop-color:var(--brand)"/><stop offset="1" style="stop-color:var(--brand-3)"/></linearGradient></defs>
  <circle class="glow" cx="200" cy="200" r="120"/>
  <path class="rg" stroke-width="30"/>
  <rect class="glyph" x="160" y="168" width="80" height="64" rx="12"/><path class="glyph" d="M168 224l22-22 16 14 14-12 16 16"/>
</svg>
</div></section>

<section class="sub-sec" style="padding-top:0;border-top:0"><div class="wrap">
  <GalleryGrid />
  <p class="g-empty">{{ t("Живые кадры появятся здесь. Пока на месте каждого кадра — заглушка.", "Real footage will appear here. Each tile is a placeholder for now.") }}</p>
</div></section>
</div>
</template>
