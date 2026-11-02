<script setup lang="ts">
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { docLanguageFromPath, docPage, docSection, docSlugFromPath, docText } from '~~/shared/docs/catalogue'
import '~/assets/css/handbook.css'

const route = useRoute()
const language = docLanguageFromPath(route.path)
const slug = computed(() => docSlugFromPath(route.path))
const page = computed(() => docPage(slug.value))
const section = computed(() => page.value?.section ? docSection(page.value.section) : undefined)
const t = (ru: string, en: string, zh?: string) => docText(language, ru, en, zh)
const pageKey = (route: RouteLocationNormalizedLoaded) => `${docLanguageFromPath(route.path)}/docs/${docSlugFromPath(route.path)}`
const navOpen = ref(false)
const search = useTemplateRef<{ open: () => void }>('search')

function typing(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}
function shortcut(event: KeyboardEvent) {
  if (event.defaultPrevented || event.altKey) return
  const combo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'
  if (combo || (event.key === '/' && !event.ctrlKey && !event.metaKey && !typing(event.target))) {
    event.preventDefault()
    navOpen.value = false
    search.value?.open()
  } else if (event.key === 'Escape' && navOpen.value) {
    navOpen.value = false
  }
}

onMounted(() => window.addEventListener('keydown', shortcut))
watch(slug, () => { navOpen.value = false })
watch(navOpen, open => { if (import.meta.client) document.documentElement.classList.toggle('hb-locked', open) })
onBeforeUnmount(() => {
  window.removeEventListener('keydown', shortcut)
  document.documentElement.classList.remove('hb-locked')
})
</script>

<template>
  <div id="top" class="hb" :class="{ 'is-home': !slug }">
    <div class="hb-bar">
      <button class="hb-bar-menu" type="button" :aria-expanded="navOpen" aria-controls="hb-side" @click="navOpen = !navOpen">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
        <span class="hb-bar-where"><span>{{ section?.title[language] ?? t('Документация', 'Documentation', '文档') }}</span><b>{{ page?.titles[language] }}</b></span>
      </button>
      <button class="hb-bar-search" type="button" :aria-label="t('Поиск по документации', 'Search documentation', '搜索文档')" @click="search?.open()">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
      </button>
    </div>
    <button v-if="navOpen" class="hb-scrim" type="button" :aria-label="t('Закрыть навигацию', 'Close navigation', '关闭导航')" @click="navOpen = false" />

    <div class="hb-shell">
      <aside id="hb-side" class="hb-side" :class="{ 'is-open': navOpen }">
        <DocsNav :language="language" :slug="slug" :open="navOpen" @search="search?.open()" @navigate="navOpen = false" />
      </aside>
      <NuxtPage :page-key="pageKey" />
    </div>
    <DocsSearch ref="search" :language="language" />
  </div>
</template>
