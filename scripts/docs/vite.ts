import { readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { compileDocument, contentRoot, readLibrary, searchIndex } from './engine.mjs'

export function documentation() {
  let library: ReturnType<typeof readLibrary> | undefined
  return {
    name: 'documentation',
    enforce: 'pre' as const,
    buildStart() { library = undefined },
    handleHotUpdate() { library = undefined },
    transform(_source: string, id: string) {
      const [file, query] = id.split('?')
      if (!file?.endsWith('.md') || !['doc', 'doc-search'].includes(query ?? '')) return
      library ??= readLibrary()
      const [language, ...parts] = relative(contentRoot, file).split(sep)
      const document = library.documents.get(`${language}/${parts.join('/')}`)
      if (!document) throw new Error(`Unknown document: ${relative(contentRoot, file)}`)
      const catalogue = JSON.parse(readFileSync(join(contentRoot, 'catalogue.json'), 'utf8'))
      const data = query === 'doc-search' ? searchIndex(library, document.language) : compileDocument(document, library, catalogue)
      return { code: `export default ${JSON.stringify(data)}`, map: null }
    },
  }
}
