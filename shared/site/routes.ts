import { docLanguageFromPath, docRoutes } from '../docs/catalogue.ts'
import { isTranslated, languages, type Language, type ToolLanguage } from './languages.ts'

export { isTranslated, languages, translatedPages, type Language, type ToolLanguage } from './languages.ts'
export type BilingualText = Record<ToolLanguage, string> & { 'zh-CN'?: string }

export const sitePages = [
  { key: 'index', title: { ru: 'Главная', en: 'Home', 'zh-CN': '首页' } },
  { key: 'start', title: { ru: 'Начало работы', en: 'Quick start', 'zh-CN': '快速开始' } },
  { key: 'download', title: { ru: 'Скачать', en: 'Download', 'zh-CN': '下载' } },
  { key: 'docs', title: { ru: 'Документация', en: 'Documentation', 'zh-CN': '文档' } },
  { key: 'reference', title: { ru: 'Справочник', en: 'Reference' } },
  { key: 'builder', title: { ru: 'Конструктор', en: 'Builder' } },
  { key: 'mock-subs', title: { ru: 'Примеры подписок', en: 'Mock subscriptions' } },
  { key: 'motion', title: { ru: 'Лаборатория движения', en: 'Motion laboratory' } },
] as const satisfies ReadonlyArray<{ key: string, title: BilingualText }>

export type PageKey = typeof sitePages[number]['key']
export const privatePages: ReadonlyArray<PageKey> = ['mock-subs', 'motion']

export function pagePath(language: Language, page: PageKey = 'index'): string {
  const target = isTranslated(language, page) ? language : 'en'
  return page === 'index' ? `/${target}` : `/${target}/${page}`
}

export function pageLanguages(page: PageKey): Language[] {
  return languages.filter(language => isTranslated(language, page))
}

export function legacyPath(language: Language, page: PageKey = 'index'): string {
  return `/${language}/${page}.html`
}

export function languageFromPath(path: string): Language {
  return /^\/zh-CN(?:\/|$)/.test(path) ? 'zh-CN' : /^\/en(?:\/|$)/.test(path) ? 'en' : 'ru'
}

export function pageFromPath(path: string): PageKey {
  const key = (path.split('/')[2] || 'index').replace(/\.html$/, '')
  return sitePages.find(page => page.key === key)?.key || 'index'
}

export function pageKeyFromPath(path: string): string {
  const page = pageFromPath(path)
  return page === 'docs'
    ? `${docLanguageFromPath(path)}/docs`
    : `${languageFromPath(path)}/${page}`
}

export function switchLanguage(fullPath: string, language: Language): string {
  return fullPath.replace(/^\/(?:ru|en|zh-CN)(?=\/|\?|#|$)/, `/${language}`)
}

export const prerenderRoutes = [...new Set(['/', ...languages.flatMap(language => sitePages.filter(page => isTranslated(language, page.key)).map(page => pagePath(language, page.key))), ...docRoutes])]
