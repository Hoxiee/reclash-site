<script setup lang="ts">
import { pagePath } from '~~/shared/site/routes'
import { docPage, docPath, docSections, docText, type DocLanguage } from '~~/shared/docs/catalogue'
const props = defineProps<{ language: DocLanguage, slug: string, open?: boolean }>()
const emit = defineEmits<{ search: [], navigate: [] }>()
const t = (ru: string, en: string, zh?: string) => docText(props.language, ru, en, zh)
const site = props.language === 'zh-CN' ? 'en' : props.language
const sections = docSections.map(section => ({
  ...section,
  groups: section.groups.map(group => ({ title: group.title[props.language] ?? '', pages: group.pages.map(slug => docPage(slug)!) })),
}))
const tools = [
  { to: pagePath(site, 'reference'), label: t('Каталог заголовков', 'Header catalogue', '响应头目录') },
  { to: pagePath(site, 'builder'), label: t('Конструктор заголовков', 'Header builder', '响应头生成器') },
  { to: pagePath(site, 'mock-subs'), label: t('Тестовые подписки', 'Mock subscriptions', '模拟订阅') },
  { to: '/schemas/rcx-profile.schema.json', label: 'rcx-profile.schema.json' },
  { to: '/schemas/provider-policy.schema.json', label: 'provider-policy.schema.json' },
]
const current = (slug: string) => slug === props.slug ? 'page' : undefined
const within = (section: { slug: string }) => props.slug === section.slug || props.slug.startsWith(`${section.slug}/`)
const expanded = ref(new Set(sections.filter(within).map(section => section.id)))
const toggle = (id: string) => expanded.value.has(id) ? expanded.value.delete(id) : expanded.value.add(id)

const root = useTemplateRef<HTMLElement>('root')
function reveal(smooth: boolean) {
  const link = root.value?.querySelector<HTMLElement>('a[aria-current="page"]')
  const scroller = root.value?.closest<HTMLElement>('.hb-side')
  if (!link || !scroller) return
  const edge = 64
  const box = scroller.getBoundingClientRect(), item = link.getBoundingClientRect()
  const offset = item.top < box.top + edge ? item.top - box.top - edge : item.bottom > box.bottom - edge ? item.bottom - box.bottom + edge : 0
  if (!offset) return
  const still = !smooth || matchMedia('(prefers-reduced-motion: reduce)').matches
  scroller.scrollTo({ top: scroller.scrollTop + offset, behavior: still ? 'instant' : 'smooth' })
}
onMounted(() => reveal(false))
watch(() => props.slug, async () => {
  for (const section of sections) if (within(section)) expanded.value.add(section.id)
  await nextTick()
  reveal(true)
})
watch(() => props.open, open => { if (open) reveal(false) })
</script>

<template>
  <nav ref="root" class="hb-nav" :aria-label="t('Документация', 'Documentation', '文档')" @click="($event.target as Element).closest('a') && emit('navigate')">
    <button class="hb-search-trigger" type="button" @click="emit('search')">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
      <span>{{ t('Поиск', 'Search', '搜索') }}</span>
      <kbd aria-hidden="true">/</kbd>
    </button>
    <SiteLink class="hb-nav-home" :to="docPath(language)" :aria-current="current('')">{{ t('Обзор документации', 'Documentation overview', '文档概览') }}</SiteLink>
    <section v-for="section in sections" :key="section.id" class="hb-nav-section" :class="{ 'is-current': within(section) }">
      <h2 class="hb-nav-title">
        <button type="button" :aria-expanded="expanded.has(section.id)" :aria-controls="`hb-nav-${section.id}`" @click="toggle(section.id)">
          {{ section.title[language] }}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
        </button>
      </h2>
      <div :id="`hb-nav-${section.id}`" class="hb-nav-body" :hidden="!expanded.has(section.id)">
        <div v-for="(group, index) in section.groups" :key="index" class="hb-nav-group">
          <p v-if="group.title" class="hb-nav-label">{{ group.title }}</p>
          <ul>
            <li v-for="page in group.pages" :key="page.slug">
              <SiteLink :to="docPath(language, page.slug)" :aria-current="current(page.slug)">{{ page.titles[language] }}</SiteLink>
            </li>
          </ul>
        </div>
      </div>
    </section>
    <section class="hb-nav-section hb-nav-tools">
      <h2 class="hb-nav-title">
        <button type="button" :aria-expanded="expanded.has('tools')" aria-controls="hb-nav-tools" @click="toggle('tools')">
          {{ t('Инструменты', 'Tools', '工具') }}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
        </button>
      </h2>
      <ul id="hb-nav-tools" class="hb-nav-body" :hidden="!expanded.has('tools')">
        <li v-for="tool in tools" :key="tool.to"><a v-if="tool.to.startsWith('/schemas/')" class="is-mono" :href="tool.to">{{ tool.label }}</a><SiteLink v-else :to="tool.to">{{ tool.label }}</SiteLink></li>
      </ul>
    </section>
  </nav>
</template>
