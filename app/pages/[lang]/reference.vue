<script setup lang="ts">
import { headerCategories, headerReference, searchText, type HeaderCategory, type HeaderEntry } from '~~/shared/provider/reference'
import { pagePath } from '~~/shared/site/routes'
import type { Magnet } from '~/motion/types'
import type { PageMotion } from '~/composables/usePageMotion'
import '~/assets/css/reference.css'

usePageMeta('reference')
const { language, t } = useText()
const route = useRoute()
const motion = usePageMotion()

type Filter = 'all' | HeaderCategory
const query = ref('')
// `category` is the pressed filter (and ?cat=); `applied` is what the results show. It trails
// `category` by the short fade-out of the previous set when the switch animates.
const category = ref<Filter>('all')
const applied = ref<Filter>('all')
const open = reactive<Record<string, boolean>>({})
const search = useTemplateRef<HTMLInputElement>('search')
const strip = useTemplateRef<HTMLElement>('strip')
const results = useTemplateRef<HTMLElement>('results')
const ready = ref(false)

const total = headerReference.length
const countOf = (key: HeaderCategory) => headerReference.filter(entry => entry.category === key).length

const terms = computed(() => query.value.toLowerCase().trim().split(/\s+/).filter(Boolean))
const haystacks = computed(() => new Map(headerReference.map(entry => [entry.id, searchText(entry, language.value)])))
const matchesQuery = (entry: HeaderEntry) => terms.value.every(term => haystacks.value.get(entry.id)!.includes(term))
const matched = computed(() => new Set(headerReference.filter(matchesQuery).map(entry => entry.id)))
const isVisible = (entry: HeaderEntry) => matched.value.has(entry.id) && (applied.value === 'all' || entry.category === applied.value)
const visible = computed(() => headerReference.filter(isVisible))

const filters = computed(() => [
  { key: 'all' as Filter, label: t('Все', 'All'), count: matched.value.size },
  ...headerCategories.map(item => ({
    key: item.key as Filter, label: item.label[language.value],
    count: headerReference.filter(entry => entry.category === item.key && matched.value.has(entry.id)).length,
  })),
])

const groups = computed(() => headerCategories.map(item => {
  const entries = headerReference.filter(entry => entry.category === item.key)
  return { ...item, entries, shown: entries.filter(isVisible).length }
}))

const status = computed(() => visible.value.length === total
  ? t(`Все ${total} заголовков`, `All ${total} headers`)
  : t(`Найдено: ${visible.value.length} из ${total}`, `${visible.value.length} of ${total} headers`))

const allOpen = computed(() => visible.value.length > 0 && visible.value.every(entry => open[entry.id]))
function toggleAll() {
  const next = !allOpen.value
  for (const entry of visible.value) open[entry.id] = next
}

function reset() {
  query.value = ''
  choose('all')
  search.value?.focus()
}

/* ---------- category switch ----------
   A click fades the current set out, swaps the filter, then lifts the new groups and cards in
   with a stagger capped to what will be on screen. Clicks during the fade only retarget it. */
const isReduced = (runtime: PageMotion) => runtime.M.reduced || document.documentElement.classList.contains('rm')
let leaveTimer = 0, leaving: Animation | undefined, switching = false

function choose(key: Filter, animate = true) {
  if (key === category.value && key === applied.value) return
  category.value = key
  const runtime = motion.value
  if (!animate || !runtime || isReduced(runtime) || !results.value) {
    clearTimeout(leaveTimer); leaveTimer = 0
    leaving?.cancel(); leaving = undefined
    applied.value = key
    if (animate) nextTick(() => bringResults(false))
    return
  }
  if (leaveTimer) return
  leaving = runtime.scope.animate(results.value, [{ opacity: 1 }, { opacity: 0 }], { duration: 110, easing: 'ease-in', fill: 'forwards' })
  leaveTimer = window.setTimeout(enter, 110)
}

async function enter() {
  leaveTimer = 0
  switching = true
  applied.value = category.value
  await nextTick()
  switching = false
  // Lifting the fade and starting the entrance in one task leaves no frame with the set shown.
  leaving?.cancel(); leaving = undefined
  const runtime = motion.value, main = results.value
  if (!runtime || !main || isReduced(runtime)) return
  const shift = bringResults(true)
  const items = [...main.querySelectorAll<HTMLElement>('.ref-group-head, .ref-card, .ref-empty')].filter(item => {
    if (!item.getClientRects().length) return false
    const box = item.getBoundingClientRect()
    return box.bottom - shift > 0 && box.top - shift < innerHeight
  }).slice(0, 12)
  const ease = runtime.M.cssEase('smooth')
  const easing = CSS.supports('transition-timing-function', 'linear(0, 1)') ? ease.easing : 'cubic-bezier(0.2, 0.8, 0.2, 1)'
  items.forEach((item, index) => runtime.scope.animate(item, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
    { duration: ease.duration, easing, delay: Math.min(index, 10) * 35, fill: 'backwards' }))
}

// When the new set starts above the viewport, scroll its start back under the sticky bars.
// Returns the scroll distance, so the entrance can pick the items that will end up on screen.
function bringResults(smooth: boolean) {
  const first = [...results.value?.children ?? []].find(item => item.getClientRects().length)
  if (!first) return 0
  const offset = (parseFloat(getComputedStyle(first).scrollMarginTop) || 0)
    + (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0)
  const shift = first.getBoundingClientRect().top - offset
  if (shift >= -1) return 0
  first.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' })
  return shift
}

// Typing stays light: cards and groups that newly appear on screen only fade in, without a stagger.
watch(visible, (now, before) => {
  const runtime = motion.value
  if (switching || leaveTimer || !runtime || isReduced(runtime)) return
  const seen = new Set(before.map(entry => entry.id)), groupsSeen = new Set(before.map(entry => entry.category))
  const fresh = new Set<HTMLElement>()
  for (const entry of now) {
    if (seen.has(entry.id)) continue
    const element = document.getElementById(groupsSeen.has(entry.category) ? entry.id : `cat-${entry.category}`)
    if (element) fresh.add(element)
  }
  let count = 0
  for (const element of fresh) {
    const box = element.getBoundingClientRect()
    if (box.bottom <= 0 || box.top >= innerHeight) continue
    runtime.scope.animate(element, [{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' })
    if (++count >= 12) break
  }
}, { flush: 'post' })

/* ---------- sliding plate under the pressed filter ---------- */
let magnet: Magnet | undefined, owner: PageMotion | undefined
function mountFilters() {
  const runtime = motion.value
  if (!runtime || !strip.value || owner === runtime) return
  owner = runtime
  magnet = runtime.M.magnetGroup(strip.value, { items: 'button', sticky: true, contentPull: 0 })
  runtime.scope.frame(() => selectPlate(false))
}

function selectPlate(smooth = true) {
  const group = strip.value
  const button = group?.querySelector<HTMLElement>(`.ref-filter[data-cat="${category.value}"]`)
  if (!group || !button) return
  magnet?.select(button)
  // The narrow layout scrolls the filters sideways; keep the pressed one inside the strip.
  const left = button.offsetLeft, right = left + button.offsetWidth
  if (left >= group.scrollLeft && right <= group.scrollLeft + group.clientWidth) return
  const reduced = !motion.value || isReduced(motion.value)
  group.scrollTo({ left: left - (group.clientWidth - button.offsetWidth) / 2, behavior: smooth && !reduced ? 'smooth' : 'auto' })
}
watch(motion, mountFilters)
watch(category, () => selectPlate(), { flush: 'post' })

// Keep ?q= and ?cat= shareable without a router navigation (the fragment stays as is).
function syncUrl() {
  if (!import.meta.client) return
  const url = new URL(location.href)
  if (query.value.trim()) url.searchParams.set('q', query.value.trim())
  else url.searchParams.delete('q')
  if (category.value !== 'all') url.searchParams.set('cat', category.value)
  else url.searchParams.delete('cat')
  if (url.href !== location.href) history.replaceState(history.state, '', url)
}
watch([query, category], syncUrl)

// Opening /reference#h-<name>: clear filters that hide the entry, expand it and bring it into view.
function reveal(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, '')).toLowerCase()
  const entry = headerReference.find(item => item.id === id)
  if (!entry) return
  if (!isVisible(entry)) { query.value = ''; choose('all', false) }
  open[entry.id] = true
  // One frame later than the router's own hash scroll, which ignores scroll-padding and the sticky bar.
  nextTick(() => requestAnimationFrame(() => {
    const element = document.getElementById(entry.id)
    if (!element) return
    const reduced = document.documentElement.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches
    element.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' })
  }))
}
watch(() => route.hash, hash => { if (hash) reveal(hash) })

function onKey(event: KeyboardEvent) {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
  const target = event.target as HTMLElement | null
  if (target && (target.isContentEditable || /^(?:INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return
  event.preventDefault()
  search.value?.focus()
}

function onSearchKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && query.value) { event.preventDefault(); query.value = '' }
}

onMounted(() => {
  const params = new URLSearchParams(location.search)
  const q = params.get('q')
  const cat = params.get('cat')
  // A query typed before hydration lives only in the DOM; adopt it instead of dropping it.
  if (q) query.value = q
  else if (search.value?.value) query.value = search.value.value
  if (cat && headerCategories.some(item => item.key === cat)) choose(cat as Filter, false)
  if (location.hash) reveal(location.hash)
  window.addEventListener('keydown', onKey)
  mountFilters()
  ready.value = true
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  clearTimeout(leaveTimer)
})
</script>

<template>
  <div>
    <PageHero
      :title="t('Справочник по заголовкам', 'The header reference')"
      :lede="t('Каждый заголовок ответа, который читает ReClash: имя, формат, псевдонимы, что делает и пример. Ищите по имени или описанию, фильтруйте по категории.', 'Every response header ReClash reads: name, format, aliases, what it does and an example. Search by name or description, filter by category.')"
      glyph="M168 160v80M232 160v80M168 200h64"
    >
      <template #eyebrow>{{ t('Для провайдеров', 'For providers') }}</template>
      <template #tags>
        <span class="tag">{{ countOf('reclash') }} reclash-*</span>
        <span class="tag">{{ t(`${countOf('common')} общих`, `${countOf('common')} common`) }}</span>
        <span class="tag">HWID</span>
        <span class="tag">{{ countOf('alias') }} flclashx-*</span>
      </template>
      <ProviderTabs page="reference" />
    </PageHero>

    <section class="sub-sec ref-sec" :data-ready="ready || undefined">
      <div class="wrap ref-layout">
        <aside class="ref-side" :aria-label="t('Поиск и фильтр', 'Search and filter')">
          <div class="ref-search">
            <svg class="ref-search-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></svg>
            <input
              ref="search" v-model="query" class="input ref-input" type="search" autocomplete="off" spellcheck="false"
              enterkeyhint="search" :placeholder="t('Имя, назначение, токен…', 'Name, purpose, token…')"
              :aria-label="t('Поиск заголовков', 'Search headers')" aria-controls="ref-results" @keydown="onSearchKey"
            >
            <kbd class="ref-kbd" aria-hidden="true">/</kbd>
          </div>
          <div ref="strip" class="ref-filters" role="group" :aria-label="t('Фильтр по категориям', 'Filter by category')">
            <button
              v-for="item in filters" :key="item.key" class="ref-filter" type="button"
              :aria-pressed="category === item.key" :data-cat="item.key" @click="choose(item.key)"
            >
              <span class="ref-filter-dot" aria-hidden="true" />
              <span class="ref-filter-label">{{ item.label }}</span>
              <span class="ref-filter-n">{{ item.count }}</span>
            </button>
          </div>
          <div class="ref-side-foot">
            <p class="ref-status" role="status">{{ status }}</p>
            <button class="ref-toggle-all" type="button" :disabled="!visible.length" @click="toggleAll">
              {{ allOpen ? t('Свернуть все', 'Collapse all') : t('Развернуть все', 'Expand all') }}
            </button>
          </div>
          <p class="ref-hint">
            {{ t('Имена сравниваются без учёта регистра:', 'Names are case-insensitive:') }} <code>ReClash-Hex</code> {{ t('и', 'and') }} <code>reclash-hex</code> {{ t('— один заголовок.', 'are the same header.') }}
            <SiteLink class="tlink" :to="pagePath(language, 'docs')">{{ t('Как это работает', 'How it works') }}</SiteLink>
          </p>
        </aside>

        <div id="ref-results" ref="results" class="ref-main">
          <section
            v-for="group in groups" v-show="group.shown" :id="`cat-${group.key}`" :key="group.key"
            class="ref-group" :aria-labelledby="`cat-${group.key}-t`"
          >
            <header class="ref-group-head">
              <h2 :id="`cat-${group.key}-t`">{{ group.title[language] }}</h2>
              <span class="ref-group-n">{{ group.shown === group.entries.length ? group.entries.length : `${group.shown}/${group.entries.length}` }}</span>
              <p>{{ group.lede[language] }}</p>
            </header>
            <div class="ref-cards">
              <ReferenceCard
                v-for="entry in group.entries" v-show="isVisible(entry)" :key="entry.id"
                :entry="entry" :open="!!open[entry.id]" :terms="terms" @toggle="value => open[entry.id] = value"
              />
            </div>
          </section>
          <div v-if="!visible.length" class="ref-empty">
            <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="21" cy="21" r="12" /><path d="m30 30 9 9M16 21h10" /></svg>
            <p>{{ t('Ничего не нашлось. Сбросьте фильтр или измените запрос.', 'Nothing matches. Clear the filter or change the query.') }}</p>
            <button class="btn btn-ghost btn-s" type="button" @click="reset">{{ t('Сбросить', 'Reset') }}</button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
