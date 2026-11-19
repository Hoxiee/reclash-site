import { languageFromPath, type ToolLanguage } from '~~/shared/site/routes'

export function useText() {
  const route = useRoute()
  const language = computed(() => languageFromPath(route.path))
  // Chinese is optional: a string without a translation reads in English.
  const t = (russian: string, english: string, chinese = english) =>
    language.value === 'ru' ? russian : language.value === 'zh-CN' ? chinese : english
  return { language, t }
}

// Pages without a Chinese translation render in English there, so their code only ever sees ru or en.
export function useToolText() {
  const { language, t } = useText()
  const toolLanguage = computed<ToolLanguage>(() => language.value === 'ru' ? 'ru' : 'en')
  return { language: toolLanguage, t: (russian: string, english: string) => t(russian, english) }
}
