import data from './mocks.json' with { type: 'json' }
import type { BilingualText } from '../site/routes'
import { providerStandard } from './standard.ts'
import { stringifyYaml } from './builder/yaml.ts'

// The page, static responses and previews share one record per stand.
export type MockTone = '' | 'warn' | 'themed' | 'strict' | 'featured'

/** Sample traffic figures. Real panels send Subscription-Userinfo per user. */
export type MockQuota = {
  uploadGb: number
  downloadGb: number
  totalGb: number
  expireAt?: number
  /** Relative expiry, recomputed at build time so the stand never goes stale. */
  expireInDays?: number
}

/** Standard response headers a stand sends. Everything else travels in the hosted manifest. */
export type MockHeaders = {
  title?: string
  updateHours?: number
  supportUrl?: string
  webPageUrl?: string
  announce?: string
  hideUrl?: boolean
}

export type MockGroup = { name: string, type: 'select' | 'url-test' | 'fallback', proxies: string[] }

export type MockProfile = {
  key: string
  tone: MockTone
  featured?: boolean
  scenario: BilingualText
  name: BilingualText
  blurb: BilingualText
  teaches: BilingualText
  quota: MockQuota | null
  headers?: MockHeaders
  /** The authored manifest, without `version` and `routing`. Strings may carry asset:, origin:, host: and time: tokens. */
  manifest?: Record<string, unknown>
  /** The raw YAML of the whole `routing:` section, emitted verbatim after the manifest. */
  routing?: string
  body: { nodes: string[], groups: MockGroup[], tun?: { 'exclude-package': string[] } }
}

export const mockProfiles = data as MockProfile[]

export const mockPath = (key: string) => `/mock/${key}`
export const mockUrl = (origin: string, key: string) => `${origin}${mockPath(key)}`
export const mockConfigPath = (key: string) => `/mock-config/${key}.yaml`
export const mockAsset = (origin: string, file: string) => `${origin}/assets/mock/${file}`

export const GB = 1024 ** 3
const DAY = 86_400
const HOUR = 3600

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined

/** The provider name for a profile that cannot ask for a language: the English text, else the profile-title header. */
function plainName(profile: MockProfile): string | undefined {
  const name = record(profile.manifest?.provider)?.name
  const text = typeof name === 'string' ? name : record(name)?.en
  return (typeof text === 'string' ? text : undefined) ?? profile.headers?.title
}

export function mockImportLink(origin: string, key: string): string {
  const profile = mockProfiles.find(item => item.key === key)
  const name = profile && plainName(profile)
  return `reclash://install-config?url=${encodeURIComponent(mockUrl(origin, key))}${name ? `&name=${encodeURIComponent(name)}` : ''}`
}

/** Plain printable ASCII stays as is; anything else goes out as base64:<utf-8>, like the builder does. */
export function headerValue(text: string): string {
  if (/^[\x20-\x7e]*$/.test(text) && !/^base64[:,]/.test(text)) return text
  let binary = ''
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte)
  return `base64:${btoa(binary)}`
}

/** Unix expiry in seconds. Relative expiries count from the start of the UTC day, so a build and its page agree. */
export function mockExpire(quota: MockQuota, now: number): number {
  if (quota.expireAt) return quota.expireAt
  return utcDay(now) + (quota.expireInDays ?? 0) * DAY
}

const utcDay = (now: number) => Math.floor(now / 1000 / DAY) * DAY

const timeToken = /^time:([+-])(\d+)([dh])$/

function resolveTokens(value: unknown, origin: string, now: number): unknown {
  if (typeof value === 'string') {
    if (value.startsWith('asset:')) return mockAsset(origin, value.slice(6))
    if (value.startsWith('origin:')) return origin + value.slice(7)
    if (value === 'host:') return new URL(origin).host
    const time = timeToken.exec(value)
    if (time) return utcDay(now) + (time[1] === '-' ? -1 : 1) * Number(time[2]) * (time[3] === 'd' ? DAY : HOUR)
    return value
  }
  if (Array.isArray(value)) return value.map(item => resolveTokens(item, origin, now))
  const object = record(value)
  if (object) return Object.fromEntries(Object.entries(object).map(([key, item]) => [key, resolveTokens(item, origin, now)]))
  return value
}

/** The manifest a stand serves, tokens resolved and `version: 1` first; routing is separate. */
export function mockManifest(profile: MockProfile, origin: string, now = Date.now()): Record<string, unknown> | undefined {
  if (!profile.manifest) return undefined
  return { version: 1, ...resolveTokens(profile.manifest, origin, now) as Record<string, unknown> }
}

const schemaComment = '# yaml-language-server: $schema=https://reclash.pages.dev/schemas/provider-config.schema.json'

/** The hosted manifest a stand names with reclash-config; undefined when the stand carries none. */
export function mockConfig(profile: MockProfile, origin: string, now = Date.now()): string | undefined {
  const manifest = mockManifest(profile, origin, now)
  const routing = profile.routing?.trim()
  if (!manifest && !routing) return undefined
  return `${schemaComment}\n${stringifyYaml(manifest ?? { version: 1 })}${routing ? `${routing}\n` : ''}`
}

/** Top-level sections a stand exercises, in file order; the UI builds its coverage matrix from them. */
export function mockSections(profile: MockProfile): string[] {
  const { title: _title, ...extra } = profile.headers ?? {}
  return [
    ...Object.keys(profile.manifest ?? {}),
    ...(profile.routing ? ['routing'] : []),
    ...(profile.quota ? ['quota'] : []),
    ...(Object.keys(extra).length ? ['headers'] : []),
  ]
}

/** What the builder takes as a draft: the manifest without version, the raw routing text and the stand URL. */
export function mockBuilderState(profile: MockProfile, origin: string, now = Date.now()): { manifest: Record<string, unknown>, routing: string, url: string } {
  const { version: _version, ...manifest } = mockManifest(profile, origin, now) ?? {}
  return { manifest, routing: profile.routing?.trim() ?? '', url: mockUrl(origin, profile.key) }
}

/** Ordered response headers for one stand: registry headers plus reclash-config; everything else is in the manifest. */
export function mockHeaders(profile: MockProfile, origin: string, now = Date.now()): Array<[string, string]> {
  const h = profile.headers ?? {}
  const pairs: Array<[string, string | undefined]> = [
    ['Content-Type', 'text/yaml; charset=utf-8'],
    ['Content-Disposition', `attachment; filename="${profile.key}.yaml"`],
    ['Profile-Title', h.title && headerValue(h.title)],
    ['Profile-Update-Interval', h.updateHours ? String(h.updateHours) : undefined],
    ['Support-Url', h.supportUrl],
    ['Profile-Web-Page-Url', h.webPageUrl],
    ['Announce', h.announce && headerValue(h.announce)],
    ['Hide-Url', h.hideUrl ? 'true' : undefined],
    ['reclash-config', mockConfig(profile, origin, now) && `${origin}${mockConfigPath(profile.key)}`],
  ]
  const q = profile.quota
  if (q) {
    pairs.push(['Subscription-Userinfo',
      `upload=${q.uploadGb * GB}; download=${q.downloadGb * GB}; total=${q.totalGb * GB}; expire=${mockExpire(q, now)}`])
  }
  const standard = new Set(providerStandard.headers.map(header => header.name.toLowerCase()))
  return pairs.filter((pair): pair is [string, string] =>
    Boolean(pair[1]) && (pair[0].startsWith('Content-') || standard.has(pair[0].toLowerCase())))
}

/** Response headers that only the static host adds: any origin may fetch a stand, nothing is cached. */
export const mockTransportHeaders: Array<[string, string]> = [
  ['Access-Control-Allow-Origin', '*'],
  ['Cache-Control', 'no-store'],
]

export const mockNodeCount = (profile: MockProfile): number => profile.body.nodes.length

const portBase = 8401

/** Loopback port of one node; unique across every stand so two imported stands never share one. */
export function mockPort(profile: MockProfile, index: number): number {
  let offset = 0
  for (const item of mockProfiles) {
    if (item.key === profile.key) return portBase + offset + index
    offset += item.body.nodes.length
  }
  return portBase + offset + index
}

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const flowList = (items: string[]) => `[${items.map(item => JSON.stringify(item)).join(', ')}]`

/** A minimal, valid mihomo profile with fake nodes that route nowhere. */
export function mockBody(profile: MockProfile): string {
  const { nodes, groups, tun } = profile.body
  const proxies = nodes.map((name, index) =>
    `  - {name: ${JSON.stringify(name)}, type: ss, server: 127.0.0.1, port: ${mockPort(profile, index)}, cipher: aes-256-gcm, password: ${JSON.stringify(`mock-${slug(name)}`)}}`)
  const proxyGroups = groups.map(group => {
    const probe = group.type === 'select' ? '' : `, url: "https://www.gstatic.com/generate_204", interval: 300`
    return `  - {name: ${JSON.stringify(group.name)}, type: ${group.type}, proxies: ${flowList(group.proxies)}${probe}}`
  })
  return `# Mock subscription: ${profile.key}. Fake nodes, for testing ReClash only.\n`
    + 'mixed-port: 7890\nmode: rule\nlog-level: info\n'
    + (tun ? `tun:\n  exclude-package: ${flowList(tun['exclude-package'])}\n` : '')
    + `proxies:\n${proxies.join('\n')}\nproxy-groups:\n${proxyGroups.join('\n')}\n`
    + `rules:\n  - MATCH,${groups[0]!.name}\n`
}
