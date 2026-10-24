import { languages, pagePath, privatePages, sitePages, type PageKey } from '~~/shared/site/routes'
import { portedPages } from '~~/shared/site/content'

export function usePageMeta(page: PageKey) {
  const { language, t } = useText()
  const config = useRuntimeConfig()
  const title = computed(() => sitePages.find(item => item.key === page)!.title[language.value])
  const content = page in portedPages ? portedPages[page as keyof typeof portedPages] : undefined
  useSeoMeta({
    title: () => content?.title[language.value] ?? `${title.value} — ReClash`,
    description: () => content?.description[language.value] ?? t('ReClash — клиент для управления подключениями.', 'ReClash — a client for managing connections.'),
    ...(content ? {
      ogTitle: () => content.title[language.value],
      ogDescription: () => content.description[language.value],
      ogUrl: () => `${config.public.siteOrigin}${pagePath(language.value, page)}`,
      ogLocale: () => language.value === 'ru' ? 'ru_RU' : 'en_US',
      ogImage: () => `${config.public.siteOrigin}/assets/img/og.png`,
      themeColor: '#FF7A2F',
    } : {}),
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
