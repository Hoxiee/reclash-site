import type { RcxLanguage } from '~~/shared/site/rcx'
import type { RcxDocument, RcxSearchEntry } from '~~/shared/site/rcx-document'

const documents = import.meta.glob<RcxDocument>('../../content/rcx/**/*.md', { query: '?rcx-doc', import: 'default' })
const searchIndexes = import.meta.glob<RcxSearchEntry[]>('../../content/rcx/*/README.md', { query: '?rcx-search', import: 'default' })

export function rcxDocumentLoader(language: RcxLanguage, file: string) {
  return documents[`../../content/rcx/${language}/${file}`]
}

export function loadRcxSearchIndex(language: RcxLanguage) {
  return searchIndexes[`../../content/rcx/${language}/README.md`]!()
}
