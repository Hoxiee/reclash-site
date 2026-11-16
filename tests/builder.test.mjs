import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { deflateSync } from 'node:zlib'
import { reactive, isProxy, toRaw } from 'vue'
import { excludedRoot, schemaPaths } from '../shared/provider/builder/schema.ts'
import { formEntries, formSections } from '../shared/provider/builder/form.ts'
import { decodeFragment, draftLimit, emitManifest, encodeFragment, importManifest, setAt } from '../shared/provider/builder/document.ts'
import { validateManifest } from '../shared/provider/builder/validate.ts'
import { parseYaml, stringifyYaml } from '../shared/provider/builder/yaml.ts'
import { DraftHistory, historyBudget, historyGroupWindow, historyLimit } from '../shared/provider/builder/history.ts'
import { createCard, mergeStarter, searchFields, starters } from '../shared/provider/builder/workbench.ts'
import { cloneValue, ManifestVersionError } from '../shared/provider/builder/document.ts'

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


test('each starter and newly added card validates in both published languages', () => {
  for (const language of ['ru', 'en']) {
    for (const starter of starters) {
      const manifest = starter.value(language)
      assert.deepEqual(validateManifest(manifest), [], `${language}/${starter.key}`)
      assert.deepEqual(importManifest(emitManifest(manifest)).manifest, manifest)
    }
    for (const type of ['banner', 'note', 'actions']) {
      assert.deepEqual(validateManifest({ cards: [createCard(type, `${type}-1`, language)] }), [], type)
    }
  }
})

test('starters fill missing values without overwriting false, strings or explicit lists', () => {
  const original = { provider: { name: 'My VPN', 'hide-url': false }, widgets: [], view: { app: { color: '#123456' } } }
  const sample = { provider: { name: 'Example', 'hide-url': true, 'web-url': 'https://example.com' }, widgets: ['health'], view: { app: { color: '#FFFFFF', style: 'soft' } } }
  const result = mergeStarter(original, sample)
  assert.deepEqual(result.manifest, { provider: { name: 'My VPN', 'hide-url': false, 'web-url': 'https://example.com' }, widgets: [], view: { app: { color: '#123456', style: 'soft' } } })
  assert.deepEqual(result.added, ['provider.web-url', 'view.app.style'])
  assert.deepEqual(original.provider, { name: 'My VPN', 'hide-url': false })
  result.manifest.provider.name = 'Changed'
  assert.equal(original.provider.name, 'My VPN')
  assert.deepEqual(mergeStarter(result.manifest, sample).added, [])
})

test('explicit empty lists survive editing, validation, YAML and the draft link', async () => {
  const manifest = {}
  for (const path of [['reminders', 'expire-days'], ['reminders', 'traffic-percent'], ['widgets'], ['apps', 'exclude']]) setAt(manifest, path, [])
  assert.deepEqual(validateManifest(manifest), [])
  const yaml = emitManifest(manifest)
  assert.match(yaml, /expire-days: \[\]/)
  assert.match(yaml, /widgets: \[\]/)
  assert.deepEqual(importManifest(yaml).manifest, manifest)
  const state = { manifest, routing: '', url: '' }
  assert.deepEqual(await decodeFragment(await encodeFragment(state)), state)
  setAt(manifest, ['reminders', 'expire-days'], undefined)
  assert.deepEqual(manifest.reminders, { 'traffic-percent': [] })
})

test('an unsupported import version is rejected rather than silently rewritten', () => {
  for (const version of ['2', '0', '"1"', 'true']) assert.throws(() => importManifest(`version: ${version}\nprovider:\n  name: Wrong version\n`), ManifestVersionError)
  assert.deepEqual(importManifest('provider:\n  name: Partial\n').manifest, { provider: { name: 'Partial' } })
})

test('field search matches both languages and folds Russian yo and separators', () => {
  assert.equal(searchFields('view.app.color', {}, 'ru')[0].target, 'view.app.color')
  assert.ok(searchFields('цвет темной', {}, 'en').some(match => match.target === 'view.app.color-dark'))
  assert.ok(searchFields('dark theme logo', {}, 'ru').some(match => match.target === 'provider.logo-dark'))
  assert.ok(searchFields('service name', { provider: { name: 'Own' } }, 'ru').some(match => match.target === 'provider.name' && match.configured))
  assert.deepEqual(searchFields('not-a-real-field-xyz', {}, 'en'), [])
  assert.deepEqual(searchFields('  ', {}, 'en'), [])
  assert.ok(searchFields('version', {}, 'en').every(match => match.path !== 'version'))
})

test('search targets concrete cards and labels or their empty parent', () => {
  const manifest = { cards: [createCard('note', 'note-1', 'en'), createCard('banner', 'banner-1', 'en')], 'power-labels': { on: [{ title: 'Protected' }] } }
  assert.deepEqual(searchFields('cards.title', manifest, 'en').filter(match => match.path.endsWith('.title')).map(match => match.target), ['cards.1.title'])
  assert.equal(searchFields('cards.title', {}, 'en')[0].target, 'cards')
  assert.equal(searchFields('power-labels.on.title', manifest, 'en')[0].target, 'power-labels.on.0.title')
  assert.equal(searchFields('power-labels.on.title', {}, 'en')[0].target, 'power-labels.on')
})

const draft = (name = '', url = '') => ({ manifest: name ? { provider: { name } } : {}, routing: '', url })

test('history groups typing but keeps separate fields and transactions undoable', () => {
  const history = new DraftHistory(draft())
  history.record(draft('A'), 'provider.name', 100)
  history.record(draft('Acme'), 'provider.name', 200)
  assert.equal(history.length, 2)
  assert.deepEqual(history.undo(), draft())
  assert.deepEqual(history.redo(), draft('Acme'))
  history.record(draft('Acme', 'https://example.com/reclash.yaml'), 'url', 210)
  assert.equal(history.length, 3)
  assert.deepEqual(history.undo(), draft('Acme'))
  assert.deepEqual(history.undo(), draft())
  assert.equal(history.undo(), undefined)
  assert.deepEqual(history.redo(), draft('Acme'))
})

test('history records pauses and removes redo only for an actual new edit', () => {
  const history = new DraftHistory(draft())
  history.record(draft('First'), 'name', 1)
  history.record(draft('Second'), 'name', historyGroupWindow + 2)
  assert.equal(history.length, 3)
  assert.deepEqual(history.undo(), draft('First'))
  history.record(draft('First'))
  assert.equal(history.canRedo, true)
  history.record(draft('Third'))
  assert.equal(history.canRedo, false)
  assert.deepEqual(history.undo(), draft('First'))
})

test('undo snapshots own their values and preserve routing and the deployment URL', () => {
  const first = { ...draft('First', 'https://example.com/reclash.yaml'), routing: 'routing:\n  profiles: {}' }
  const history = new DraftHistory(first)
  first.manifest.provider.name = 'Mutated outside'
  history.record(draft('Next'))
  const restored = history.undo()
  assert.equal(restored.manifest.provider.name, 'First')
  assert.equal(restored.routing, first.routing)
  assert.equal(restored.url, first.url)
  restored.manifest.provider.name = 'Mutated result'
  history.redo()
  assert.equal(history.undo().manifest.provider.name, 'First')
})

test('typing back to the starting value does not leave an empty undo step', () => {
  const history = new DraftHistory(draft())
  history.record(draft('A'), 'name', 1)
  history.record(draft(), 'name', 2)
  assert.equal(history.length, 1)
  assert.equal(history.canUndo, false)
})

test('history is bounded by both entry count and stored string memory', () => {
  const history = new DraftHistory(draft())
  for (let index = 0; index < historyLimit + 10; index++) history.record(draft(String(index)))
  assert.equal(history.length, historyLimit)
  const large = new DraftHistory(draft())
  for (let index = 0; index < historyLimit; index++) large.record(draft(`${index}:${'x'.repeat(historyBudget / 32)}`))
  assert.ok(large.length < historyLimit)
  assert.ok(large.length >= 2)
  assert.ok(large.undo())
})

test('a snapshot over the history budget can be undone without retaining its oversized redo', () => {
  const history = new DraftHistory(draft())
  history.record(draft('Kept'))
  history.record(draft('x'.repeat(historyBudget / 2 + 1)))
  assert.equal(history.length, 2)
  assert.equal(history.canUndo, true)
  assert.deepEqual(history.undo(), draft('Kept'))
  assert.equal(history.canRedo, false)
  assert.equal(history.redo(), undefined)
})

test('editing repairs malformed containers and creates lists for numeric instance paths', () => {
  const manifest = { provider: [], 'power-labels': [] }
  setAt(manifest, ['provider', 'name'], 'Repaired')
  setAt(manifest, ['power-labels', 'off', 0, 'title'], 'Connect')
  setAt(manifest, ['cards', 0, 'type'], 'note')
  setAt(manifest, ['cards', 0, 'id'], 'note-1')
  setAt(manifest, ['cards', 0, 'text'], 'Notice')
  assert.deepEqual(manifest.provider, { name: 'Repaired' })
  assert.deepEqual(manifest['power-labels'], { off: [{ title: 'Connect' }] })
  assert.deepEqual(manifest.cards, [{ type: 'note', id: 'note-1', text: 'Notice' }])
  assert.deepEqual(validateManifest(manifest), [])
  assert.deepEqual(importManifest(emitManifest(manifest)).manifest, manifest)
})

test('cloning and applying templates remain safe after reactive list edits', () => {
  const manifest = reactive({})
  setAt(manifest, ['cards'], [createCard('banner', 'banner-1', 'en')])
  setAt(manifest, ['cards'], [...manifest.cards, createCard('actions', 'actions-1', 'en')])
  setAt(manifest, ['cards', 1, 'items'], [...manifest.cards[1].items].reverse())
  assert.equal(isProxy(toRaw(manifest).cards[0]), false)
  const result = mergeStarter(manifest, { provider: { name: 'Example' } })
  assert.equal(isProxy(result.manifest.cards[0]), false)
  assert.equal(result.manifest.cards[1].items[0].label, 'Support')
  assert.doesNotThrow(() => structuredClone(result.manifest))
  const card = cloneValue(manifest.cards[1])
  card.items[0].label = 'Changed copy'
  assert.equal(manifest.cards[1].items[0].label, 'Support')
  assert.equal(cloneValue({ number: Infinity }).number, Infinity)
})
