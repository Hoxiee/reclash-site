<script setup lang="ts">
import { docText, type DocLanguage } from '~~/shared/docs/catalogue'
import type { DocSearchEntry } from '~~/shared/docs/types'
import { loadDocSearchIndex } from '~/utils/docs'
const props = defineProps<{ language: DocLanguage }>()
const t = (ru: string, en: string, zh?: string) => docText(props.language, ru, en, zh)
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const input = useTemplateRef<HTMLInputElement>('input')
const list = useTemplateRef<HTMLUListElement>('list')
const query = ref('')
const selected = ref(0)
const entries = shallowRef<DocSearchEntry[]>([])
const state = ref<'idle' | 'loading' | 'failed'>('idle')
const router = useRouter()
// Folding must keep string length: highlight ranges found in the folded text are applied to the original.
const fold = (char: string) => {
  const folded = char.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  return folded.length === char.length ? folded : char
}
const normalize = (text: string) => text.replace(/[\s\S]/gu, fold)
let prepared: Array<{ entry: DocSearchEntry, title: string, heading: string, text: string }> = []

async function load() {
  if (entries.value.length || state.value === 'loading') return
  state.value = 'loading'
  try {
    entries.value = await loadDocSearchIndex(props.language)
    prepared = entries.value.map(entry => ({ entry, title: normalize(entry.page), heading: normalize(entry.heading), text: normalize(entry.text) }))
    state.value = 'idle'
  } catch {
    state.value = 'failed'
  }
}

function open() {
  if (!dialog.value || dialog.value.open) return
  dialog.value.showModal()
  input.value?.select()
  void load()
}
defineExpose({ open })

const terms = computed(() => normalize(query.value.trim()).split(/\s+/).filter(Boolean))
const results = computed(() => {
  if (!terms.value.length || !entries.value.length) return []
  return prepared.flatMap(item => {
    if (!terms.value.every(term => item.title.includes(term) || item.heading.includes(term) || item.text.includes(term))) return []
    const score = terms.value.reduce((sum, term) => sum + (item.heading.startsWith(term) ? 6 : item.heading.includes(term) ? 4 : 0) + (item.title.includes(term) ? 3 : 0) + (item.text.includes(term) ? 1 : 0), 0) + (item.entry.heading ? 0 : 1)
    const at = Math.max(0, item.text.indexOf(terms.value[0]!) - 48)
    return [{ ...item.entry, score, excerpt: `${at ? '…' : ''}${item.entry.text.slice(at, at + 160).trim()}${item.entry.text.length > at + 160 ? '…' : ''}` }]
  }).sort((a, b) => b.score - a.score).slice(0, 40)
})
watch(query, () => { selected.value = 0 })

function marks(text: string) {
  const source = normalize(text)
  const ranges: Array<[number, number]> = []
  for (const term of terms.value) {
    for (let at = source.indexOf(term); at >= 0 && ranges.length < 24; at = source.indexOf(term, at + term.length)) ranges.push([at, at + term.length])
  }
  ranges.sort((a, b) => a[0] - b[0])
  const parts: Array<{ text: string, hit: boolean }> = []
  let last = 0
  for (const [start, end] of ranges) {
    if (start < last) continue
    if (start > last) parts.push({ text: text.slice(last, start), hit: false })
    parts.push({ text: text.slice(start, end), hit: true })
    last = end
  }
  if (last < text.length) parts.push({ text: text.slice(last), hit: false })
  return parts
}

function move(step: number) {
  if (!results.value.length) return
  selected.value = (selected.value + step + results.value.length) % results.value.length
  nextTick(() => list.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }))
}

async function go(href = results.value[selected.value]?.href) {
  if (!href) return
  dialog.value?.close()
  await router.push(href)
}

function backdrop(event: MouseEvent) {
  if (event.target === dialog.value) dialog.value?.close()
}
</script>

<template>
  <dialog ref="dialog" class="hb-palette" :aria-label="t('Поиск по документации', 'Search documentation', '搜索文档')" @click="backdrop" @keydown.esc.prevent="dialog?.close()">
    <div class="hb-palette-box">
      <label class="hb-palette-field">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
        <span class="sr-only">{{ t('Запрос', 'Query', '搜索词') }}</span>
        <input ref="input" v-model="query" type="search" maxlength="120" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-controls="hb-palette-results" :aria-expanded="results.length > 0" :aria-activedescendant="results.length ? `hb-result-${selected}` : undefined" :placeholder="t('Заголовок, ключ, поле…', 'Header, key, field…', '响应头、键、字段…')" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.enter.prevent="go()">
        <kbd aria-hidden="true">Esc</kbd>
      </label>
      <p class="hb-palette-status" role="status">
        <template v-if="state === 'loading'">{{ t('Загружаем индекс…', 'Loading the index…', '正在加载索引…') }}</template>
        <template v-else-if="state === 'failed'">{{ t('Индекс не загрузился. Закройте и откройте поиск ещё раз.', 'The index did not load. Close and reopen search.', '索引加载失败，请重新打开搜索。') }}</template>
        <template v-else-if="terms.length && !results.length">{{ t('Ничего не найдено', 'No results', '没有结果') }}</template>
        <template v-else-if="terms.length">{{ t(`Результатов: ${results.length}`, `${results.length} results`, `${results.length} 个结果`) }}</template>
        <template v-else>{{ t('Ищет по всем разделам: провайдеры и RCX', 'Searches every section: providers and RCX', '搜索全部章节') }}</template>
      </p>
      <ul v-if="results.length" id="hb-palette-results" ref="list" class="hb-palette-results" role="listbox">
        <li v-for="(result, index) in results" :id="`hb-result-${index}`" :key="result.href" role="option" :aria-selected="index === selected" @mousemove="selected = index" @click="go(result.href)">
          <span class="hb-result-path">{{ result.section ? `${result.section} · ` : '' }}{{ result.page }}</span>
          <b><template v-for="(part, at) in marks(result.heading || result.page)" :key="at"><mark v-if="part.hit">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></b>
          <span v-if="result.excerpt" class="hb-result-text"><template v-for="(part, at) in marks(result.excerpt)" :key="at"><mark v-if="part.hit">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></span>
        </li>
      </ul>
      <p class="hb-palette-keys" aria-hidden="true"><span><kbd>↑</kbd><kbd>↓</kbd> {{ t('выбор', 'select', '选择') }}</span><span><kbd>Enter</kbd> {{ t('открыть', 'open', '打开') }}</span></p>
    </div>
  </dialog>
</template>
