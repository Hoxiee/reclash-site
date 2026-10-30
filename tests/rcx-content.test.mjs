import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { marked } from 'marked'
import { compileDocument, contentRoot, makeCatalogue, rcxLanguages, readDocuments, screenshotManifest, searchIndex } from '../scripts/rcx-content.mjs'

const library = readDocuments()
const catalogue = JSON.parse(readFileSync(join(contentRoot, 'catalogue.json'), 'utf8'))
const compiled = new Map([...library.documents].map(([key, document]) => [key, compileDocument(document, library, catalogue)]))

function allBlocks(blocks) {
  return blocks.flatMap(block => [block, ...allBlocks(block.type === 'list' ? block.items.flatMap(item => item.blocks) : block.type === 'quote' ? block.children : [])])
}

function allInline(nodes) {
  return nodes.flatMap(node => [node, ...(node.children ? allInline(node.children) : [])])
}

function inlineBlocks(blocks) {
  return allBlocks(blocks).flatMap(block => allInline(block.content ?? block.caption ?? (block.type === 'table' ? [...block.head.flat(), ...block.rows.flat(2)] : [])))
}

test('the snapshot contains every document and matches the recorded source', () => {
  assert.deepEqual(makeCatalogue(library, catalogue.source.commit), catalogue)
  assert.equal(library.documents.size, catalogue.pages.length * rcxLanguages.length)
  for (const [key, document] of compiled) {
    const source = library.documents.get(key)
    assert.equal(document.headings.length, source.headings.length)
    const code = allBlocks(document.blocks).filter(block => block.type === 'code' || block.type === 'diagram').map(block => block.text)
    assert.deepEqual(code, source.tokens.filter(token => token.type === 'code').map(token => token.text))
  }
})

test('all internal links resolve to a rendered page and heading or screenshot', () => {
  const destinations = new Map([...compiled.values()].map(document => [`/${document.language}/rcx${document.slug ? `/${document.slug}` : ''}`, new Set([
    'top', ...document.headings.flatMap(heading => [heading.id, ...heading.aliases]),
    ...allBlocks(document.blocks).filter(block => block.type === 'screenshot').map(block => `screenshot-${block.id}`),
  ])]))
  for (const document of compiled.values()) {
    const current = `/${document.language}/rcx${document.slug ? `/${document.slug}` : ''}`
    for (const link of inlineBlocks(document.blocks).filter(node => node.type === 'link')) {
      if (/^https?:/.test(link.href)) continue
      const [path, hash] = link.href.split('#')
      const ids = destinations.get(path || current)
      assert.ok(ids, `Missing ${link.href}`)
      if (hash) assert.ok(ids.has(decodeURIComponent(hash)), `Missing ${link.href} on ${current}`)
    }
  }
})

test('translated headings keep stable English anchors and localized aliases', () => {
  for (const page of catalogue.pages) {
    const english = compiled.get(`en/${page.file}`)
    for (const language of ['ru', 'zh-CN']) {
      const translated = compiled.get(`${language}/${page.file}`)
      assert.deepEqual(translated.headings.map(heading => heading.id), english.headings.map(heading => heading.id))
      assert.ok(translated.headings.some(heading => heading.aliases.length > 0))
    }
  }
})

test('each screenshot contract has exactly one localized slot and capture instructions', () => {
  for (const language of rcxLanguages) {
    const manifest = screenshotManifest(library, language)
    const slots = [...compiled.values()].filter(document => document.language === language).flatMap(document => allBlocks(document.blocks).filter(block => block.type === 'screenshot'))
    assert.equal(manifest.size, 57)
    assert.deepEqual(slots.map(slot => slot.id).sort(), [...manifest.keys()].sort())
    for (const slot of slots) {
      assert.ok(slot.caption.length && slot.capture && slot.width && slot.height)
      if (slot.src) assert.match(slot.src, new RegExp(`^/assets/rcx/screenshots/${language}/${slot.id}\\.(webp|png|avif|jpg)$`))
    }
  }
})

test('a local image replaces only its matching language placeholder', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rcx-screenshot-'))
  try {
    const image = join(root, 'assets/rcx/screenshots/en/editor-map.png')
    await mkdir(join(root, 'assets/rcx/screenshots/en'), { recursive: true })
    await writeFile(image, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64'))
    for (const language of ['en', 'ru']) {
      const document = compileDocument(library.documents.get(`${language}/editor/README.md`), library, catalogue, { publicRoot: root })
      const screenshot = document.blocks.find(block => block.type === 'screenshot')
      assert.equal(screenshot.src, language === 'en' ? '/assets/rcx/screenshots/en/editor-map.png' : undefined)
    }
  } finally {
    await rm(root, { recursive: true })
  }
})

test('unsafe links fail compilation and raw HTML remains inert text', () => {
  const source = library.documents.get('en/README.md')
  const compile = text => compileDocument({ ...source, tokens: marked.lexer(`# Auto routing\n\n${text}`) }, library, catalogue)
  assert.throws(() => compile('[link](javascript:alert%281%29)'), /unsupported link/)
  assert.throws(() => compile('[link](missing.md)'), /missing document/)
  assert.throws(() => compile('[link](profiles.md#not-a-heading)'), /missing anchor/)
  const html = '<img src=x onerror=alert(1)>'
  const document = compile(html)
  assert.deepEqual(document.blocks, [{ type: 'paragraph', content: [{ type: 'text', text: html }] }])
})

test('full-text search covers the final sections and does not fetch documents', () => {
  for (const language of rcxLanguages) {
    const index = searchIndex(library, language)
    assert.equal(index.length, [...compiled.values()].filter(document => document.language === language).reduce((sum, document) => sum + document.headings.length, 0))
    const lastSection = compiled.get(`${language}/engine.md`).headings.at(-1).id
    assert.ok(index.some(entry => entry.href.endsWith(`/engine#${lastSection}`) && entry.text.length))
    assert.ok(index.some(entry => entry.text.includes('dwell')))
  }
})
