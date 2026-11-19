import { pageLanguages, pagePath, privatePages, sitePages, type Language, type PageKey } from '~~/shared/site/routes'
import { ogImagePath, siteSummary } from '~~/shared/site/seo'
import { portedPages } from '~~/shared/site/content'

function structuredData(origin: string, language: Language, description: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite', '@id': `${origin}/#website`, url: origin, name: 'ReClash', inLanguage: ['ru', 'en', 'zh-CN'],
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
  const title = computed(() => {
    const names = sitePages.find(item => item.key === page)!.title as Record<string, string>
    return names[language.value] ?? names.en!
  })
  const entry = page in portedPages ? portedPages[page as keyof typeof portedPages] : undefined
  const localized = (field: 'title' | 'description') => entry ? ((entry[field] as Record<string, string>)[language.value] ?? entry[field].en) : undefined
  const content = entry
  useSeoMeta({
    title: () => localized('title') ?? `${title.value} — ReClash`,
    description: () => localized('description') ?? t('ReClash — клиент для управления подключениями.', 'ReClash — a client for managing connections.', 'ReClash — 连接管理客户端。'),
    ...(content ? {
      ogTitle: () => localized('title'),
      ogDescription: () => localized('description'),
      ogUrl: () => `${config.public.siteOrigin}${pagePath(language.value, page)}`,
      ogLocale: () => ({ ru: 'ru_RU', en: 'en_US', 'zh-CN': 'zh_CN' })[language.value],
      ogImage: () => `${config.public.siteOrigin}${ogImagePath}`,
      ogImageWidth: 1200,
      ogImageHeight: 630,
      ogImageAlt: () => t('ReClash — панель управления подключением', 'ReClash — the connection dashboard', 'ReClash — 连接仪表盘'),
      ogSiteName: 'ReClash',
      ogType: 'website',
      twitterCard: 'summary_large_image',
      twitterTitle: () => localized('title'),
      twitterDescription: () => localized('description'),
      twitterImage: () => `${config.public.siteOrigin}${ogImagePath}`,
      themeColor: '#FF7A2F',
    } : {}),
    robots: privatePages.includes(page) ? 'noindex, nofollow' : 'index, follow',
  })
  useHead(() => ({
    htmlAttrs: { lang: language.value },
    meta: [{ name: 'google-site-verification', content: 'IDIM6wK06j-4cmHguvqV6_J8C3CfJWjnh4hlyfS83dA' }],
    link: [
      { rel: 'canonical', href: `${config.public.siteOrigin}${pagePath(language.value, page)}` },
      ...pageLanguages(page).map(lang => ({ rel: 'alternate' as const, type: 'text/html', hreflang: lang, href: `${config.public.siteOrigin}${pagePath(lang, page)}` })),
      { rel: 'alternate' as const, type: 'text/html', hreflang: 'x-default', href: `${config.public.siteOrigin}${pagePath('en', page)}` },
    ],
    script: page === 'index' ? [{ type: 'application/ld+json', innerHTML: JSON.stringify(structuredData(config.public.siteOrigin, language.value, siteSummary[language.value])) }] : [],
  }))
  return { title }
}
