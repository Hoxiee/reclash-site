// Pure language data shared by routing, the language negotiation Function and the boot script.
export const languages = ['ru', 'en', 'zh-CN'] as const
export type Language = typeof languages[number]

// A language gets a page only after the page is translated; everywhere else the English page stands in.
// Documentation follows docs/manifest.json instead.
export const translatedPages: Record<Language, readonly string[]> = {
  ru: ['index', 'start', 'download', 'docs', 'reference', 'builder', 'mock-subs', 'motion'],
  en: ['index', 'start', 'download', 'docs', 'reference', 'builder', 'mock-subs', 'motion'],
  'zh-CN': ['index', 'start', 'download'],
}

// Tool pages (builder, reference, mock subscriptions) are not translated into Chinese yet.
export type ToolLanguage = Exclude<Language, 'zh-CN'>

export function isTranslated(language: Language, page: string): boolean {
  return translatedPages[language].includes(page)
}
