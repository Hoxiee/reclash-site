import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { deflateSync } from 'node:zlib'
import { excludedRoot, schemaPaths } from '../shared/provider/builder/schema.ts'
import { formEntries, formSections } from '../shared/provider/builder/form.ts'
import { decodeFragment, draftLimit, emitManifest, encodeFragment, importManifest, setAt } from '../shared/provider/builder/document.ts'
import { validateManifest } from '../shared/provider/builder/validate.ts'
import { parseYaml, stringifyYaml } from '../shared/provider/builder/yaml.ts'

const isRouting = path => path === excludedRoot || path.startsWith(`${excludedRoot}.`)

test('every schema property path except routing has exactly one form entry', () => {
  const schema = schemaPaths().filter(path => !isRouting(path)).sort()
  const entries = formEntries.map(entry => entry.path)
  assert.deepEqual(entries.filter((path, index) => entries.indexOf(path) !== index), [], 'duplicate form entries')
  const form = [...new Set([...formSections.map(section => section.key), ...entries])]
  assert.deepEqual(schema.filter(path => !form.includes(path)), [], 'schema paths without a form entry')
  assert.deepEqual(form.filter(path => !schema.includes(path)), [], 'form entries that point to no schema path')
  assert.ok(!form.some(isRouting), 'routing stays out of the form')
})

test('the documented full example survives import, validation and emission', async () => {
  const markdown = await readFile(new URL('../content/docs/en/providers/manifest.md', import.meta.url), 'utf8')
  const source = /## Full example\s+```yaml\n([\s\S]+?)```/.exec(markdown)[1]
  const imported = importManifest(source)
  assert.deepEqual(imported.dropped, [])
  assert.match(imported.routing, /^routing:\n {2}profiles:\n {4}fast-de:/)
  assert.deepEqual(validateManifest(imported.manifest), [])
  const output = emitManifest(imported.manifest, imported.routing)
  assert.deepEqual(importManifest(output).manifest, imported.manifest)
  assert.deepEqual(parseYaml(output).value.routing, parseYaml(source).value.routing)
  assert.match(output, /\n {2}"on":\n {4}- "\{daysLeft\} days left"\n {4}- Protected\n/)
  assert.match(output, /^version: 1\nprovider:\n/)
  assert.match(output, /color: "#336699"/)
  assert.match(output, /\n {2}"off": Tap to connect\n/)
  assert.ok(output.endsWith(`${imported.routing}\n`))
})

test('the YAML reader handles the manifest forms and refuses anchors', () => {
  const { value } = parseYaml([
    '# comment', 'a: { x: 1, y: [2, "3"] }', 'b: |', '  line one', '  line two', 'c: >-', '  folded', '  text',
    'd:', '- one', '- k: v', '  m: n', "e: 'it''s' # trailing", 'f: "tab\\tquote\\""', '"off": ok', 'g: https://x.test/a#b',
  ].join('\n'))
  assert.deepEqual(value, {
    a: { x: 1, y: [2, '3'] }, b: 'line one\nline two\n', c: 'folded text', d: ['one', { k: 'v', m: 'n' }],
    e: 'it\'s', f: 'tab\tquote"', off: 'ok', g: 'https://x.test/a#b',
  })
  assert.throws(() => parseYaml('a: &x 1\nb: *x\n'), /Anchors/)
  assert.throws(() => parseYaml('a: 1\na: 2\n'), /Duplicate/)
})

test('the YAML writer quotes what plain YAML would misread', () => {
  const value = { on: 'yes', n: '12', c: '#fff', t: 'a: b', u: 'https://x.test', m: 'one\ntwo\n', e: '', list: [{ a: 1, b: [true] }] }
  assert.deepEqual(parseYaml(stringifyYaml(value)).value, value)
  assert.match(stringifyYaml(value), /^"on": "yes"\n/)
})

test('field validation reports the schema limits by path', () => {
  const manifest = {}
  setAt(manifest, ['provider', 'renew', 'days'], 0)
  setAt(manifest, ['view', 'app', 'color'], 'blue')
  setAt(manifest, ['cards'], [{ type: 'note', id: 'Bad Id' }, { type: 'actions', id: 'a', items: [{ icon: 'help', label: 'x', url: 'https://x.test', app: 'doctor' }] }])
  const issues = validateManifest(manifest).map(issue => `${issue.path}:${issue.code}`)
  for (const expected of ['provider.renew.days:range', 'view.app.color:pattern', 'cards.0.id:pattern', 'cards.0.text:required', 'cards.1.items:minItems', 'cards.1.items.0:oneAction']) {
    assert.ok(issues.includes(expected), `${expected} in ${issues.join(', ')}`)
  }
  setAt(manifest, ['provider', 'renew', 'days'], undefined)
  assert.equal(manifest.provider, undefined)
})

test('builder state round-trips through the compressed fragment', async () => {
  const state = { manifest: { provider: { name: { en: 'Example', ru: 'Пример' } } }, routing: 'routing:\n  scenario: work', url: 'https://example.net/reclash.yaml' }
  const hash = await encodeFragment(state)
  assert.match(hash, /^m=[\w-]+$/)
  assert.deepEqual(await decodeFragment(`#${hash}`), state)
  assert.equal(await decodeFragment('#cfg=sample'), undefined)
})

const compressedDraft = value => `m=${deflateSync(JSON.stringify(value)).toString('base64url')}`

test('a builder fragment must contain a manifest mapping and typed draft fields', async () => {
  for (const value of [
    null, { v: 2, m: {} }, { v: 1 }, { v: 1, m: null }, { v: 1, m: [] }, { v: 1, m: 'text' },
    { v: 1, m: {}, r: [] }, { v: 1, m: {}, u: 1 },
  ]) {
    await assert.rejects(() => decodeFragment(compressedDraft(value)), /Unsupported builder link/)
  }
  for (const hash of ['m=', 'm=@@@', 'm=a+b']) {
    await assert.rejects(() => decodeFragment(hash), /Unsupported builder link/)
  }
})

test('draft size is bounded before encoding and during decompression', async () => {
  const manifest = { provider: { name: 'x'.repeat(draftLimit) } }
  await assert.rejects(() => encodeFragment({ manifest, routing: '', url: '' }), /too large/)
  await assert.rejects(() => decodeFragment(compressedDraft({ v: 1, m: manifest })), /too large/)
  await assert.rejects(() => decodeFragment(`m=${'A'.repeat(draftLimit * 2 + 1)}`), /too large/)
})

test('excessively nested drafts are rejected before rendering', async () => {
  let manifest = {}
  for (let index = 0; index < 66; index++) manifest = { nested: manifest }
  await assert.rejects(() => encodeFragment({ manifest, routing: '', url: '' }), /too deeply nested/)
  await assert.rejects(() => decodeFragment(compressedDraft({ v: 1, m: manifest })), /too deeply nested/)
})

