import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import { mockBody, mockBuilderState, mockConfig, mockHeaders, mockManifest, mockNodeCount, mockProfiles, mockSections } from '../shared/provider/mocks.ts'
import { mockFacts, mockStrip, mockText, mockTheme } from '../shared/provider/mockview.ts'
import { mockPreview } from '../shared/provider/mockpreview.ts'
import { validateManifest } from '../shared/provider/builder/validate.ts'
import { parseYaml } from '../shared/provider/builder/yaml.ts'

const origin = 'https://reclash.pages.dev'
const now = Date.UTC(2026, 10, 17, 13, 0, 0)
const withConfig = mockProfiles.filter(profile => mockConfig(profile, origin, now))

const context = vm.createContext({ console })
context.globalThis = context
vm.runInContext(readFileSync(new URL('../public/runtime/kernel.js', import.meta.url), 'utf8'), context)
const kernel = context.reclashKernel

test('the catalogue keeps seven stands in order, one featured', () => {
  assert.deepEqual(mockProfiles.map(profile => profile.key), ['halo', 'ember', 'nimbus', 'aurora', 'sentinel', 'bastion', 'atlas'])
  assert.deepEqual(mockProfiles.filter(profile => profile.featured).map(profile => profile.key), ['halo'])
  assert.equal(new Set(mockProfiles.map(profile => profile.scenario.en)).size, mockProfiles.length)
})

test('Nimbus is genuinely bare', () => {
  const nimbus = mockProfiles.find(profile => profile.key === 'nimbus')
  assert.equal(mockConfig(nimbus, origin, now), undefined)
  assert.equal(mockManifest(nimbus, origin, now), undefined)
  assert.equal(nimbus.quota, null)
  assert.deepEqual(nimbus.headers, { title: 'Nimbus' })
  assert.equal(mockNodeCount(nimbus), 2)
})

test('every hosted config round-trips, validates and has no unresolved tokens', () => {
  assert.equal(withConfig.length, mockProfiles.length - 1)
  for (const profile of withConfig) {
    const text = mockConfig(profile, origin, now)
    assert.ok(text.startsWith('# yaml-language-server: $schema=https://reclash.pages.dev/schemas/provider-config.schema.json\nversion: 1\n'), profile.key)
    const { value } = parseYaml(text)
    const resolved = mockManifest(profile, origin, now)
    for (const [key, section] of Object.entries(resolved)) assert.deepEqual(value[key], section, `${profile.key}.${key}`)
    assert.equal(value.routing !== undefined, Boolean(profile.routing), profile.key)
    assert.deepEqual(validateManifest(resolved), [], profile.key)
    assert.doesNotMatch(JSON.stringify(resolved), /"(?:asset|time|host|origin):/, profile.key)
    assert.doesNotMatch(text, /(?:^|[\s"'])(?:asset|time|origin):/m, profile.key)
    const cards = resolved.cards ?? []
    assert.ok(cards.length <= 8, profile.key)
    assert.equal(new Set(cards.map(card => card.id)).size, cards.length, profile.key)
  }
})

test('relative times count from the start of the UTC day', () => {
  const halo = mockManifest(mockProfiles[0], origin, now)
  const day = Date.UTC(2026, 10, 17) / 1000
  assert.equal(halo.cards[0].countdown, day + 5 * 86_400)
  assert.equal(halo.cards[0].when.from, day - 86_400)
  assert.equal(halo.cards[0].when.until, day + 30 * 86_400)
  assert.equal(mockManifest(mockProfiles[1], origin, now).transport['new-domain'], 'reclash.pages.dev')
  assert.equal(mockManifest(mockProfiles[1], 'http://127.0.0.1:4173', now).transport['new-domain'], '127.0.0.1:4173')
})

test("the app's own parser accepts every config without warnings", () => {
  assert.equal(typeof kernel?.parse, 'function')
  for (const profile of withConfig) {
    const result = JSON.parse(kernel.parse(mockConfig(profile, origin, now), 'en'))
    assert.deepEqual({ ok: result.ok, warnings: result.warnings }, { ok: true, warnings: [] }, profile.key)
  }
})

test('bodies carry unique loopback ports and passwords, with DIRECT first in the first group', () => {
  const ports = [], passwords = []
  for (const profile of mockProfiles) {
    const body = mockBody(profile)
    assert.ok(body.startsWith(`# Mock subscription: ${profile.key}. Fake nodes, for testing ReClash only.\n`))
    ports.push(...[...body.matchAll(/, port: (\d+)/g)].map(match => match[1]))
    passwords.push(...[...body.matchAll(/password: "([^"]+)"/g)].map(match => match[1]))
    assert.equal(body.match(/server: 127\.0\.0\.1/g).length, mockNodeCount(profile), profile.key)
    const [first] = profile.body.groups
    assert.equal(first.type, 'select')
    assert.equal(first.proxies[0], 'DIRECT')
    assert.ok(body.includes(`MATCH,${first.name}`))
    const names = new Set([...profile.body.nodes, 'DIRECT'])
    for (const group of profile.body.groups) for (const proxy of group.proxies) assert.ok(names.has(proxy), `${profile.key}: ${proxy}`)
  }
  assert.equal(new Set(ports).size, ports.length)
  assert.equal(new Set(passwords).size, passwords.length)
})

test('Bastion lists a strict subset of its nodes in GLOBAL and keeps its apps outside the tunnel', () => {
  const bastion = mockProfiles.find(profile => profile.key === 'bastion')
  const global = bastion.body.groups.find(group => group.name === 'GLOBAL')
  assert.ok(global.proxies.length < bastion.body.nodes.length)
  assert.deepEqual(bastion.body.tun['exclude-package'], bastion.manifest.apps.exclude)
  assert.equal(bastion.manifest.policy.global, 'listed')
})

test('headers use registry names only and carry the stand data', () => {
  for (const profile of mockProfiles) {
    const names = mockHeaders(profile, origin, now).map(([name]) => name.toLowerCase())
    assert.equal(names.includes('reclash-config'), profile.key !== 'nimbus')
    assert.ok(names.every(name => name.startsWith('content-') || !name.startsWith('reclash-') || name === 'reclash-config'))
  }
  const sentinel = Object.fromEntries(mockHeaders(mockProfiles.find(profile => profile.key === 'sentinel'), origin, now))
  assert.equal(sentinel['Support-Url'], 'https://example.com/support')
  assert.equal(sentinel['Profile-Update-Interval'], '12')
  const bastion = Object.fromEntries(mockHeaders(mockProfiles.find(profile => profile.key === 'bastion'), origin, now))
  assert.equal(bastion['Hide-Url'], 'true')
})

test('sections, builder state and views derive from the new fields', () => {
  const by = key => mockProfiles.find(profile => profile.key === key)
  assert.deepEqual(mockSections(by('nimbus')), [])
  assert.deepEqual(mockSections(by('aurora')), ['provider', 'view'])
  assert.ok(mockSections(by('atlas')).includes('routing'))
  assert.ok(mockSections(by('sentinel')).includes('quota') && mockSections(by('sentinel')).includes('headers'))
  const state = mockBuilderState(by('atlas'), origin, now)
  assert.equal(state.url, `${origin}/mock/atlas`)
  assert.ok(!('version' in state.manifest) && state.routing.startsWith('routing:'))
  assert.equal(mockTheme(by('halo')).seed, '3FD8C2')
  assert.equal(mockTheme(by('halo')).pureBlack, true)
  assert.deepEqual(mockTheme(by('halo')).wallpaper, { file: 'halo-wallpaper.svg', opacity: 36 })
  assert.equal(mockText({ en: 'Hello', ru: 'Привет' }, 'ru'), 'Привет')
  assert.equal(mockText({ en: 'Hello' }, 'ru'), 'Hello')
  assert.equal(mockText('plain', 'en'), 'plain')
  assert.equal(mockFacts(by('sentinel'), now, 'en').name, 'Sentinel Trial')
  assert.equal(mockFacts(by('sentinel'), now, 'ru').name, 'Sentinel: пробный период')
  assert.equal(mockStrip(by('sentinel'), now, 'en').offers.length, 2)
  assert.equal(mockStrip(by('ember'), now, 'en').offers.length, 0)
  assert.equal(mockPreview(by('nimbus')).provider.name, 'Nimbus')
})
