<script setup lang="ts">
import { pagePath } from '~~/shared/site/routes'
import { rcxSections } from '~~/shared/site/rcx'
import '~/assets/css/docs.css'

usePageMeta('rcx')
const { language, t } = useText()
const sections = computed(() => rcxSections(language.value))
const active = ref(sections.value[0]!.id)
const pad = (index: number) => String(index + 1).padStart(2, '0')
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
  <div ref="root" class="doc-page rcx-page">
    <PageHero
      :title="t('Автоматическая маршрутизация RCX', 'RCX automatic routing')"
      :lede="t('Как ReClash выбирает серверы по профилям и сценариям, направляет отдельный трафик маршрутами и показывает причину решения.', 'How ReClash selects servers with profiles and scenarios, routes selected traffic and explains each decision.')"
      glyph="M150 150h100M150 190h64m-64 40h100"
    >
      <template #eyebrow>{{ t('Документация', 'Documentation') }}</template>
      <template #tags>
        <span class="tag">RCX</span>
        <span class="tag">{{ t('Профили и сценарии', 'Profiles and scenarios') }}</span>
        <span class="tag">{{ t('Управление остаётся у вас', 'You stay in control') }}</span>
      </template>
    </PageHero>

    <section class="sub-sec doc-main" :aria-label="t('Документация RCX', 'RCX documentation')">
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
            <p class="doc-next-title">{{ t('Связанные страницы', 'Related pages') }}</p>
            <div class="doc-next-links">
              <SiteLink class="doc-next-link" :to="pagePath(language, 'start')">
                <b>{{ t('Быстрый старт', 'Quick start') }}</b>
                <span>{{ t('Установка, подключение и ответы на вопросы.', 'Install, connect and find answers to common questions.') }}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13m0 0-5-5m5 5-5 5" /></svg>
              </SiteLink>
              <SiteLink class="doc-next-link" :to="pagePath(language, 'docs')">
                <b>{{ t('Заголовки провайдера', 'Provider headers') }}</b>
                <span>{{ t('Метаданные подписки и оформление клиента.', 'Subscription metadata and client theming.') }}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13m0 0-5-5m5 5-5 5" /></svg>
              </SiteLink>
            </div>
          </nav>
        </article>
      </div>
    </section>
  </div>
</template>
