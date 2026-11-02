import { test, expect } from '@playwright/test'
import { GB, mockProfiles } from '../../shared/provider/mocks'
import { providerStandard } from '../../shared/provider/standard'

const keys = ['ember', 'nimbus', 'aurora', 'sentinel']
const errors: string[] = []
test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (/hydration/i.test(message.text())) errors.push(message.text()) })
})
test.afterEach(() => { expect(errors).toEqual([]) })

test('the catalogue keeps four distinct scenarios and a genuinely bare profile', () => {
  expect(mockProfiles.map(profile => profile.key)).toEqual(keys)
  expect(new Set(mockProfiles.map(profile => profile.scenario.en)).size).toBe(4)
  expect(mockProfiles.find(profile => profile.key === 'nimbus')!.response).toEqual({ title: 'Nimbus' })
})

for (const [language, heading] of [['ru', 'Мок-подписки'], ['en', 'Mock subscriptions']] as const) {
  test(`mock subscriptions page lists every stand with encoded import links (${language})`, async ({ page }) => {
    await page.goto(`/${language}/mock-subs`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
    await expect(page.locator('.mock-warn')).toBeVisible()
    await expect(page.locator('.mock-stand')).toHaveCount(keys.length)
    for (const profile of mockProfiles) {
      const stand = page.locator(`#mock-${profile.key}`)
      await expect(stand.locator('.mock-stand-tone')).toHaveText(profile.scenario[language])
      const url = (await stand.locator('.mock-url pre code').textContent())!.trim()
      expect(url).toMatch(new RegExp(`^https?://[^/]+/mock/${profile.key}$`))
      const link = new URL((await stand.locator('.mock-acts a').getAttribute('href'))!)
      expect(link.protocol).toBe('reclash:')
      expect(link.host).toBe('install-config')
      expect(link.searchParams.get('url')).toBe(url)
      expect(link.searchParams.get('name')).toBe((await stand.locator('h3').textContent())!.trim())
    }
    await expect(page.locator('#mock-ember .mock-pv')).toHaveClass(/theme-scope/)
    const ember = page.locator('#mock-ember .mock-yaml')
    await ember.locator('summary').click()
    await expect(ember.locator('pre code')).toContainText('Fake nodes, for testing ReClash only.')
  })

  test(`previews distinguish missing metadata, branding and trial warnings (${language})`, async ({ page }) => {
    await page.goto(`/${language}/mock-subs`)
    const nimbus = page.locator('#mock-nimbus')
    await expect(nimbus.locator('.mock-app-words b')).toHaveText('Nimbus')
    await expect(nimbus.locator('.mock-orb, .mock-app-bg, .mock-app-note, .mock-app-type, .mock-strip')).toHaveCount(0)
    await expect(nimbus.locator('.mock-facts > div')).toHaveCount(1)
    await expect(nimbus.locator('.mock-facts dd')).toHaveText('2')
    const aurora = page.locator('#mock-aurora')
    await expect(aurora.locator('.mock-orb-logo')).toHaveAttribute('src', '/assets/mock/logo-aurora.svg')
    await expect(aurora.locator('.mock-app-bg, .mock-app-note, .mock-app-type, .mock-strip')).toHaveCount(0)
    await expect(aurora.locator('.mock-facts > div')).toHaveCount(1)
    const sentinel = page.locator('#mock-sentinel')
    await expect(sentinel.locator('.mock-app-type')).toHaveText(language === 'ru' ? 'Промо' : 'Promo')
    await expect(sentinel.locator('.mock-strip-bar')).toHaveClass(/is-error/)
    await expect(sentinel.locator('.mock-strip-pill')).toHaveClass(/is-error/)
    await expect(sentinel.locator('.mock-strip-offers > span')).toHaveCount(2)
    await expect(sentinel.locator('.mock-orb, .mock-app-bg')).toHaveCount(0)
    await expect(page.locator('#mock-ember .mock-pv')).toHaveClass(/is-black/)
    await expect(page.locator('#mock-ember .mock-app-bg')).toHaveCount(1)
  })
}

test('mock endpoints serve the YAML body with the headers the page shows', async ({ page, request }) => {
  await page.goto('/en/mock-subs')
  for (const profile of mockProfiles) {
    const rows = await page.locator(`#mock-${profile.key} .mock-hdr`).evaluateAll(items => items.map(item => [
      item.querySelector('dt')!.textContent!.trim(), item.querySelector('dd')!.textContent!.trim(),
    ]))
    const response = await request.get(`/mock/${profile.key}`)
    expect(response.status()).toBe(200)
    const headers = response.headers()
    expect(headers['access-control-allow-origin']).toBe('*')
    expect(headers['cache-control']).toBe('no-store')
    expect(headers['content-type']).toBe('text/yaml; charset=utf-8')
    expect(headers['reclash-subscriptiontype']).toBe(profile.response.subscriptionType)
    for (const [name, value] of rows) expect(headers[name!.toLowerCase()], name).toBe(value)
    const supported = new Set(providerStandard.fields.map(field => field.name))
    for (const name of Object.keys(headers).filter(name => name.startsWith('reclash-'))) expect(supported.has(name), name).toBe(true)
    const body = await response.text()
    expect(body.startsWith(`# Mock subscription: ${profile.key}. Fake nodes, for testing ReClash only.\n`)).toBe(true)
    expect(body).toContain('proxy-groups:')
    expect(body.match(/server: 127\.0\.0\.1/g)).toHaveLength(profile.nodes)
    expect(body).not.toContain('<html')
  }
})

test('Nimbus serves a name and nodes without optional subscription metadata', async ({ request }) => {
  const response = await request.get('/mock/nimbus')
  const headers = response.headers()
  expect(headers['profile-title']).toBe('Nimbus')
  expect(Object.keys(headers).filter(name => name.startsWith('reclash-'))).toEqual([])
  expect(headers['subscription-userinfo']).toBeUndefined()
  expect(headers['profile-update-interval']).toBeUndefined()
  expect(await response.text()).toContain('name: "Nimbus 01"')
  const preview = await request.get('/mock-preview/nimbus.json')
  expect(await preview.json()).toEqual({ version: 1, provider: { name: 'Nimbus' } })
})

test('Aurora adds only branding while Sentinel exposes limits without theming', async ({ request }) => {
  const aurora = (await request.get('/mock/aurora')).headers()
  expect(Object.keys(aurora).filter(name => name.startsWith('reclash-')).sort()).toEqual([
    'reclash-servicelogo', 'reclash-servicename', 'reclash-view',
  ])
  expect(aurora['reclash-view']).toBe('app.color:6E55F5')
  expect(aurora['subscription-userinfo']).toBeUndefined()
  const sentinel = (await request.get('/mock/sentinel')).headers()
  expect(sentinel['reclash-subscriptiontype']).toBe('promo')
  expect(sentinel['reclash-restrictions']).toBe('noglobal')
  expect(sentinel['reclash-view']).toBeUndefined()
  expect(sentinel['reclash-background']).toBeUndefined()
  expect(sentinel['reclash-buyplan']).toBe('https://example.com/renew')
  expect(sentinel['reclash-buytraffic']).toBe('https://example.com/topup')
  expect(sentinel['reclash-expiredays']).toBe('3,1')
  expect(sentinel['reclash-trafficpercent']).toBe('80,95')
  expect(sentinel['subscription-userinfo']).toContain(`upload=${9 * GB}; download=${38 * GB}; total=${50 * GB}`)
})

test('Ember serves full presentation hints and a shared widget list', async ({ request }) => {
  const headers = (await request.get('/mock/ember')).headers()
  expect(headers['reclash-view']).toContain('app.style:vivid;app.black:true;app.navbar:floating;app.tabs:slide;app.glass:ultra')
  expect(headers['reclash-background']).toMatch(/\/assets\/mock\/bg-ember\.svg,22$/)
  expect(headers['reclash-powerbutton']).toBe('shape:sharpBurst,puffyDiamond,clover8Leaf;type:tonal')
  expect(headers['reclash-widgets']!.split(',')).toEqual(['health', 'outboundMode', 'speedTest', 'serviceStatus', 'ipQuality', 'trustedNetworks', 'path'])
  for (const flag of ['autorun', 'autostart']) expect(headers['reclash-settings']!.split(',')).not.toContain(flag)
  expect(headers['reclash-webpageurl']).toBe('https://example.com/account')
  expect(headers['reclash-announceurl']).toBe('https://example.com/news')
})

test('removed stands no longer serve subscription bodies', async ({ request }) => {
  for (const key of ['relay', 'gatekeeper', 'meridian', 'ledger']) {
    const response = await request.get(`/mock/${key}`)
    expect(response.status()).toBe(404)
  }
})

test('all four stands fit a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/ru/mock-subs')
  for (const key of keys) {
    await page.locator(`#mock-${key}`).scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})
