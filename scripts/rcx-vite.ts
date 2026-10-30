import { readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { compileDocument, contentRoot, readDocuments, searchIndex } from './rcx-content.mjs'

export function rcxDocumentation() {
  let library: ReturnType<typeof readDocuments> | undefined
  return {
    name: 'rcx-documentation',
    enforce: 'pre' as const,
    buildStart() { library = undefined },
    handleHotUpdate() { library = undefined },
    transform(_source: string, id: string) {
      const [file, query] = id.split('?')
      if (!file?.endsWith('.md') || !['rcx-doc', 'rcx-search'].includes(query ?? '')) return
      library ??= readDocuments()
      const key = relative(contentRoot, file).split(sep).join('/')
      const document = library.documents.get(key)
      if (!document) throw new Error(`Unknown RCX document: ${key}`)
      const catalogue = JSON.parse(readFileSync(join(contentRoot, 'catalogue.json'), 'utf8'))
      const data = query === 'rcx-search' ? searchIndex(library, document.language) : compileDocument(document, library, catalogue)
      return { code: `export default ${JSON.stringify(data)}`, map: null }
    },
  }
}
