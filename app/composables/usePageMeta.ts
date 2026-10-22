import { languages, pagePath, privatePages, sitePages, type PageKey } from '~~/shared/site/routes'

export function usePageMeta(page: PageKey) {
  const { language, t } = useText()
  const config = useRuntimeConfig()
  const title = computed(() => sitePages.find(item => item.key === page)!.title[language.value])
  useSeoMeta({
    title: () => `${title.value} — ReClash`,
    description: () => t('ReClash — клиент для управления подключениями.', 'ReClash — a client for managing connections.'),
    robots: privatePages.includes(page) ? 'noindex, nofollow' : 'index, follow',
  })
  useHead(() => ({
    htmlAttrs: { lang: language.value },
    link: [
      { rel: 'canonical', href: `${config.public.siteOrigin}${pagePath(language.value, page)}` },
      ...languages.map(lang => ({ rel: 'alternate' as const, type: 'text/html', hreflang: lang, href: `${config.public.siteOrigin}${pagePath(lang, page)}` })),
    ],
  }))
  return { title }
}
