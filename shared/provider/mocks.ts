import data from './mocks.json' with { type: 'json' }
import type { BilingualText } from '../site/routes'
import type { SubscriptionType } from './standard'

// Mock subscriptions: one record per stand. The mock-subs page, the static
// /mock/<key> bodies and their _headers block are all derived from this data,
// so a card can never claim something the served response does not carry.

export type MockTone = '' | 'warn' | 'themed'

/** Sample traffic figures. Real panels send Subscription-Userinfo per user. */
export type MockQuota = {
  uploadGb: number
  downloadGb: number
  totalGb: number
  /** Fixed Unix expiry in seconds. */
  expireAt?: number
  /** Relative expiry, recomputed at build time so the stand never goes stale. */
  expireInDays?: number
}

/** Header-level settings of a stand, stored readable; mockHeaders() encodes them. */
export type MockResponse = {
  subscriptionType?: SubscriptionType
  title?: string
  serviceName?: string
  serverInfo?: string
  hex?: string
  /** File name under /assets/mock/. */
  logo?: string
  background?: { file: string, opacity: number }
  widgets?: string
  settings?: string
  view?: string
  supportUrl?: string
  webPageUrl?: string
  buyPlan?: string
  buyTraffic?: string
  /** The header carries the Russian text, as the archived stands did. */
  announce?: BilingualText
  announceUrl?: string
  updateMinutes?: number
  expireDays?: string
  trafficPercent?: string
  newDomain?: string
  fallbackHosts?: string
  /** A service header the server sets; providers do not configure it. */
  hwidLimit?: boolean
}

export type MockProfile = {
  key: string
  tone: MockTone
  name: BilingualText
  blurb: BilingualText
  teaches: BilingualText
  nodes: number
  quota: MockQuota | null
  response: MockResponse
  /** A hand-written mihomo profile; generated from `nodes` when absent. */
  body?: string
}

export const mockProfiles = data as MockProfile[]

export const mockPath = (key: string) => `/mock/${key}`
export const mockUrl = (origin: string, key: string) => `${origin}${mockPath(key)}`
export function mockImportLink(origin: string, key: string): string {
  const response = mockProfiles.find(profile => profile.key === key)?.response
  const name = response?.title ?? response?.serviceName
  return `reclash://install-config?url=${encodeURIComponent(mockUrl(origin, key))}${name ? `&name=${encodeURIComponent(name)}` : ''}`
}
export const mockAsset = (origin: string, file: string) => `${origin}/assets/mock/${file}`

export const GB = 1024 ** 3
const DAY = 86_400

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
  return Math.floor(now / 1000 / DAY) * DAY + (quota.expireInDays ?? 0) * DAY
}

/** Ordered response headers for one stand, exactly as the static host serves them. */
export function mockHeaders(profile: MockProfile, origin: string, now = Date.now()): Array<[string, string]> {
  const r = profile.response
  const pairs: Array<[string, string | undefined]> = [
    ['Content-Type', 'text/yaml; charset=utf-8'],
    ['Content-Disposition', `attachment; filename="${profile.key}.yaml"`],
    ['Profile-Title', r.title && headerValue(r.title)],
    ['ReClash-SubscriptionType', r.subscriptionType],
    ['ReClash-ServiceName', r.serviceName && headerValue(r.serviceName)],
    ['ReClash-ServerInfo', r.serverInfo && headerValue(r.serverInfo)],
    ['ReClash-ServiceLogo', r.logo && mockAsset(origin, r.logo)],
    ['ReClash-Background', r.background && `${mockAsset(origin, r.background.file)},${r.background.opacity}`],
    ['ReClash-Widgets', r.widgets],
    ['ReClash-Settings', r.settings],
    ['ReClash-View', [r.hex && `app.color:${r.hex}`, r.view].filter(Boolean).join(';')],
    ['ReClash-SupportURL', r.supportUrl],
    ['ReClash-WebPageURL', r.webPageUrl],
    ['ReClash-BuyPlan', r.buyPlan],
    ['ReClash-BuyTraffic', r.buyTraffic],
    ['ReClash-Announce', r.announce && headerValue(r.announce.ru)],
    ['ReClash-AnnounceURL', r.announceUrl],
    ['ReClash-AutoUpdateInterval', r.updateMinutes ? String(r.updateMinutes) : undefined],
    ['ReClash-ExpireDays', r.expireDays],
    ['ReClash-TrafficPercent', r.trafficPercent],
    ['ReClash-NewDomain', r.newDomain],
    ['ReClash-FallbackHosts', r.fallbackHosts],
    ['X-Hwid-Max-Devices-Reached', r.hwidLimit ? '1' : undefined],
  ]
  const q = profile.quota
  if (q) {
    pairs.push(['Subscription-Userinfo',
      `upload=${q.uploadGb * GB}; download=${q.downloadGb * GB}; total=${q.totalGb * GB}; expire=${mockExpire(q, now)}`])
  }
  return pairs.filter((pair): pair is [string, string] => Boolean(pair[1]))
}

/** Response headers that only the static host adds: any origin may fetch a stand, nothing is cached. */
export const mockTransportHeaders: Array<[string, string]> = [
  ['Access-Control-Allow-Origin', '*'],
  ['Cache-Control', 'no-store'],
]

/** A minimal, valid mihomo profile with fake nodes that route nowhere. */
export function mockBody(profile: MockProfile): string {
  const head = `# Mock subscription: ${profile.key}. Fake nodes, for testing ReClash only.\n`
  if (profile.body) return head + profile.body
  const group = profile.response.serviceName ?? profile.key
  const names = Array.from({ length: profile.nodes }, (_, i) => `${group} ${String(i + 1).padStart(2, '0')}`)
  const nodes = names.map((name, i) =>
    `  - {name: "${name}", type: ss, server: 127.0.0.1, port: ${8388 + i}, cipher: aes-256-gcm, password: mock}`)
  return `${head}mixed-port: 7890\nmode: rule\nproxies:\n${nodes.join('\n')}\n`
    + `proxy-groups:\n  - {name: "${group}", type: select, proxies: [${names.map(name => `"${name}"`).join(', ')}, DIRECT]}\n`
    + `rules:\n  - MATCH,${group}\n`
}
