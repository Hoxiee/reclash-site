<script setup lang="ts">
import { pagePath, type PageKey } from '~~/shared/site/routes'
// Shared sub-navigation of the developer section; the active tab keeps the magnet indicator.
defineProps<{ page: PageKey }>()
const { language, t } = useText()
const tabs = computed(() => [
  { key: 'docs', text: t('Документация', 'Documentation') },
  { key: 'reference', text: t('Заголовки', 'Headers') },
  { key: 'builder', text: t('Конструктор', 'Builder') },
  { key: 'mock-subs', text: t('Мок-подписки', 'Mock subscriptions') },
  { key: 'report', text: t('Отчёт', 'Report') },
] as const)
// On narrow screens the strip scrolls; start it with the current section in view.
const strip = useTemplateRef<HTMLElement>('strip')
onMounted(() => {
  const current = strip.value?.querySelector<HTMLElement>('[aria-current="page"]')
  if (strip.value && current) strip.value.scrollLeft = Math.max(0, current.offsetLeft - (strip.value.clientWidth - current.offsetWidth) / 2)
})
</script>

<template>
  <nav ref="strip" class="dev-tabs" data-fade style="--d:180ms" :aria-label="t('Разделы для провайдеров', 'Provider sections')">
    <div class="dev-tabs-in" data-group data-sticky data-items="a" data-cpull="0.04">
      <SiteLink v-for="tab in tabs" :key="tab.key" :to="pagePath(language, tab.key)" :aria-current="page === tab.key ? 'page' : undefined">{{ tab.text }}</SiteLink>
    </div>
  </nav>
</template>
