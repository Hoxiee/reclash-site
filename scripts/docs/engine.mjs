// Build-time documentation engine: reads the manifest-driven Markdown library, validates it and compiles each page
// into the typed tree described by shared/docs/types.ts. Nothing here runs in the browser.
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs'
import { join, posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'

export const siteRoot = fileURLToPath(new URL('../../', import.meta.url))
export const contentRoot = join(siteRoot, 'content/docs')
export const publicRoot = join(siteRoot, 'public')
export const sourceRepository = 'https://github.com/Hoxiee/ReClash'
export const referenceLanguages = ['ru', 'en']
const schemaFiles = ['provider-policy.schema.json', 'rcx-profile.schema.json']
const alerts = ['note', 'tip', 'important', 'warning', 'caution']
const codeLanguages = new Set(['yaml', 'json', 'http', 'sh', 'text', 'go', 'mermaid'])
const slugPattern = /^(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/

export const digest = text => createHash('sha256').update(text).digest('hex')
export const docPath = (language, slug) => `/${language}/docs${slug ? `/${slug}` : ''}`
export const diagramPath = source => `/assets/docs/diagrams/${digest(source).slice(0, 16)}.svg`
export const screenshotBase = (language, id) => `/assets/docs/screenshots/${language}/${id}`

export function markdownFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    if (entry.isSymbolicLink() || lstatSync(join(root, entry.name)).isSymbolicLink()) throw new Error(`${root}/${entry.name}: symlinks are not allowed`)
    if (entry.isDirectory()) return markdownFiles(join(root, entry.name)).map(file => `${entry.name}/${file}`)
    return entry.isFile() && entry.name.endsWith('.md') ? [entry.name] : []
  }).sort()
}

function decode(text) {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
  return text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (raw, key) => {
    if (!key.startsWith('#')) return entities[key.toLowerCase()] ?? raw
    const value = key[1].toLowerCase() === 'x' ? Number.parseInt(key.slice(2), 16) : Number(key.slice(1))
    return value > 0 && value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff) ? String.fromCodePoint(value) : raw
  })
}

export function plain(tokens) {
  return tokens.map(token => token.type === 'br' ? ' ' : token.tokens ? plain(token.tokens) : decode(token.text ?? '')).join('').replace(/\s+/g, ' ').trim()
}

const words = text => (text.match(/[\p{L}\p{N}]+/gu) ?? []).length

export function readManifest(file) {
  const manifest = JSON.parse(readFileSync(file, 'utf8'))
  if (manifest.version !== 1) throw new Error('manifest: unsupported version')
  const languages = Object.entries(manifest.languages ?? {})
  if (!languages.some(([code, state]) => code === 'en' && state.published)) throw new Error('manifest: English must be published, it owns the anchors')
  if (typeof manifest.home !== 'string' || !Array.isArray(manifest.sections)) throw new Error('manifest: expected home and sections')
  for (const section of manifest.sections) {
    if (!/^[a-z0-9-]+$/.test(section.id) || !slugPattern.test(section.slug) || !section.slug || typeof section.dir !== 'string') throw new Error(`manifest: invalid section ${section.id}`)
    for (const [code] of languages) if (!section.title?.[code]) throw new Error(`manifest: ${section.id} lacks a ${code} title`)
    if (!section.groups?.length || section.groups.some(group => !group.pages?.length)) throw new Error(`manifest: ${section.id} has an empty group`)
  }
  return manifest
}

export const publishedLanguages = manifest => Object.entries(manifest.languages).filter(([, state]) => state.published).map(([code]) => code)

export function manifestPages(manifest) {
  const pages = [{ file: manifest.home, slug: '', section: '', group: -1 }]
  for (const section of manifest.sections) {
    section.groups.forEach((group, groupIndex) => {
      for (const entry of group.pages) {
        const relative = typeof entry === 'string' ? entry : entry.file
        const derived = relative === 'README.md' ? '' : relative.replace(/(?:\/README)?\.md$/, '')
        const slug = typeof entry === 'string' || !entry.slug ? [section.slug, derived].filter(Boolean).join('/') : `${section.slug}/${entry.slug}`
        pages.push({ file: posix.join(section.dir, relative), slug, section: section.id, group: groupIndex })
      }
    })
  }
  const seen = new Set()
  for (const page of pages) {
    if (!slugPattern.test(page.slug) || !page.file.endsWith('.md')) throw new Error(`manifest: invalid page ${page.file}`)
    for (const key of [`file:${page.file}`, `slug:${page.slug}`]) {
      if (seen.has(key)) throw new Error(`manifest: duplicate ${key}`)
      seen.add(key)
    }
  }
  return pages
}

function headingIds(tokens) {
  const used = new Map()
  return tokens.filter(token => token.type === 'heading').map(token => {
    const title = plain(token.tokens)
    const base = title.toLowerCase().replace(/[^\p{L}\p{N}\p{M}_\s-]/gu, '').trim().replace(/\s+/g, '-')
    const count = used.get(base) ?? 0
    used.set(base, count + 1)
    return { level: token.depth, title, id: `${base}${count ? `-${count}` : ''}` }
  })
}

export function readLibrary(root = contentRoot) {
  const manifest = readManifest(join(root, 'manifest.json'))
  const languages = publishedLanguages(manifest)
  const pages = manifestPages(manifest)
  const files = pages.map(page => page.file)
  const expected = [...files].sort().join('\n')
  const documents = new Map()
  for (const language of languages) {
    const present = markdownFiles(join(root, language))
    const missing = files.filter(file => !present.includes(file))
    const extra = present.filter(file => !files.includes(file))
    if (missing.length || extra.length) throw new Error(`${language}: ${missing.length ? `missing ${missing.join(', ')}` : ''}${missing.length && extra.length ? '; ' : ''}${extra.length ? `not in the manifest ${extra.join(', ')}` : ''}`)
    if (present.join('\n') !== expected) throw new Error(`${language}: document inventory differs`)
    for (const page of pages) {
      const source = readFileSync(join(root, language, page.file), 'utf8')
      if (!source.trim() || source.length > 1024 * 1024) throw new Error(`${language}/${page.file}: invalid document size`)
      if (/^---\r?\n/.test(source)) throw new Error(`${language}/${page.file}: front matter is not supported`)
      const tokens = marked.lexer(source, { gfm: true })
      const headings = headingIds(tokens)
      if (headings[0]?.level !== 1 || headings.filter(heading => heading.level === 1).length !== 1) throw new Error(`${language}/${page.file}: expected exactly one title heading first`)
      documents.set(`${language}/${page.file}`, { language, file: page.file, page, source, tokens, headings })
    }
  }
  for (const document of documents.values()) {
    const english = documents.get(`en/${document.file}`)
    if (document.headings.map(heading => heading.level).join() !== english.headings.map(heading => heading.level).join()) throw new Error(`${document.language}/${document.file}: heading structure differs from English`)
    document.headings = document.headings.map((heading, index) => ({ ...heading, id: english.headings[index].id, aliases: heading.id === english.headings[index].id ? [] : [heading.id] }))
  }
  return { manifest, languages, pages, documents }
}

function description(document) {
  const start = document.tokens.findIndex(token => token.type === 'heading')
  const paragraph = document.tokens.slice(start + 1).find(token => token.type !== 'space')
  const text = paragraph?.type === 'paragraph' ? plain(paragraph.tokens) : ''
  return text.length > 220 ? `${text.slice(0, 217).trimEnd()}…` : text
}

const localized = (languages, value) => Object.fromEntries(languages.map(language => [language, value[language]]))

export function makeCatalogue(library, commit) {
  const { manifest, languages } = library
  const slugs = section => library.pages.filter(page => page.section === section.id)
  return {
    source: { repository: sourceRepository, commit },
    languages,
    sections: manifest.sections.map(section => ({
      id: section.id, slug: section.slug, title: localized(languages, section.title),
      groups: section.groups.map((group, index) => ({ title: localized(languages, group.title ?? {}), pages: slugs(section).filter(page => page.group === index).map(page => page.slug) })),
    })),
    pages: library.pages.map(page => {
      const of = language => library.documents.get(`${language}/${page.file}`)
      return {
        slug: page.slug, file: page.file, section: page.section,
        titles: Object.fromEntries(languages.map(language => [language, of(language).headings[0].title])),
        descriptions: Object.fromEntries(languages.map(language => [language, description(of(language))])),
        minutes: Object.fromEntries(languages.map(language => [language, Math.max(1, Math.round(words(of(language).source) / 180))])),
      }
    }),
    files: Object.fromEntries([...library.documents].map(([key, document]) => [key, digest(document.source)])),
  }
}

export function screenshotManifest(library, language, section) {
  if (!section.screenshots) return new Map()
  const file = posix.join(section.dir, section.screenshots)
  const table = library.documents.get(`${language}/${file}`)?.tokens.find(token => token.type === 'table')
  if (!table || table.header.length !== 5) throw new Error(`${language}/${file}: missing screenshot manifest table`)
  return new Map(table.rows.map(cells => {
    const [id, image, page, about, capture] = cells.map(cell => plain(cell.tokens))
    const target = posix.join(section.dir, page)
    if (!/^[a-z0-9-]+$/.test(id) || image !== `images/${id}.png` || !library.pages.some(item => item.file === target)) throw new Error(`${language}/${file}: invalid screenshot ${id}`)
    const size = /(\d{3,4})\s*[x×]\s*(\d{3,4})/.exec(about)
    return [id, { id, file: image, page: target, description: about, capture, width: size ? Number(size[1]) : 412, height: size ? Number(size[2]) : 915 }]
  }))
}

function headerNames() {
  const file = join(siteRoot, 'shared/provider/standard.json')
  if (!existsSync(file)) return new Set()
  const standard = JSON.parse(readFileSync(file, 'utf8'))
  return new Set([
    ...standard.fields.flatMap(field => [field.name, ...(field.aliases ?? []).map(alias => alias.name)]),
    ...standard.headers.map(header => header.name),
  ].map(name => name.toLowerCase()))
}

function resolveLink(href, document, library, catalogue) {
  if (/^(?:https?:\/\/|mailto:)/i.test(href)) return { href, external: true }
  if (/^[a-z][\w+.-]*:|^\/\//i.test(href)) throw new Error(`${document.language}/${document.file}: unsupported link ${href}`)
  const [target, fragment = ''] = href.split('#')
  const decoded = target ? decodeURIComponent(target) : ''
  const file = decoded ? posix.normalize(posix.join(posix.dirname(document.file), decoded)) : document.file
  if (file.startsWith('../')) {
    const repositoryPath = posix.normalize(posix.join('docs', document.language, posix.dirname(document.file), decoded))
    if (repositoryPath.startsWith('../')) throw new Error(`${document.language}/${document.file}: link leaves the repository ${href}`)
    if (schemaFiles.includes(repositoryPath)) return { href: `/schemas/${repositoryPath}`, external: false }
    return { href: `${catalogue.source.repository}/blob/${catalogue.source.commit}/${repositoryPath}${fragment ? `#${fragment}` : ''}`, external: true }
  }
  const destination = library.documents.get(`${document.language}/${file}`)
  if (!destination) throw new Error(`${document.language}/${document.file}: missing document ${href}`)
  let hash = ''
  if (fragment) {
    const anchor = decodeURIComponent(fragment)
    const heading = destination.headings.find(item => item.id === anchor || item.aliases.includes(anchor))
    const screenshot = anchor.startsWith('screenshot-') && library.manifest.sections.some(section => screenshotManifest(library, document.language, section).has(anchor.slice(11)))
    if (!heading && !screenshot) throw new Error(`${document.language}/${document.file}: missing anchor ${href}`)
    hash = `#${heading?.id ?? anchor}`
  }
  if (!decoded) return { href: hash || '#top', external: false }
  return { href: `${docPath(document.language, destination.page.slug)}${hash}`, external: false }
}

function codeInfo(document, info = '') {
  const [lang = 'text', ...rest] = info.trim().split(/\s+/)
  const title = /title="([^"]+)"/.exec(rest.join(' '))?.[1] ?? ''
  if (!codeLanguages.has(lang)) throw new Error(`${document.language}/${document.file}: unsupported code language "${lang}"`)
  return { lang, title }
}

function readDiagram(source, title, requireDiagrams) {
  const src = diagramPath(source)
  const asset = join(publicRoot, src)
  if (!existsSync(asset)) {
    if (requireDiagrams) throw new Error(`${src}: missing diagram; run npm run docs:diagrams`)
    return { type: 'diagram', src, width: 1000, height: 600, text: source, title }
  }
  const svg = readFileSync(asset, 'utf8')
  const viewBox = /viewBox="[\d.-]+ [\d.-]+ ([\d.]+) ([\d.]+)"/.exec(svg)
  if (!viewBox || /<script|<foreignObject|\son\w+=|(?:href|src)=["'](?:https?:|\/\/)/i.test(svg)) throw new Error(`${src}: unsupported SVG output`)
  return { type: 'diagram', src, width: Number(viewBox[1]), height: Number(viewBox[2]), text: source, title }
}

export function compileDocument(document, library, catalogue, { requireDiagrams = true } = {}) {
  const section = library.manifest.sections.find(item => item.id === document.page.section)
  const screenshots = section ? screenshotManifest(library, document.language, section) : new Map()
  const manifestFile = section?.screenshots ? posix.join(section.dir, section.screenshots) : ''
  const headers = referenceLanguages.includes(document.language) ? headerNames() : new Set()
  const usedScreenshots = []
  let headingIndex = 0
  const where = `${document.language}/${document.file}`

  const inline = tokens => tokens.flatMap(token => {
    if (token.type === 'text' && token.tokens) return inline(token.tokens)
    if (token.type === 'text' || token.type === 'escape') return [{ type: 'text', text: decode(token.text).replace(/\n/g, ' ') }]
    if (token.type === 'codespan') {
      const text = decode(token.text)
      const name = text.trim().replace(/:$/, '').toLowerCase()
      return [headers.has(name) ? { type: 'code', text, href: `/${document.language}/reference#h-${name}` } : { type: 'code', text }]
    }
    if (token.type === 'br') return [{ type: 'break' }]
    if (token.type === 'strong' || token.type === 'em' || token.type === 'del') return [{ type: token.type, children: inline(token.tokens) }]
    if (token.type === 'link') return [{ type: 'link', ...resolveLink(token.href, document, library, catalogue), children: inline(token.tokens) }]
    if (token.type === 'html') return /^<br\s*\/?>$/i.test(token.text) ? [{ type: 'break' }] : [{ type: 'text', text: token.text }]
    throw new Error(`${where}: unsupported inline ${token.type}${token.type === 'html' ? ` ${token.text}` : ''}`)
  })

  const blocks = tokens => tokens.flatMap(token => {
    if (token.type === 'space' || (token.type === 'html' && /^\s*<!--[\s\S]*-->\s*$/.test(token.text))) return []
    if (token.type === 'heading') {
      const heading = document.headings[headingIndex++]
      return heading.level === 1 ? [] : [{ type: 'heading', ...heading, content: inline(token.tokens) }]
    }
    if (token.type === 'paragraph' || token.type === 'text') return [{ type: 'paragraph', content: inline(token.tokens ?? [{ type: 'text', text: token.text }]) }]
    if (token.type === 'hr') return [{ type: 'rule' }]
    if (token.type === 'code') {
      const { lang, title } = codeInfo(document, token.lang)
      if (lang === 'mermaid') return [readDiagram(token.text, title || document.headings[Math.max(0, headingIndex - 1)].title, requireDiagrams)]
      return [{ type: 'code', lang, title, text: token.text }]
    }
    if (token.type === 'list') return [{ type: 'list', ordered: token.ordered, start: token.start || 1, items: token.items.map(item => ({ ...(item.task ? { checked: item.checked } : {}), blocks: blocks(item.tokens.filter(child => child.type !== 'checkbox')) })) }]
    if (token.type === 'blockquote') {
      const alert = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n/i.exec(token.text)
      const body = alert ? token.text.slice(alert[0].length) : token.text
      const slot = /^\*\*[^`\n]*`([a-z0-9-]+)`\*\*\s*[—–-]\s*/.exec(body)
      if (slot) {
        const entry = screenshots.get(slot[1])
        if (!entry || entry.page !== document.file || usedScreenshots.includes(entry.id)) throw new Error(`${where}: invalid screenshot slot ${slot[1]}`)
        usedScreenshots.push(entry.id)
        const base = screenshotBase(document.language, entry.id)
        const extension = ['webp', 'avif', 'png', 'jpg'].find(ext => existsSync(join(publicRoot, `${base}.${ext}`)))
        return [{ type: 'screenshot', ...entry, caption: inline(marked.lexer(body.slice(slot[0].length))[0]?.tokens ?? []), ...(extension ? { src: `${base}.${extension}` } : {}) }]
      }
      const children = blocks(marked.lexer(body, { gfm: true }))
      return [alert ? { type: 'callout', tone: alert[1].toLowerCase(), children } : { type: 'quote', children }]
    }
    if (token.type === 'table') {
      const rows = token.rows.map(cells => cells.map(cell => inline(cell.tokens)))
      if (document.file === manifestFile) {
        token.rows.forEach((cells, index) => {
          const entry = screenshots.get(plain(cells[0].tokens))
          const page = entry && library.pages.find(item => item.file === entry.page)
          if (page) for (const column of [0, 2]) rows[index][column] = [{ type: 'link', href: `${docPath(document.language, page.slug)}#screenshot-${entry.id}`, external: false, children: rows[index][column] }]
        })
      }
      return [{ type: 'table', head: token.header.map(cell => inline(cell.tokens)), align: token.align, rows }]
    }
    throw new Error(`${where}: unsupported block ${token.type}${token.type === 'html' ? ` ${token.text.trim()}` : ''}`)
  })

  const start = document.tokens.findIndex(token => token.type === 'heading')
  const first = document.tokens.findIndex((token, index) => index > start && token.type !== 'space')
  const lede = document.tokens[first]?.type === 'paragraph' ? document.tokens[first] : undefined
  const result = blocks(document.tokens.filter(token => token !== lede))
  const expected = [...screenshots.values()].filter(entry => entry.page === document.file).map(entry => entry.id).sort()
  if ([...usedScreenshots].sort().join() !== expected.join()) throw new Error(`${where}: screenshot slots do not match the manifest`)
  for (const block of result) if (block.type === 'callout' && !alerts.includes(block.tone)) throw new Error(`${where}: unknown callout ${block.tone}`)
  return { language: document.language, slug: document.page.slug, title: document.headings[0].title, lede: lede ? inline(lede.tokens) : [], headings: document.headings, blocks: result }
}

function searchableText(token) {
  if (token.type === 'code') return token.lang?.startsWith('mermaid') ? '' : token.text
  if (token.type === 'list') return token.items.flatMap(item => item.tokens.map(searchableText)).join(' ')
  if (token.type === 'blockquote') return token.tokens.map(searchableText).join(' ').replace(/\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/gi, '')
  if (token.type === 'table') return [token.header, ...token.rows].map(cells => cells.map(cell => plain(cell.tokens)).join(' · ')).join('. ')
  return token.tokens ? plain(token.tokens) : token.text ?? ''
}

export function searchIndex(library, language) {
  const sectionTitle = id => library.manifest.sections.find(section => section.id === id)?.title[language] ?? ''
  return library.pages.flatMap(page => {
    const document = library.documents.get(`${language}/${page.file}`)
    const entries = []
    let headingIndex = 0
    for (const token of document.tokens) {
      if (token.type === 'heading') {
        const heading = document.headings[headingIndex++]
        entries.push({ section: sectionTitle(page.section), page: document.headings[0].title, heading: heading.level > 1 ? heading.title : '', href: `${docPath(language, page.slug)}${heading.level > 1 ? `#${heading.id}` : ''}`, text: '' })
      } else if (entries.length) {
        const entry = entries.at(-1)
        if (entry.text.length < 1600) entry.text = `${entry.text} ${searchableText(token).replace(/\s+/g, ' ')}`.trim().slice(0, 1600)
      }
    }
    return entries
  })
}
