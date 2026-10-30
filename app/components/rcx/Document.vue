<script setup lang="ts">
import { legacyRcxSections, rcxLanguageFromPath, rcxLanguages, rcxPagePath, rcxPages, rcxSlugFromPath, rcxSource, rcxSourceUrl, rcxText } from '~~/shared/site/rcx'
import { rcxDocumentLoader } from '~/utils/rcx'
import '~/assets/css/docs.css'
import '~/assets/css/rcx.css'

const route = useRoute()
const router = useRouter()
const language = rcxLanguageFromPath(route.path)
const slug = rcxSlugFromPath(route.path)
const page = rcxPages.find(item => item.slug === slug)
if (!page) throw createError({ statusCode: 404, statusMessage: 'RCX document not found' })
const loader = rcxDocumentLoader(language, page.file)
if (!loader) throw createError({ statusCode: 404, statusMessage: 'RCX translation not found' })
const { data, error } = await useAsyncData(`rcx:${language}:${slug}`, loader)
if (error.value || !data.value) throw createError({ statusCode: 500, statusMessage: 'RCX document could not load', cause: error.value })
const document = computed(() => data.value!)
const t = (ru: string, en: string, zh: string) => rcxText(language, ru, en, zh)
const title = slug ? page.titles[language] : t('Автоматическая маршрутизация RCX', 'RCX automatic routing', 'RCX 自动路由')
const headings = computed(() => document.value.headings.filter(heading => heading.level > 1 && heading.level <= 3))
const active = ref(headings.value[0]?.id ?? '')
const root = useTemplateRef<HTMLElement>('root')
const position = rcxPages.indexOf(page)
const previous = rcxPages[position - 1]
const next = rcxPages[position + 1]
const origin = useRuntimeConfig().public.siteOrigin
const canonical = `${origin}${rcxPagePath(language, slug)}`

useSeoMeta({
  title: `${title} — ReClash`, description: page.descriptions[language],
  ogTitle: `${title} — ReClash`, ogDescription: page.descriptions[language], ogUrl: canonical,
  ogLocale: { ru: 'ru_RU', en: 'en_US', 'zh-CN': 'zh_CN' }[language],
  ogImage: `${origin}/assets/img/og.png`, robots: 'index, follow',
})
useHead({
  htmlAttrs: { lang: language },
  link: [
    { rel: 'canonical', href: canonical },
    ...rcxLanguages.map(locale => ({ rel: 'alternate' as const, type: 'text/html', hreflang: locale, href: `${origin}${rcxPagePath(locale, slug)}` })),
  ],
})

let observer: IntersectionObserver | undefined
onMounted(async () => {
  const old = !slug ? legacyRcxSections[route.hash.slice(1)] : undefined
  if (old) {
    await router.replace({ path: rcxPagePath(language, old.slug), query: route.query, hash: old.hash })
    if (old.slug) return
  }
  if (!root.value) return
  if (route.hash) {
    const id = decodeURIComponent(route.hash.slice(1))
    const heading = document.value.headings.find(item => item.id === id || item.aliases.includes(id))
    active.value = heading?.id ?? id
    if (heading && heading.id !== id) await router.replace({ path: rcxPagePath(language, slug), query: route.query, hash: `#${heading.id}` })
  }
  if (!root.value || !('IntersectionObserver' in window)) return
  observer = new IntersectionObserver(entries => {
    const current = entries.filter(entry => entry.isIntersecting).at(-1)
    if (current) active.value = current.target.id
  }, { rootMargin: '-110px 0px -55% 0px' })
  for (const heading of root.value.querySelectorAll('.rcx-heading')) observer.observe(heading)
})
onBeforeUnmount(() => observer?.disconnect())

function openNavigation(event: Event) {
  const details = event.target as HTMLDetailsElement
  const navigation = details.parentElement
  if (!details.open || !navigation || !window.matchMedia('(max-width: 800px)').matches) return
  if (navigation.getBoundingClientRect().top <= 110) return
  navigation.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
}

async function follow(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]')
  const hash = link?.getAttribute('href')
  if (!hash || hash === '#') return
  const target = window.document.getElementById(decodeURIComponent(hash.slice(1)))
  if (!target) return
  event.preventDefault()
  link?.closest('details')?.removeAttribute('open')
  await router.push({ path: rcxPagePath(language, slug), query: route.query, hash })
  target.focus({ preventScroll: true })
  active.value = target.id
}
</script>

<template>
  <div id="top" ref="root" class="rcx-page" tabindex="-1" @click="follow">
    <PageHero :id="document.headings[0]?.id" :title="title" :lede="page.descriptions[language]" glyph="M150 150h100M150 190h64m-64 40h100">
      <template #eyebrow><SiteLink :to="rcxPagePath(language)">{{ t('Руководство RCX', 'RCX handbook', 'RCX 手册') }}</SiteLink></template>
      <template #tags><span class="tag">RCX 1</span><span class="tag">{{ t('Автоматическая маршрутизация', 'Automatic routing', '自动路由') }}</span></template>
    </PageHero>
    <span v-for="alias in document.headings[0]?.aliases" :id="alias" :key="alias" class="rcx-anchor-alias" aria-hidden="true" />

    <div class="wrap">
      <div class="rcx-tools" data-fade>
        <RcxSearch :language="language" />
        <a class="rcx-source tlink" :href="rcxSourceUrl(language, page.file)" target="_blank" rel="noopener noreferrer">
          <span>{{ t('Исходник в ReClash', 'Source in ReClash', 'ReClash 文档源文件') }}<span class="rcx-revision">{{ rcxSource.commit.slice(0, 8) }}</span></span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg>
        </a>
      </div>
    </div>

    <div class="wrap rcx-layout">
      <aside class="rcx-sidebar"><RcxNavigation :language="language" :slug="slug" /></aside>
      <div class="rcx-mobile-navigation">
        <details class="acc-item" name="rcx-navigation" @toggle="openNavigation">
          <summary class="acc-btn"><span>{{ t('Разделы', 'Chapters', '章节') }}</span><span class="pm" aria-hidden="true" /></summary>
          <div class="rcx-mobile-panel"><RcxNavigation :language="language" :slug="slug" /></div>
        </details>
        <details v-if="headings.length" class="acc-item" name="rcx-navigation" @toggle="openNavigation">
          <summary class="acc-btn"><span>{{ t('На странице', 'On this page', '本页目录') }}</span><span class="pm" aria-hidden="true" /></summary>
          <div class="rcx-mobile-panel"><RcxContents :language="language" :headings="headings" :active="active" /></div>
        </details>
      </div>
      <article class="rcx-article doc-body" :aria-label="title">
        <RcxBlocks :blocks="document.blocks" :language="language" reveal />
        <nav class="rcx-pagination doc-next" :aria-label="t('Предыдущая и следующая страницы', 'Previous and next pages', '上一页和下一页')" data-fade>
          <p class="doc-next-title">{{ t('Продолжить чтение', 'Keep reading', '继续阅读') }}</p>
          <div class="doc-next-links">
            <SiteLink v-if="previous" class="doc-next-link rcx-previous" :to="rcxPagePath(language, previous.slug)">
              <span>{{ t('Предыдущая глава', 'Previous chapter', '上一章') }}</span><b>{{ previous.titles[language] }}</b>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7" /></svg>
            </SiteLink>
            <SiteLink v-if="next" class="doc-next-link rcx-next" :to="rcxPagePath(language, next.slug)">
              <span>{{ t('Следующая глава', 'Next chapter', '下一章') }}</span><b>{{ next.titles[language] }}</b>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
            </SiteLink>
          </div>
        </nav>
      </article>
      <aside v-if="headings.length" class="rcx-outline">
        <RcxContents :language="language" :headings="headings" :active="active" />
        <a class="rcx-to-top tlink" href="#top">{{ t('К началу страницы', 'Back to top', '返回顶部') }}<span aria-hidden="true">↑</span></a>
      </aside>
    </div>
  </div>
</template>
