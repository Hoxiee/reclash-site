import { languages, pagePath, privatePages, sitePages, type PageKey } from '~~/shared/site/routes'
import { ogImagePath, siteSummary } from '~~/shared/site/seo'
import { portedPages } from '~~/shared/site/content'

function structuredData(origin: string, language: 'ru' | 'en', description: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite', '@id': `${origin}/#website`, url: origin, name: 'ReClash', inLanguage: ['ru', 'en'],
      },
      {
        '@type': 'SoftwareApplication', '@id': `${origin}/#app`, name: 'ReClash', description, inLanguage: language,
        applicationCategory: 'UtilitiesApplication', operatingSystem: 'Windows, macOS, Linux, Android',
        url: `${origin}/${language}`, downloadUrl: `${origin}/${language}/download`,
        image: `${origin}${ogImagePath}`, license: 'https://www.gnu.org/licenses/gpl-3.0.html',
        codeRepository: 'https://github.com/Hoxiee/ReClash', sameAs: ['https://github.com/Hoxiee/ReClash'],
        isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
    ],
  }
}

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
      ogImage: () => `${config.public.siteOrigin}${ogImagePath}`,
      ogImageWidth: 1200,
      ogImageHeight: 630,
      ogImageAlt: () => t('ReClash — панель управления подключением', 'ReClash — the connection dashboard'),
      ogSiteName: 'ReClash',
      ogType: 'website',
      twitterCard: 'summary_large_image',
      twitterTitle: () => content.title[language.value],
      twitterDescription: () => content.description[language.value],
      twitterImage: () => `${config.public.siteOrigin}${ogImagePath}`,
      themeColor: '#FF7A2F',
    } : {}),
    robots: privatePages.includes(page) ? 'noindex, nofollow' : 'index, follow',
  })
  useHead(() => ({
    htmlAttrs: { lang: language.value },
    link: [
      { rel: 'canonical', href: `${config.public.siteOrigin}${pagePath(language.value, page)}` },
      ...languages.map(lang => ({ rel: 'alternate' as const, type: 'text/html', hreflang: lang, href: `${config.public.siteOrigin}${pagePath(lang, page)}` })),
      { rel: 'alternate' as const, type: 'text/html', hreflang: 'x-default', href: `${config.public.siteOrigin}${pagePath('en', page)}` },
    ],
    script: page === 'index' ? [{ type: 'application/ld+json', innerHTML: JSON.stringify(structuredData(config.public.siteOrigin, language.value, siteSummary[language.value])) }] : [],
  }))
  return { title }
}
