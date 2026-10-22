export const languages = ['ru', 'en'] as const
export type Language = typeof languages[number]
export type BilingualText = Record<Language, string>

export const sitePages = [
  { key: 'index', title: { ru: 'Главная', en: 'Home' } },
  { key: 'start', title: { ru: 'Начало работы', en: 'Quick start' } },
  { key: 'download', title: { ru: 'Скачать', en: 'Download' } },
  { key: 'docs', title: { ru: 'Документация', en: 'Documentation' } },
  { key: 'reference', title: { ru: 'Справочник', en: 'Reference' } },
  { key: 'builder', title: { ru: 'Конструктор', en: 'Builder' } },
  { key: 'mock-subs', title: { ru: 'Примеры подписок', en: 'Mock subscriptions' } },
  { key: 'report', title: { ru: 'Отчёт', en: 'Report' } },
  { key: 'gallery', title: { ru: 'Галерея', en: 'Gallery' } },
  { key: 'motion', title: { ru: 'Лаборатория движения', en: 'Motion laboratory' } },
] as const satisfies ReadonlyArray<{ key: string, title: BilingualText }>

export type PageKey = typeof sitePages[number]['key']
export const privatePages: ReadonlyArray<PageKey> = ['report', 'mock-subs', 'motion']

export function pagePath(language: Language, page: PageKey = 'index'): string {
  return page === 'index' ? `/${language}` : `/${language}/${page}`
}

export function legacyPath(language: Language, page: PageKey = 'index'): string {
  return `/${language}/${page}.html`
}

export function languageFromPath(path: string): Language {
  return /^\/en(?:\/|$)/.test(path) ? 'en' : 'ru'
}

export function pageFromPath(path: string): PageKey {
  const key = (path.split('/')[2] || 'index').replace(/\.html$/, '')
  return sitePages.find(page => page.key === key)?.key || 'index'
}

export function switchLanguage(fullPath: string, language: Language): string {
  return fullPath.replace(/^\/(?:ru|en)(?=\/|\?|#|$)/, `/${language}`)
}

export function isReportPath(path: string): boolean {
  return /^\/(?:ru|en)\/report(?:\.html)?\/?(?:[?#]|$)/.test(path)
}

export const prerenderRoutes = ['/', ...languages.flatMap(language => sitePages.map(page => pagePath(language, page.key)))]
