<script setup lang="ts">
import { pagePath } from '~~/shared/site/routes'
usePageMeta('gallery')
const { language, t } = useText()
</script>

<template>
<div>
<section class="ph"><div class="wrap ph-grid">
  <div>
    <h1 data-words>{{ t("ReClash в деле.", "ReClash in action.") }}</h1>
    <p class="lede" data-fade>{{ t("Подключение, выбор узлов, маршрутизация RCX и данные подписки. Ниже — схематические иллюстрации разделов, а не скриншоты текущей сборки.", "Connection, node selection, RCX routing and subscription data. The tiles below are schematic illustrations of these areas, not screenshots of the current build.") }}</p>
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
  <p class="g-empty">{{ t("Иллюстрации не воспроизводят интерфейс приложения. Возможности текущей сборки описаны на главной странице, в быстром старте и", "These illustrations do not reproduce the app interface. The current build is described on the home page, in the quick start and in the") }} <SiteLink class="tlink" :to="pagePath(language, 'rcx')">{{ t("руководстве по RCX", "RCX guide") }}</SiteLink>.</p>
</div></section>
</div>
</template>
