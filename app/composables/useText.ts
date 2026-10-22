import { languageFromPath } from '~~/shared/site/routes'

export function useText() {
  const route = useRoute()
  const language = computed(() => languageFromPath(route.path))
  const t = (russian: string, english: string) => language.value === 'ru' ? russian : english
  return { language, t }
}
