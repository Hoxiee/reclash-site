import catalogue from '../../content/docs/catalogue.json' with { type: 'json' }

export type DocLanguage = 'ru' | 'en' | 'zh-CN'
export type DocText = Partial<Record<DocLanguage, string>>
export type DocPage = { slug: string, file: string, section: string, titles: DocText, descriptions: DocText, minutes: Partial<Record<DocLanguage, number>> }
export type DocGroup = { title: DocText, pages: string[] }
export type DocSection = { id: string, slug: string, title: DocText, groups: DocGroup[] }

export const docLanguages = catalogue.languages as DocLanguage[]
export const docPages = catalogue.pages as DocPage[]
export const docSections = catalogue.sections as DocSection[]
export const docSource = catalogue.source
export const docLanguageNames: Record<DocLanguage, string> = { ru: 'Русский', en: 'English', 'zh-CN': '简体中文' }

export function docText(language: DocLanguage, russian: string, english: string, chinese = english): string {
  return language === 'ru' ? russian : language === 'zh-CN' ? chinese : english
}

export function docPath(language: DocLanguage, slug = ''): string {
  return `/${language}/docs${slug ? `/${slug}` : ''}`
}

export function docLanguageFromPath(path: string): DocLanguage {
  const language = path.split('/')[1]
  return docLanguages.find(item => item === language) ?? 'en'
}

export function docSlugFromPath(path: string): string {
  return path.replace(/[?#].*$/, '').replace(/\/+$/, '').replace(/\.html$/, '').split('/').slice(3).join('/')
}

export const docPage = (slug: string): DocPage | undefined => docPages.find(page => page.slug === slug)
export const docSection = (id: string): DocSection | undefined => docSections.find(section => section.id === id)

export function docGroupOf(page: DocPage): DocGroup | undefined {
  return docSection(page.section)?.groups.find(group => group.pages.includes(page.slug))
}

export function docNeighbours(page: DocPage): { previous?: DocPage, next?: DocPage } {
  const index = docPages.indexOf(page)
  return { previous: docPages[index - 1], next: docPages[index + 1] }
}

export function docSourceUrl(language: DocLanguage, file: string): string {
  return `${docSource.repository}/blob/${docSource.commit}/docs/${language}/${file}`
}

export function docEditUrl(language: DocLanguage, file: string): string {
  return `${docSource.repository}/edit/dev/docs/${language}/${file}`
}

export const docRoutes = docLanguages.flatMap(language => docPages.map(page => docPath(language, page.slug)))

// Fragments of the retired single-page provider guide and RCX hub, mapped to their new pages.
export const legacyDocFragments: Record<string, string> = {
  overview: 'providers',
  rules: 'providers/headers',
  compat: 'providers',
  delivery: 'providers/rollout',
  policy: 'providers/policy',
  hwid: 'providers/request',
  checklist: 'providers/rollout',
}
export const legacyRcxFragments: Record<string, string> = {
  overview: 'rcx',
  profiles: 'rcx/profiles',
  scenarios: 'rcx/scenarios',
  evidence: 'rcx/engine',
  sharing: 'rcx/sharing',
  'source-docs': 'rcx',
}
