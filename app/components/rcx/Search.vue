<script setup lang="ts">
import { rcxText, type RcxLanguage } from '~~/shared/site/rcx'
import { loadRcxSearchIndex } from '~/utils/rcx'
import type { RcxSearchEntry } from '~~/shared/site/rcx-document'
const props = defineProps<{ language: RcxLanguage }>()
const query = ref('')
const input = useTemplateRef<HTMLInputElement>('input')
function clear() {
  query.value = ''
  input.value?.focus()
}
const entries = shallowRef<RcxSearchEntry[]>([])
const loading = ref(false)
const failed = ref(false)
const t = (ru: string, en: string, zh: string) => rcxText(props.language, ru, en, zh)
const normalize = (text: string) => text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
let disposed = false
let request: Promise<RcxSearchEntry[]> | undefined

watch(query, async value => {
  if (value.trim().length < 2 || entries.value.length || request) return
  failed.value = false
  loading.value = true
  request = loadRcxSearchIndex(props.language)
  try {
    const data = await request
    if (!disposed) entries.value = data
  } catch {
    if (!disposed) failed.value = true
  } finally {
    if (!disposed) loading.value = false
    request = undefined
  }
})
onBeforeUnmount(() => { disposed = true })

const results = computed(() => {
  const terms = normalize(query.value.trim()).split(/\s+/)
  if (query.value.trim().length < 2) return []
  return entries.value.flatMap(entry => {
    const title = normalize(`${entry.title} ${entry.heading}`)
    const text = normalize(entry.text)
    if (!terms.every(term => title.includes(term) || text.includes(term))) return []
    const position = Math.max(0, text.indexOf(terms[0]!) - 60)
    return [{ ...entry, score: terms.filter(term => title.includes(term)).length, excerpt: `${position ? '…' : ''}${entry.text.slice(position, position + 180).trim()}…` }]
  }).sort((a, b) => b.score - a.score).slice(0, 30)
})
</script>

<template>
  <section class="rcx-search" :aria-label="t('Поиск по руководству RCX', 'Search the RCX handbook', '搜索 RCX 手册')" @keydown.esc.stop.prevent="clear">
    <label class="doc-toc-filter" for="rcx-search-input">
      <span class="sr-only">{{ t('Поиск по всей документации RCX', 'Search all RCX documentation', '搜索所有 RCX 文档') }}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
      <input id="rcx-search-input" ref="input" v-model="query" type="search" maxlength="160" autocomplete="off" :placeholder="t('Поиск по руководству…', 'Search the handbook…', '搜索手册…')" aria-controls="rcx-search-results">
    </label>
    <div v-if="query.trim().length >= 2" id="rcx-search-results" class="rcx-search-results">
      <p role="status">{{ loading ? t('Ищем…', 'Searching…', '搜索中…') : failed ? t('Не удалось загрузить поиск. Измените запрос, чтобы повторить.', 'Search could not load. Change your query to retry.', '无法加载搜索。请修改关键词后重试。') : results.length ? t(`Найдено разделов: ${results.length}`, `Sections found: ${results.length}`, `找到 ${results.length} 个章节`) : t('Ничего не найдено', 'No matches', '未找到结果') }}</p>
      <ul><li v-for="entry in results" :key="entry.href">
        <SiteLink :to="entry.href"><span>{{ entry.title }}</span><b>{{ entry.heading }}</b><p>{{ entry.excerpt }}</p></SiteLink>
      </li></ul>
    </div>
  </section>
</template>
