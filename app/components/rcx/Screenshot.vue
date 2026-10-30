<script setup lang="ts">
import { rcxPagePath, rcxText, type RcxLanguage } from '~~/shared/site/rcx'
import type { RcxScreenshot } from '~~/shared/site/rcx-document'
const props = defineProps<{ screenshot: RcxScreenshot, language: RcxLanguage }>()
const failed = ref(false)
const t = (ru: string, en: string, zh: string) => rcxText(props.language, ru, en, zh)
const target = computed(() => props.screenshot.src ?? `/assets/rcx/screenshots/${props.language}/${props.screenshot.id}.png`)
</script>

<template>
  <figure :id="`screenshot-${screenshot.id}`" class="rcx-screenshot" :class="{ 'rcx-screenshot-wide': screenshot.width > screenshot.height }" :data-screenshot="screenshot.id">
    <div class="rcx-screenshot-frame" :style="{ aspectRatio: `${screenshot.width} / ${screenshot.height}` }">
      <img v-if="screenshot.src && !failed" :src="screenshot.src" :alt="screenshot.description" :width="screenshot.width" :height="screenshot.height" loading="lazy" decoding="async" @error="failed = true">
      <div v-else class="rcx-screenshot-placeholder" role="img" :aria-label="`${t('Место для скриншота', 'Screenshot placeholder', '截图占位图')}: ${screenshot.id}`">
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M15 6H8a2 2 0 0 0-2 2v7m27-9h7a2 2 0 0 1 2 2v7M6 33v7a2 2 0 0 0 2 2h7m27-9v7a2 2 0 0 1-2 2h-7M17 31l7-9 5 6 4-4 4 7M17 17h.01" /></svg>
        <p>{{ failed ? t('Не удалось загрузить скриншот', 'Screenshot could not load', '无法加载截图') : t('Здесь будет скриншот', 'Screenshot coming here', '截图将在此处显示') }}</p>
        <code>{{ screenshot.id }}</code>
        <span>{{ screenshot.width }} × {{ screenshot.height }}</span>
      </div>
    </div>
    <figcaption><RcxInline :nodes="screenshot.caption" /></figcaption>
    <details class="rcx-capture">
      <summary>{{ t('Как подготовить этот скриншот', 'How to capture this screenshot', '如何准备此截图') }}</summary>
      <p>{{ screenshot.capture }}</p>
      <p><SiteLink :to="`${rcxPagePath(language, 'screenshots')}#demo-setup`">{{ t('Общая демо-настройка', 'Shared demo setup', '统一演示配置') }}</SiteLink></p>
      <p>{{ t('Файл на сайте', 'Site asset', '网站文件') }}: <code>{{ target }}</code></p>
    </details>
  </figure>
</template>
