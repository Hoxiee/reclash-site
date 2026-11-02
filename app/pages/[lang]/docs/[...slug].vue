<script setup lang="ts">
import {
  docEditUrl, docGroupOf, docLanguageFromPath, docLanguages, docNeighbours, docPage, docPath, docSection, docSlugFromPath,
  docSource, docSourceUrl, docText, legacyDocFragments, legacyRcxFragments,
} from '~~/shared/docs/catalogue'
import { docLoader } from '~/utils/docs'

const route = useRoute()
const router = useRouter()
const language = docLanguageFromPath(route.path)
const slug = docSlugFromPath(route.path)
const page = docPage(slug)
if (!page) throw createError({ statusCode: 404, statusMessage: 'Document not found' })
const loader = docLoader(language, page.file)
if (!loader) throw createError({ statusCode: 404, statusMessage: 'Translation not found' })
const { data, error } = await useAsyncData(`doc:${language}:${slug}`, loader)
if (error.value || !data.value) throw createError({ statusCode: 500, statusMessage: 'Document could not load', cause: error.value })
const document = computed(() => data.value!)
const t = (ru: string, en: string, zh?: string) => docText(language, ru, en, zh)

const section = page.section ? docSection(page.section) : undefined
const group = docGroupOf(page)
const { previous, next } = docNeighbours(page)
const title = page.titles[language]!
const outline = computed(() => document.value.headings.filter(heading => heading.level === 2 || heading.level === 3))
const active = ref(outline.value[0]?.id ?? '')
const articleRoot = useTemplateRef<HTMLElement>('article')

const origin = useRuntimeConfig().public.siteOrigin
const canonical = `${origin}${docPath(language, slug)}`
const fullTitle = slug ? `${title} — ${section ? `${section.title[language]} — ` : ''}ReClash` : `${t('Документация', 'Documentation', '文档')} — ReClash`
useSeoMeta({
  title: fullTitle, description: page.descriptions[language],
  ogTitle: fullTitle, ogDescription: page.descriptions[language], ogUrl: canonical, ogType: 'article',
  ogLocale: { ru: 'ru_RU', en: 'en_US', 'zh-CN': 'zh_CN' }[language],
  ogImage: `${origin}/assets/img/og.png`, robots: 'index, follow',
})
useHead({
  htmlAttrs: { lang: language },
  link: [
    { rel: 'canonical', href: canonical },
    ...docLanguages.map(locale => ({ rel: 'alternate' as const, type: 'text/html', hreflang: locale, href: `${origin}${docPath(locale, slug)}` })),
  ],
})

let frame = 0
function spy() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => {
    const line = Math.max(Number.parseFloat(getComputedStyle(articleRoot.value!).getPropertyValue('--hb-top')) + 48, 144)
    const headings = articleRoot.value!.querySelectorAll<HTMLElement>('.hb-h[data-level="2"], .hb-h[data-level="3"]')
    let current = outline.value[0]?.id ?? ''
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top > line) break
      current = heading.id
    }
    active.value = current
  })
}
onMounted(async () => {
  const fragment = decodeURIComponent(route.hash.slice(1))
  const legacy = slug === '' ? legacyDocFragments[fragment] : slug === 'rcx' ? legacyRcxFragments[fragment] : undefined
  if (legacy && legacy !== slug) {
    await router.replace({ path: docPath(language, legacy), query: route.query })
    return
  }
  const alias = document.value.headings.find(heading => heading.aliases.includes(fragment))
  if (alias) await router.replace({ path: docPath(language, slug), query: route.query, hash: `#${alias.id}` })
  window.addEventListener('scroll', spy, { passive: true })
  spy()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', spy)
  cancelAnimationFrame(frame)
})
</script>

<template>
  <div class="hb-reader">
    <article ref="article" class="hb-article" :aria-labelledby="document.headings[0]?.id">
      <header class="hb-head">
        <nav class="hb-crumbs" :aria-label="t('Путь', 'Breadcrumb', '路径')">
          <SiteLink :to="docPath(language)">{{ t('Документация', 'Documentation', '文档') }}</SiteLink>
          <template v-if="section && slug !== section.slug"><span aria-hidden="true">/</span><SiteLink :to="docPath(language, section.slug)">{{ section.title[language] }}</SiteLink></template>
          <span v-if="group?.title[language]" class="hb-crumb-group"><span aria-hidden="true">/</span><span>{{ group.title[language] }}</span></span>
        </nav>
        <span v-for="alias in document.headings[0]?.aliases" :id="alias" :key="alias" class="hb-alias" aria-hidden="true" />
        <h1 :id="document.headings[0]?.id">{{ title }}</h1>
        <p v-if="document.lede.length" class="hb-lede"><DocsInline :nodes="document.lede" /></p>
        <div v-if="slug" class="hb-meta">
          <span>{{ t(`${page.minutes[language]} мин чтения`, `${page.minutes[language]} min read`, `约 ${page.minutes[language]} 分钟`) }}</span>
          <a :href="docSourceUrl(language, page.file)" target="_blank" rel="noopener noreferrer">{{ t('Исходник', 'Source', '源文件') }} <code>{{ docSource.commit.slice(0, 7) }}</code></a>
          <a :href="docEditUrl(language, page.file)" target="_blank" rel="noopener noreferrer">{{ t('Предложить правку', 'Suggest an edit', '建议修改') }}</a>
        </div>
      </header>

      <details v-if="outline.length > 2" class="hb-outline-inline">
        <summary>{{ t('На этой странице', 'On this page', '本页内容') }}<span aria-hidden="true">{{ outline.length }}</span></summary>
        <DocsOutline :language="language" :headings="outline" :active="active" />
      </details>

      <DocsHome v-if="!slug" :language="language" />
      <div class="hb-prose"><DocsBlocks :blocks="document.blocks" :language="language" /></div>
      <DocsPager :language="language" :previous="previous" :next="next" />
    </article>

    <aside class="hb-toc">
      <template v-if="outline.length">
        <DocsOutline :language="language" :headings="outline" :active="active" />
        <a class="hb-top" href="#top">{{ t('Наверх', 'Back to top', '返回顶部') }}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6" /></svg></a>
      </template>
    </aside>
  </div>
</template>
