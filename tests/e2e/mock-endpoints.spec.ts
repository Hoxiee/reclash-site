import { test, expect } from '@playwright/test'
import { GB, mockBody, mockConfig, mockHeaders, mockNodeCount, mockProfiles } from '../../shared/provider/mocks'
import { providerStandard } from '../../shared/provider/standard'

const keys = ['halo', 'ember', 'nimbus', 'aurora', 'sentinel', 'bastion', 'atlas']
const supported = new Set(providerStandard.headers.map(header => header.name.toLowerCase()))

test('the catalogue keeps seven distinct stands and a genuinely bare profile', () => {
  expect(mockProfiles.map(profile => profile.key)).toEqual(keys)
  expect(new Set(mockProfiles.map(profile => profile.scenario.en)).size).toBe(keys.length)
  const nimbus = mockProfiles.find(profile => profile.key === 'nimbus')!
  expect(nimbus.headers).toEqual({ title: 'Nimbus' })
  expect(nimbus.manifest).toBeUndefined()
  expect(nimbus.quota).toBeNull()
})

for (const profile of mockProfiles) {
  test(`stand ${profile.key} serves the headers, config and body of its record`, async ({ request }) => {
    const response = await request.get(`/mock/${profile.key}`)
    expect(response.status()).toBe(200)
    const headers = response.headers()
    expect(headers['access-control-allow-origin']).toBe('*')
    expect(headers['cache-control']).toBe('no-store')
    expect(headers['content-type']).toBe('text/yaml; charset=utf-8')
    for (const name of Object.keys(headers).filter(name => name.startsWith('reclash-'))) expect(supported.has(name), name).toBe(true)

    const pointer = headers['reclash-config']
    expect(pointer === undefined, 'reclash-config').toBe(profile.key === 'nimbus')
    const origin = pointer ? new URL(pointer).origin : 'http://127.0.0.1:4173'
    for (const [name, value] of mockHeaders(profile, origin)) expect(headers[name.toLowerCase()], name).toBe(value)
    if (profile.quota) expect(headers['subscription-userinfo']).toContain(`total=${profile.quota.totalGb * GB}`)
    else expect(headers['subscription-userinfo']).toBeUndefined()

    const body = await response.text()
    expect(body).toBe(mockBody(profile))
    expect(body.startsWith(`# Mock subscription: ${profile.key}. Fake nodes, for testing ReClash only.\n`)).toBe(true)
    expect(body.match(/server: 127\.0\.0\.1/g)).toHaveLength(mockNodeCount(profile))
    expect(body.indexOf('"DIRECT"')).toBeGreaterThan(body.indexOf('proxy-groups:'))
    expect(body).toMatch(new RegExp(`proxy-groups:\\n  - \\{name: "${profile.body.groups[0]!.name}", type: select, proxies: \\["DIRECT"`))
    expect(body).not.toContain('<html')

    if (!pointer) return
    const path = new URL(pointer).pathname
    expect(path).toBe(`/mock-config/${profile.key}.yaml`)
    const config = await request.get(path)
    expect(config.status()).toBe(200)
    expect(config.headers()['content-type']).toBe('text/yaml; charset=utf-8')
    expect(config.headers()['access-control-allow-origin']).toBe('*')
    expect(await config.text()).toBe(mockConfig(profile, origin))
  })
}

test('stands keep their ports unique across the catalogue', async ({ request }) => {
  const ports: string[] = []
  for (const key of keys) {
    const body = await (await request.get(`/mock/${key}`)).text()
    ports.push(...[...body.matchAll(/, port: (\d+)/g)].map(match => match[1]!))
  }
  expect(new Set(ports).size).toBe(ports.length)
})

test('Nimbus serves a name and nodes without optional subscription metadata', async ({ request }) => {
  const response = await request.get('/mock/nimbus')
  const headers = response.headers()
  expect(headers['profile-title']).toBe('Nimbus')
  expect(Object.keys(headers).filter(name => name.startsWith('reclash-'))).toEqual([])
  expect(headers['subscription-userinfo']).toBeUndefined()
  expect(headers['profile-update-interval']).toBeUndefined()
  expect(await response.text()).toContain('name: "Nimbus 01"')
  expect((await request.get('/mock-config/nimbus.yaml')).status()).toBe(404)
  const preview = await request.get('/mock-preview/nimbus.json')
  expect(await preview.json()).toEqual({ version: 1, provider: { name: 'Nimbus' } })
})

test('Sentinel passes support and website links through headers', async ({ request }) => {
  const headers = (await request.get('/mock/sentinel')).headers()
  expect(headers['support-url']).toBe('https://example.com/support')
  expect(headers['profile-web-page-url']).toBe('https://example.com/account')
  expect(headers['profile-update-interval']).toBe('12')
  const config = await (await request.get(new URL(headers['reclash-config']!).pathname)).text()
  expect(config).not.toMatch(/support-url|web-url|view:/)
  expect(config).toContain('policy:\n  global: "off"')
})

test('Bastion hides its URL through both the header and the manifest', async ({ request }) => {
  const headers = (await request.get('/mock/bastion')).headers()
  expect(headers['hide-url']).toBe('true')
  const config = await (await request.get(new URL(headers['reclash-config']!).pathname)).text()
  expect(config).toContain('  hide-url: true')
  expect(config).toContain('  global: listed')
  expect(config).toContain('  new-domain: ')
  expect(config).not.toMatch(/\bhost:/)
})

test('removed stands no longer serve subscription bodies', async ({ request }) => {
  for (const key of ['relay', 'gatekeeper', 'meridian', 'ledger']) {
    expect((await request.get(`/mock/${key}`)).status()).toBe(404)
    expect((await request.get(`/mock-config/${key}.yaml`)).status()).toBe(404)
  }
})
