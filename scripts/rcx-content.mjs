import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'

export const siteRoot = fileURLToPath(new URL('../', import.meta.url))
export const contentRoot = join(siteRoot, 'content/rcx')
export const rcxLanguages = ['ru', 'en', 'zh-CN']
export const sourceRepository = 'https://github.com/Hoxiee/ReClash'
const order = ['README.md', 'engine.md', 'profiles.md', 'conditions.md', 'scenarios.md', 'sharing.md', 'cookbook.md', 'editor/README.md', 'editor/hub.md', 'editor/routes.md', 'editor/groups.md', 'editor/studio.md', 'editor/sharing.md', 'editor/troubleshooting.md', 'images/README.md']

export const digest = text => createHash('sha256').update(text).digest('hex')
export const documentSlug = file => file === 'README.md' ? '' : file === 'images/README.md' ? 'screenshots' : file.replace(/(?:\/README)?\.md$/, '')
export const documentPath = (language, file) => `/${language}/rcx${documentSlug(file) ? `/${documentSlug(file)}` : ''}`
export const diagramName = (language, file, index) => `${language}/${documentSlug(file).replaceAll('/', '-') || 'overview'}-${index}.svg`
export const diagramPath = (language, file, index) => `/assets/rcx/diagrams/${diagramName(language, file, index)}`

export function markdownFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? markdownFiles(join(root, entry.name)).map(file => `${entry.name}/${file}`)
    : entry.isFile() && entry.name.endsWith('.md') ? [entry.name] : []).sort()
}

function decode(text) {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
  return text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (raw, key) => {
    if (!key.startsWith('#')) return entities[key.toLowerCase()] ?? raw
    const value = key[1].toLowerCase() === 'x' ? Number.parseInt(key.slice(2), 16) : Number(key.slice(1))
    return value > 0 && value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff) ? String.fromCodePoint(value) : raw
  })
}

export function plain(tokens) {
  return tokens.map(token => token.type === 'br' ? ' ' : token.tokens ? plain(token.tokens) : decode(token.text ?? '')).join('').replace(/\s+/g, ' ').trim()
}

function headingIds(tokens) {
  const used = new Map()
  return tokens.filter(token => token.type === 'heading').map(token => {
    const title = plain(token.tokens)
    const base = title.toLowerCase().replace(/[^\p{L}\p{N}\p{M}_\s-]/gu, '').replace(/\s/g, '-')
    const count = used.get(base) ?? 0
    used.set(base, count + 1)
    return { level: token.depth, title, id: `${base}${count ? `-${count}` : ''}` }
  })
}

export function readDocuments(root = contentRoot, sourceLayout = false) {
  const directory = language => join(root, language, sourceLayout ? 'auto-routing' : '')
  const files = markdownFiles(directory('en')).sort((a, b) => {
    const rank = file => order.includes(file) ? order.indexOf(file) : order.length
    return rank(a) - rank(b) || a.localeCompare(b)
  })
  const documents = new Map()
  for (const language of rcxLanguages) {
    const translated = markdownFiles(directory(language))
    if (translated.join('\n') !== [...files].sort().join('\n')) throw new Error(`${language}: incomplete RCX documentation`)
    for (const file of files) {
      const source = readFileSync(join(directory(language), file), 'utf8')
      if (!source || source.length > 1024 * 1024) throw new Error(`${language}/${file}: invalid document size`)
      const tokens = marked.lexer(source, { gfm: true })
      const headings = headingIds(tokens)
      if (headings[0]?.level !== 1 || headings.filter(heading => heading.level === 1).length !== 1) throw new Error(`${language}/${file}: expected one document title`)
      documents.set(`${language}/${file}`, { language, file, source, tokens, headings })
    }
  }
  for (const document of documents.values()) {
    const english = documents.get(`en/${document.file}`)
    if (document.headings.map(heading => heading.level).join() !== english.headings.map(heading => heading.level).join()) throw new Error(`${document.language}/${document.file}: translated heading structure differs`)
    document.headings = document.headings.map((heading, index) => ({ ...heading, id: english.headings[index].id, aliases: heading.id === english.headings[index].id ? [] : [heading.id] }))
  }
  return { files, documents }
}

export function makeCatalogue(library, commit) {
  return {
    source: { repository: sourceRepository, commit },
    pages: library.files.map(file => ({
      file,
      slug: documentSlug(file),
      section: file.startsWith('editor/') ? 'editor' : file.startsWith('images/') ? 'resources' : 'reference',
      titles: Object.fromEntries(rcxLanguages.map(language => [language, library.documents.get(`${language}/${file}`).headings[0].title])),
      descriptions: Object.fromEntries(rcxLanguages.map(language => {
        const paragraph = library.documents.get(`${language}/${file}`).tokens.find(token => token.type === 'paragraph')
        const text = paragraph ? plain(paragraph.tokens) : ''
        return [language, text.length > 220 ? `${text.slice(0, 217).trimEnd()}…` : text]
      })),
    })),
    files: Object.fromEntries([...library.documents].map(([key, document]) => [key, digest(document.source)])),
  }
}

export function screenshotManifest(library, language) {
  const table = library.documents.get(`${language}/images/README.md`)?.tokens.find(token => token.type === 'table')
  if (!table || table.header.length !== 5) throw new Error(`${language}: missing screenshot manifest`)
  return new Map(table.rows.map(cells => {
    const [id, file, page, description, capture] = cells.map(cell => plain(cell.tokens))
    if (!/^[a-z0-9-]+$/.test(id) || !library.files.includes(page) || file !== `images/${id}.png`) throw new Error(`${language}: invalid screenshot ${id}`)
    const dimensions = /(\d{3,4})[x×](\d{3,4})/.exec(description)
    const width = dimensions ? Number(dimensions[1]) : 412
    return [id, { id, file, page, description, capture, width: id === 'editor-map' ? width * 3 : width, height: dimensions ? Number(dimensions[2]) : 915 }]
  }))
}

function resolveLink(href, document, library, catalogue) {
  if (/^https?:\/\//i.test(href)) return href
  if (/^[a-z][\w+.-]*:|^\/\//i.test(href)) throw new Error(`${document.file}: unsupported link ${href}`)
  const [target, fragment = ''] = href.split('#')
  const file = target ? posix.normalize(posix.join(posix.dirname(document.file), decodeURIComponent(target))) : document.file
  if (/^\.\.\/PROVIDER_(?:FEATURES|HEADERS|PREVIEW_API)\.md$/.test(file)) return `${catalogue.source.repository}/blob/${catalogue.source.commit}/docs/${document.language}/${file.slice(3)}${fragment ? `#${fragment}` : ''}`
  const destination = library.documents.get(`${document.language}/${file}`)
  if (!destination) throw new Error(`${document.language}/${document.file}: missing document ${href}`)
  let hash = ''
  if (fragment) {
    const decoded = decodeURIComponent(fragment)
    const heading = destination.headings.find(item => item.id === decoded || item.aliases.includes(decoded))
    if (!heading) throw new Error(`${document.language}/${document.file}: missing anchor ${href}`)
    hash = `#${heading.id}`
  }
  return `${target ? documentPath(document.language, file) : ''}${hash || (target ? '' : '#top')}`
}

export function compileDocument(document, library, catalogue, { requireDiagrams = true, publicRoot = join(siteRoot, 'public') } = {}) {
  const screenshots = screenshotManifest(library, document.language)
  let headingIndex = 0
  let diagramIndex = 0
  const usedScreenshots = []
  const inline = tokens => tokens.flatMap(token => {
    if (token.type === 'text' && token.tokens) return inline(token.tokens)
    if (['text', 'escape'].includes(token.type)) return [{ type: 'text', text: decode(token.text).replace(/\n/g, ' ') }]
    if (token.type === 'codespan') return [{ type: 'code', text: token.text }]
    if (token.type === 'br') return [{ type: 'break' }]
    if (['strong', 'em', 'del'].includes(token.type)) return [{ type: token.type, children: inline(token.tokens) }]
    if (token.type === 'link') return [{ type: 'link', href: resolveLink(token.href, document, library, catalogue), children: inline(token.tokens) }]
    if (token.type === 'html') return /^<br\s*\/?>$/i.test(token.text) ? [{ type: 'break' }] : [{ type: 'text', text: token.text }]
    throw new Error(`${document.language}/${document.file}: unsupported inline ${token.type}`)
  })
  const blocks = tokens => tokens.flatMap(token => {
    if (token.type === 'space') return []
    if (token.type === 'heading') {
      const heading = document.headings[headingIndex++]
      return heading.level === 1 ? [] : [{ type: 'heading', ...heading, content: inline(token.tokens) }]
    }
    if (token.type === 'paragraph' || token.type === 'text') return [{ type: 'paragraph', content: inline(token.tokens ?? [{ type: 'text', text: token.text }]) }]
    if (token.type === 'hr') return [{ type: 'rule' }]
    if (token.type === 'code') {
      if (token.lang !== 'mermaid') return [{ type: 'code', lang: token.lang || 'text', text: token.text }]
      const src = diagramPath(document.language, document.file, ++diagramIndex)
      const asset = join(publicRoot, src)
      let width = 1000, height = 600
      if (existsSync(asset)) {
        const svg = readFileSync(asset, 'utf8')
        if (!svg.includes(`<metadata id="rcx-source-sha256">${digest(token.text)}</metadata>`)) throw new Error(`${src}: stale diagram; run npm run docs:diagrams`)
        const viewBox = /viewBox="[\d.-]+ [\d.-]+ ([\d.]+) ([\d.]+)"/.exec(svg)
        if (!viewBox || /<script|<foreignObject|\son\w+=|(?:href|src)=["'](?:https?:|\/\/)/i.test(svg)) throw new Error(`${src}: unsupported SVG output`)
        width = Number(viewBox[1]); height = Number(viewBox[2])
      } else if (requireDiagrams) throw new Error(`${src}: missing diagram; run npm run docs:diagrams`)
      return [{ type: 'diagram', src, width, height, text: token.text, title: document.headings[Math.max(0, headingIndex - 1)].title }]
    }
    if (token.type === 'list') return [{ type: 'list', ordered: token.ordered, start: token.start || 1, items: token.items.map(item => ({ ...(item.task ? { checked: item.checked } : {}), blocks: blocks(item.tokens) })) }]
    if (token.type === 'blockquote') {
      const alert = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n/i.exec(token.text)
      const body = alert ? token.text.slice(alert[0].length) : token.text
      const slot = /^\*\*[^`\n]*`([a-z0-9-]+)`\*\*\s*[—–-]\s*/.exec(body)
      if (slot) {
        const entry = screenshots.get(slot[1])
        if (!entry || entry.page !== document.file || usedScreenshots.includes(entry.id)) throw new Error(`${document.language}/${document.file}: invalid screenshot slot ${slot[1]}`)
        usedScreenshots.push(entry.id)
        const base = `/assets/rcx/screenshots/${document.language}/${entry.id}`
        const extension = ['webp', 'png', 'avif', 'jpg'].find(ext => existsSync(join(publicRoot, `${base}.${ext}`)))
        return [{ type: 'screenshot', ...entry, caption: inline(marked.lexer(body.slice(slot[0].length))[0].tokens), ...(extension ? { src: `${base}.${extension}` } : {}) }]
      }
      return [{ type: 'quote', ...(alert ? { alert: alert[1].toLowerCase() } : {}), children: blocks(marked.lexer(body)) }]
    }
    if (token.type === 'table') {
      const rows = token.rows.map(cells => cells.map(cell => inline(cell.tokens)))
      if (document.file === 'images/README.md') {
        for (let index = 0; index < rows.length; index++) {
          const entry = screenshots.get(plain(token.rows[index][0].tokens))
          if (entry) for (const column of [0, 2]) rows[index][column] = [{ type: 'link', href: `${documentPath(document.language, entry.page)}#screenshot-${entry.id}`, children: rows[index][column] }]
        }
      }
      return [{ type: 'table', head: token.header.map(cell => inline(cell.tokens)), align: token.align, rows }]
    }
    if (token.type === 'html') return [{ type: 'paragraph', content: [{ type: 'text', text: token.text }] }]
    throw new Error(`${document.language}/${document.file}: unsupported block ${token.type}`)
  })
  const result = blocks(document.tokens)
  const expected = [...screenshots.values()].filter(entry => entry.page === document.file).map(entry => entry.id).sort()
  if (usedScreenshots.sort().join() !== expected.join()) throw new Error(`${document.language}/${document.file}: screenshot slots do not match the manifest`)
  return { language: document.language, slug: documentSlug(document.file), title: document.headings[0].title, headings: document.headings, blocks: result }
}

function searchableText(token) {
  if (token.type === 'code') return token.text
  if (token.type === 'list') return token.items.flatMap(item => item.tokens.map(searchableText)).join(' ')
  if (token.type === 'blockquote') return token.tokens.map(searchableText).join(' ')
  if (token.type === 'table') return [...token.header, ...token.rows.flat()].map(cell => plain(cell.tokens)).join(' ')
  return token.tokens ? plain(token.tokens) : token.text ?? ''
}

export function searchIndex(library, language) {
  return library.files.flatMap(file => {
    const document = library.documents.get(`${language}/${file}`)
    const entries = []
    let headingIndex = 0
    for (const token of document.tokens) {
      if (token.type === 'heading') {
        const heading = document.headings[headingIndex++]
        entries.push({ title: document.headings[0].title, heading: heading.title, href: `${documentPath(language, file)}${heading.level > 1 ? `#${heading.id}` : ''}`, text: '' })
      } else if (entries.length) entries.at(-1).text += ` ${searchableText(token).replace(/\s+/g, ' ')}`
    }
    return entries
  })
}
