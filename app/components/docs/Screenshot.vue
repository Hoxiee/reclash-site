<script setup lang="ts">
import { docPath, docText, type DocLanguage } from '~~/shared/docs/catalogue'
import type { DocScreenshot } from '~~/shared/docs/types'
const props = defineProps<{ screenshot: DocScreenshot, language: DocLanguage }>()
const failed = ref(false)
const t = (ru: string, en: string, zh?: string) => docText(props.language, ru, en, zh)
</script>

<template>
  <figure :id="`screenshot-${screenshot.id}`" class="hb-shot" :class="{ 'is-wide': screenshot.width > screenshot.height }" :data-screenshot="screenshot.id">
    <div class="hb-shot-frame" :style="{ aspectRatio: `${screenshot.width} / ${screenshot.height}` }">
      <img v-if="screenshot.src && !failed" :src="screenshot.src" :alt="screenshot.description" :width="screenshot.width" :height="screenshot.height" loading="lazy" decoding="async" @error="failed = true">
      <div v-else class="hb-shot-empty" role="img" :aria-label="`${t('Скриншот готовится', 'Screenshot pending', '截图待补充')}: ${screenshot.id}`">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3H5a2 2 0 0 0-2 2v2m14-4h2a2 2 0 0 1 2 2v2M3 17v2a2 2 0 0 0 2 2h2m14-4v2a2 2 0 0 1-2 2h-2M8 15l3-4 2.5 3 1.5-2 2 3" /></svg>
        <code>{{ screenshot.id }}</code>
        <span>{{ screenshot.width }} × {{ screenshot.height }}</span>
      </div>
    </div>
    <figcaption>
      <span class="hb-shot-caption"><DocsInline :nodes="screenshot.caption" /></span>
      <SiteLink class="hb-shot-spec" :to="`${docPath(language, 'rcx/screenshots')}`">{{ t('Требования к снимку', 'Capture spec', '截图规范') }}</SiteLink>
    </figcaption>
  </figure>
</template>
