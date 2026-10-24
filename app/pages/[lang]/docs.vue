<script setup lang="ts">
import { pagePath } from '~~/shared/site/routes'
import { docsSections } from '~~/shared/site/docs'
import '~/assets/css/docs.css'

usePageMeta('docs')
const { language, t } = useText()
const sections = computed(() => docsSections(language.value))
const active = ref(sections.value[0]!.id)
const pad = (index: number) => String(index + 1).padStart(2, '0')

// Scroll-spy: sections are contiguous, so the one crossing a thin line at 30% of the viewport
// is current. The hero is watched too, so jumping back to the top resets to the first section.
const root = useTemplateRef<HTMLElement>('root')
let observer: IntersectionObserver | undefined
onMounted(() => {
  if (!('IntersectionObserver' in window) || !root.value) return
  const hero = root.value.querySelector('.ph')
  observer = new IntersectionObserver((entries) => {
    const current = entries.filter(entry => entry.isIntersecting).at(-1)
    if (current) active.value = current.target === hero ? sections.value[0]!.id : current.target.id
  }, { rootMargin: '-30% 0px -69% 0px' })
  if (hero) observer.observe(hero)
  for (const section of root.value.querySelectorAll('.doc-sec')) observer.observe(section)
})
onBeforeUnmount(() => observer?.disconnect())

// In-page links scroll smoothly unless reduced motion is requested at that moment,
// then hand focus to the section heading for keyboard and screen-reader users.
function follow(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]')
  const id = link?.getAttribute('href')?.slice(1)
  const target = id ? document.getElementById(id) : null
  if (!target) return
  event.preventDefault()
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  history.replaceState(history.state, '', `#${id}`)
  target.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
  active.value = id!
}
</script>

<template>
  <div ref="root" class="doc-page">
    <PageHero
      :title="t('Документация по заголовкам', 'Header documentation')"
      :lede="t('Как ваша панель управляет оформлением клиента через обычные HTTP-заголовки ответа: механизм, правила разбора, совместимость, доставка через прокси и CDN, чеклист внедрения. Полный список заголовков — в справочнике.', 'How your panel drives the client\'s presentation through plain HTTP response headers: the mechanism, the parsing rules, compatibility, delivery through a proxy and a CDN, a rollout checklist. The full header list is in the reference.')"
      glyph="M150 150h100M150 190h100M150 230h56"
    >
      <template #eyebrow>{{ t('Для провайдеров', 'For providers') }}</template>
      <template #tags>
        <span class="tag">{{ t('Гайд', 'The guide') }}</span>
        <span class="tag">{{ t('3 слоя', '3 layers') }}</span>
        <span class="tag">{{ t('Доставка', 'Delivery') }}</span>
        <span class="tag">HWID</span>
        <SiteLink class="tag doc-tag-link" :to="pagePath(language, 'reference')">{{ t('Заголовки', 'Headers') }} <span aria-hidden="true">&rarr;</span></SiteLink>
        <SiteLink class="tag doc-tag-link" :to="pagePath(language, 'builder')">{{ t('Конструктор', 'Builder') }} <span aria-hidden="true">&rarr;</span></SiteLink>
      </template>
      <ProviderTabs page="docs" />
    </PageHero>

    <section class="sub-sec doc-main" :aria-label="t('Документация', 'Documentation')">
      <div class="wrap doc-grid" @click="follow">
        <aside class="doc-aside">
          <DocsToc :sections="sections" :active="active" />
        </aside>
        <article class="doc-body">
          <section v-for="(section, index) in sections" :id="section.id" :key="section.id" class="doc-sec">
            <header class="doc-sec-head">
              <span class="doc-sec-n" aria-hidden="true">{{ pad(index) }}</span>
              <h2 tabindex="-1">
                <span data-words>{{ section.title }}</span>
                <a class="doc-anchor" :href="`#${section.id}`" :aria-label="t(`Ссылка на раздел «${section.title}»`, `Link to “${section.title}”`)">#</a>
              </h2>
            </header>
            <div class="doc-flow">
              <DocsBlock v-for="(block, blockIndex) in section.blocks" :key="blockIndex" :block="block" data-fade />
            </div>
          </section>
          <nav class="doc-next" data-fade :aria-label="t('Дальше', 'Next')">
            <p class="doc-next-title">{{ t('Дальше', 'Next') }}</p>
            <div class="doc-next-links">
              <SiteLink class="doc-next-link" :to="pagePath(language, 'reference')">
                <b>{{ t('Справочник заголовков', 'Header reference') }}</b>
                <span>{{ t('Каждый заголовок: формат значения, псевдонимы и примеры.', 'Every header: value format, aliases and examples.') }}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13m0 0-5-5m5 5-5 5" /></svg>
              </SiteLink>
              <SiteLink class="doc-next-link" :to="pagePath(language, 'builder')">
                <b>{{ t('Конструктор', 'Builder') }}</b>
                <span>{{ t('Соберите заголовки, проверьте живое превью и возьмите фрагмент для nginx или Caddy.', 'Assemble the headers, check the live preview and take a snippet for nginx or Caddy.') }}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13m0 0-5-5m5 5-5 5" /></svg>
              </SiteLink>
            </div>
          </nav>
        </article>
      </div>
    </section>
  </div>
</template>
