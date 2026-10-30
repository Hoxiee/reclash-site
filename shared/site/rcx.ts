import catalogue from '../../content/rcx/catalogue.json' with { type: 'json' }

export const rcxLanguages = ['ru', 'en', 'zh-CN'] as const
export type RcxLanguage = typeof rcxLanguages[number]
export type RcxText = Record<RcxLanguage, string>
export type RcxPage = { slug: string, file: string, section: string, titles: RcxText, descriptions: RcxText }
export const rcxPages: RcxPage[] = catalogue.pages
export const rcxSource = catalogue.source
export const rcxLanguageNames: RcxText = { ru: 'Русский', en: 'English', 'zh-CN': '简体中文' }

export function rcxText(language: RcxLanguage, russian: string, english: string, chinese: string): string {
  return language === 'ru' ? russian : language === 'zh-CN' ? chinese : english
}

export function rcxLanguageFromPath(path: string): RcxLanguage {
  const language = path.split('/')[1]
  return rcxLanguages.find(item => item === language) ?? 'en'
}

export function rcxSlugFromPath(path: string): string {
  return path.replace(/\/+$/, '').replace(/\.html$/, '').split('/').slice(3).join('/')
}

export function rcxPagePath(language: RcxLanguage, slug = ''): string {
  return `/${language}/rcx${slug ? `/${slug}` : ''}`
}

export function rcxSourceUrl(language: RcxLanguage, file: string): string {
  return `${rcxSource.repository}/blob/${rcxSource.commit}/docs/${language}/auto-routing/${file}`
}

export const rcxRoutes = rcxLanguages.flatMap(language => rcxPages.map(page => rcxPagePath(language, page.slug)))

export const legacyRcxSections: Record<string, { slug: string, hash: string }> = {
  overview: { slug: '', hash: '#what-it-is' },
  profiles: { slug: 'profiles', hash: '' },
  scenarios: { slug: 'scenarios', hash: '' },
  evidence: { slug: 'engine', hash: '' },
  sharing: { slug: 'sharing', hash: '' },
  'source-docs': { slug: '', hash: '#documentation-map' },
}
