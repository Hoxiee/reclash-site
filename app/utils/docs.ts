import type { DocLanguage } from '~~/shared/docs/catalogue'
import type { DocDocument, DocSearchEntry } from '~~/shared/docs/types'

const documents = import.meta.glob<DocDocument>('../../content/docs/**/*.md', { query: '?doc', import: 'default' })
const searchIndexes = import.meta.glob<DocSearchEntry[]>('../../content/docs/*/README.md', { query: '?doc-search', import: 'default' })

export function docLoader(language: DocLanguage, file: string) {
  return documents[`../../content/docs/${language}/${file}`]
}

export function loadDocSearchIndex(language: DocLanguage) {
  return searchIndexes[`../../content/docs/${language}/README.md`]!()
}
