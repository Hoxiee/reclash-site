import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { after, test } from 'node:test'
import { marked } from 'marked'
import { compileDocument, contentRoot, docPath, makeCatalogue, readLibrary, screenshotManifest, searchIndex } from '../scripts/docs/engine.mjs'

function allBlocks(blocks) {
  return blocks.flatMap(block => [block, ...allBlocks(
    block.type === 'list' ? block.items.flatMap(item => item.blocks) : block.type === 'quote' || block.type === 'callout' ? block.children : [],
  )])
}

function allInline(nodes) {
  return nodes.flatMap(node => [node, ...(node.children ? allInline(node.children) : [])])
}

function inlineOf(document) {
  const cells = block => block.type === 'table' ? [...block.head.flat(), ...block.rows.flat(2)] : []
  return [...allInline(document.lede), ...allBlocks(document.blocks).flatMap(block => allInline(block.content ?? block.caption ?? cells(block)))]
}

const fixtureRoot = mkdtempSync(join(tmpdir(), 'docs-engine-'))
after(() => rmSync(fixtureRoot, { recursive: true, force: true }))

function fixture(files, manifest = {}) {
  const root = mkdtempSync(join(fixtureRoot, 'case-'))
  const base = {
    version: 1, languages: { ru: { published: true }, en: { published: true }, 'zh-CN': { published: false } }, home: 'README.md',
    sections: [{ id: 'guide', dir: 'guide', slug: 'guide', title: { ru: 'Гид', en: 'Guide', 'zh-CN': '指南' },
      groups: [{ title: { ru: 'Основы', en: 'Basics', 'zh-CN': '基础' }, pages: ['README.md', 'deep/page.md'] }] }],
  }
  writeFileSync(join(root, 'manifest.json'), JSON.stringify({ ...base, ...manifest }))
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, file)), { recursive: true })
    writeFileSync(join(root, file), text)
  }
  return root
}

const pages = {
  'en/README.md': '# Docs\n\nHome page.\n',
  'ru/README.md': '# Документация\n\nГлавная.\n',
  'en/guide/README.md': '# Guide\n\nThe lede.\n\n## Install steps\n\nSee [the page](deep/page.md#limits) and `subscription-userinfo`.\n\n> [!WARNING]\n> Careful.\n',
  'ru/guide/README.md': '# Гид\n\nВступление.\n\n## Установка\n\nСм. [страницу](deep/page.md#limits).\n\n> [!WARNING]\n> Осторожно.\n',
  'en/guide/deep/page.md': '# Page\n\nDeep page.\n\n## Limits\n\n```yaml title="limits.yaml"\nmax: 3\n```\n\n[Schema](../../../../provider-policy.schema.json) and [source](../../../../lib/main.dart).\n',
  'ru/guide/deep/page.md': '# Страница\n\nГлубокая.\n\n## Ограничения\n\n```yaml title="limits.yaml"\nmax: 3\n```\n\n[Схема](../../../../provider-policy.schema.json) и [код](../../../../lib/main.dart).\n',
}
const catalogueOf = library => makeCatalogue(library, 'a'.repeat(40))

test('the manifest drives slugs, groups and published languages', () => {
  const library = readLibrary(fixture({ ...pages, 'zh-CN/README.md': '# 文档\n' }))
  assert.deepEqual(library.languages, ['ru', 'en'])
  assert.deepEqual(library.pages.map(page => page.slug), ['', 'guide', 'guide/deep/page'])
  const catalogue = catalogueOf(library)
  assert.deepEqual(catalogue.sections[0].groups, [{ title: { ru: 'Основы', en: 'Basics' }, pages: ['guide', 'guide/deep/page'] }])
  assert.equal(catalogue.pages[1].descriptions.en, 'The lede.')
})

test('the inventory must match the manifest exactly', () => {
  assert.throws(() => readLibrary(fixture({ ...pages, 'en/guide/extra.md': '# Extra\n', 'ru/guide/extra.md': '# Лишнее\n' })), /not in the manifest guide\/extra\.md/)
  const { 'ru/guide/deep/page.md': _, ...missing } = pages
  assert.throws(() => readLibrary(fixture(missing)), /ru: missing guide\/deep\/page\.md/)
  assert.throws(() => readLibrary(fixture({ ...pages, 'ru/guide/README.md': '# Гид\n\n### Уровень\n' })), /heading structure differs/)
  assert.throws(() => readLibrary(fixture({ ...pages, 'en/README.md': '---\na: 1\n---\n# Docs\n' })), /front matter/)
})

test('translations keep English anchors, expose localized aliases and resolve links across directories', () => {
  const library = readLibrary(fixture(pages))
  const catalogue = catalogueOf(library)
  const russian = compileDocument(library.documents.get('ru/guide/README.md'), library, catalogue, { requireDiagrams: false })
  assert.deepEqual(russian.headings.map(heading => heading.id), ['guide', 'install-steps'])
  assert.deepEqual(russian.headings[1].aliases, ['установка'])
  assert.deepEqual(russian.lede, [{ type: 'text', text: 'Вступление.' }])
  assert.equal(inlineOf(russian).find(node => node.type === 'link').href, '/ru/docs/guide/deep/page#limits')
  assert.deepEqual(allBlocks(russian.blocks).find(block => block.type === 'callout').tone, 'warning')
  const english = compileDocument(library.documents.get('en/guide/README.md'), library, catalogue, { requireDiagrams: false })
  assert.deepEqual(inlineOf(english).find(node => node.type === 'code'), { type: 'code', text: 'subscription-userinfo', href: '/en/reference#h-subscription-userinfo' })
  const deep = compileDocument(library.documents.get('en/guide/deep/page.md'), library, catalogue, { requireDiagrams: false })
  assert.deepEqual(deep.blocks.find(block => block.type === 'code'), { type: 'code', lang: 'yaml', title: 'limits.yaml', text: 'max: 3' })
  const links = inlineOf(deep).filter(node => node.type === 'link')
  assert.deepEqual(links.map(link => [link.href, link.external]), [
    ['/schemas/provider-policy.schema.json', false],
    [`https://github.com/Hoxiee/ReClash/blob/${'a'.repeat(40)}/lib/main.dart`, true],
  ])
})

test('unsafe or broken links fail and raw HTML stays inert text', () => {
  const library = readLibrary(fixture(pages))
  const catalogue = catalogueOf(library)
  const source = library.documents.get('en/guide/README.md')
  const compile = text => compileDocument({ ...source, tokens: marked.lexer(`# Guide\n\n${text}`), headings: source.headings.slice(0, 1) }, library, catalogue)
  assert.throws(() => compile('[x](javascript:alert%281%29)'), /unsupported link/)
  assert.throws(() => compile('[x](missing.md)'), /missing document/)
  assert.throws(() => compile('[x](deep/page.md#nowhere)'), /missing anchor/)
  assert.throws(() => compile('[x](../../../../../etc/passwd)'), /leaves the repository/)
  assert.throws(() => compile('```ruby\nputs 1\n```'), /unsupported code language/)
  assert.throws(() => compile('<div>block</div>'), /unsupported block html/)
  const html = 'Lede.\n\nText <img src=x onerror=alert(1)> here.'
  assert.deepEqual(compile(html).blocks, [{ type: 'paragraph', content: [
    { type: 'text', text: 'Text ' }, { type: 'text', text: '<img src=x onerror=alert(1)>' }, { type: 'text', text: ' here.' },
  ] }])
})

test('search indexes every heading with body text under the page URL', () => {
  const library = readLibrary(fixture(pages))
  const index = searchIndex(library, 'en')
  assert.equal(index.length, 5)
  const limits = index.find(entry => entry.heading === 'Limits')
  assert.equal(limits.href, '/en/docs/guide/deep/page#limits')
  assert.match(limits.text, /max: 3/)
  assert.equal(limits.section, 'Guide')
})

const snapshot = readLibrary()
const catalogue = JSON.parse(readFileSync(join(contentRoot, 'catalogue.json'), 'utf8'))
const compiled = new Map([...snapshot.documents].map(([key, document]) => [key, compileDocument(document, snapshot, catalogue)]))

test('the synchronized snapshot matches its catalogue and keeps every code sample verbatim', () => {
  assert.deepEqual(makeCatalogue(snapshot, catalogue.source.commit), catalogue)
  assert.equal(snapshot.documents.size, catalogue.pages.length * catalogue.languages.length)
  for (const [key, document] of compiled) {
    const source = snapshot.documents.get(key)
    const code = allBlocks(document.blocks).filter(block => block.type === 'code' || block.type === 'diagram').map(block => block.text)
    const fences = []
    const walk = tokens => tokens.forEach(token => {
      if (token.type === 'code') fences.push(token.text)
      else if (token.type === 'list') token.items.forEach(item => walk(item.tokens))
      else if (token.type === 'blockquote') walk(marked.lexer(token.text.replace(/^\[![A-Z]+\]\s*\n/i, ''), { gfm: true }))
    })
    walk(source.tokens)
    assert.deepEqual(code, fences, key)
  }
})

test('every internal link of the snapshot lands on a rendered heading or screenshot', () => {
  const targets = new Map([...compiled.values()].map(document => [docPath(document.language, document.slug), new Set([
    'top', ...document.headings.flatMap(heading => [heading.id, ...heading.aliases]),
    ...allBlocks(document.blocks).filter(block => block.type === 'screenshot').map(block => `screenshot-${block.id}`),
  ])]))
  for (const document of compiled.values()) {
    const current = docPath(document.language, document.slug)
    for (const link of inlineOf(document).filter(node => node.type === 'link' && !node.external)) {
      if (link.href.startsWith('/schemas/')) continue
      const [path, hash] = link.href.split('#')
      const ids = targets.get(path || current)
      assert.ok(ids, `${current}: missing ${link.href}`)
      if (hash) assert.ok(ids.has(decodeURIComponent(hash)), `${current}: missing anchor ${link.href}`)
    }
  }
})

test('screenshot slots appear once per language with reserved dimensions', () => {
  for (const language of snapshot.languages) {
    for (const section of snapshot.manifest.sections.filter(item => item.screenshots)) {
      const manifest = screenshotManifest(snapshot, language, section)
      const slots = [...compiled.values()].filter(document => document.language === language).flatMap(document => allBlocks(document.blocks).filter(block => block.type === 'screenshot'))
      assert.ok(manifest.size > 0)
      assert.deepEqual(slots.map(slot => slot.id).sort(), [...manifest.keys()].sort())
      for (const slot of slots) {
        assert.ok(slot.caption.length && slot.width && slot.height, slot.id)
        if (slot.src) assert.match(slot.src, new RegExp(`^/assets/docs/screenshots/${language}/${slot.id}\\.(webp|avif|png|jpg)$`))
      }
    }
  }
})
